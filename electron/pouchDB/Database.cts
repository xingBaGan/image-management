import PouchDB from 'pouchdb';
import PouchDBFind from 'pouchdb-find';
import { LocalImageData, FilterType, FilterOptions, SortType, SortDirection, FetchDataResult } from '../dao/type.cjs';
import RelationalPouch from 'relational-pouch';
import * as fs from 'fs/promises';
import * as lodash from 'lodash';

// 新增：可选引入 memory 适配器
import MemoryAdapter from 'pouchdb-adapter-memory';
// Register PouchDB plugins
PouchDB.plugin(RelationalPouch);
PouchDB.plugin(PouchDBFind);
PouchDB.plugin(MemoryAdapter);

export interface ColorInfo {
    color: string;
    percentage: number;
}
// Types
export interface Image {
    _id?: string;          // PouchDB 主键
    rev?: string;         // PouchDB 版本号
    id: string;            // 业务ID
    path: string;
    name: string;
    extension: string;
    size: number;
    dateCreated: string;
    dateModified: string;
    tags: string[];
    favorite: boolean;
    categories: string[];
    type: 'video' | 'image';
    width: number;
    height: number;
    ratio?: string;
    duration?: number;
    thumbnail?: string;
    isBindInFolder: boolean;
    rating: number;
    colors: ColorInfo[];
}

export interface Category {
    _id?: string;          // PouchDB 主键
    rev?: string;         // PouchDB 版本号
    id: string;            // 业务ID
    name: string;
    images: string[];
    count: number;
    folderPath?: string;
    isImportFromFolder?: boolean;
    children?: Category['id'][];
    father?: Category['id'] | null; // 新增父分类属性
    order?: string;
    level?: number;
}

function compare(oriImage: Image | Category, newImage: Image | Category) {
    return lodash.isEqual(oriImage, newImage);
}

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};

const isSimilarColor = (color1: string, color2: string, precision: number = 0.8): boolean => {
    // 确保精度在有效范围内
    precision = Math.max(0.1, Math.min(1, precision));

    // 转换为RGB
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);

    if (!rgb1 || !rgb2) return false;

    // 计算欧几里得距离
    const distance = Math.sqrt(
        Math.pow(rgb1.r - rgb2.r, 2) +
        Math.pow(rgb1.g - rgb2.g, 2) +
        Math.pow(rgb1.b - rgb2.b, 2)
    );

    // 最大可能距离是 sqrt(255^2 + 255^2 + 255^2) ≈ 441.67
    const maxDistance = Math.sqrt(3 * Math.pow(255, 2));

    // 计算相似度（0到1之间）
    const similarity = 1 - (distance / maxDistance);

    // 根据精度判断是否相似
    return similarity >= precision;
};

/**
 * 工厂函数：创建 PouchDB 实例
 * @param dbName 数据库名
 * @param adapter 适配器类型（如 'memory'）
 */
export function createPouchDBInstance(dbName = 'images-db', adapter?: string) {
    const opts: any = {};
    if (adapter) opts.adapter = adapter;
    return new PouchDB(dbName, opts);
}

export class ImageDatabase {
    private db: PouchDB.Database;
    private static instance: ImageDatabase;

    private constructor(isTest?: boolean) {
        if (isTest) {
            this.db = createPouchDBInstance('performance_test_db', 'memory');
        } else {
            this.db = new PouchDB('images-db');
        }
        this.initSchema();
    }

    public static getInstance(isTest?: boolean): ImageDatabase {
        if (!ImageDatabase.instance) {
            ImageDatabase.instance = new ImageDatabase(isTest);
        }
        return ImageDatabase.instance;
    }

    private initSchema() {
        (this.db as any).setSchema([
            {
                singular: 'image',
                plural: 'images',
                relations: {
                    categories: { hasMany: 'category' }
                }
            },
            {
                singular: 'category',
                plural: 'categories',
                relations: {
                    images: { hasMany: 'image' }
                }
            }
        ]);
    }

    // Image CRUD Operations
    async createImage(image: Omit<Image, 'createdAt' | 'updatedAt'>): Promise<Image> {
        const timestamp = Date.now();
        const newImage = {
            ...image,
            createdAt: timestamp,
            updatedAt: timestamp
        };
        const result = await (this.db as any).rel.save('image', newImage);
        return result;
    }

    async createImages(images: Image[]): Promise<Image[]> {
        const timestamp = Date.now();
        const docs = images.map(image => ({
            _id: (this.db as any).rel.makeDocID({ type: 'image', id: image.id }),
            data: {
                ...image,
                createdAt: timestamp,
                updatedAt: timestamp
            }
        }));
        
        try {
            await this.db.bulkDocs(docs);
            return images;
        } catch (error) {
            console.error('Error bulk creating images:', error);
            return [];
        }
    }
    async getImage(id: string): Promise<Image | null> {
        try {
            const result = await (this.db as any).rel.find('image', id);
            return result.images[0] || null;
        } catch (error) {
            console.error('Error getting image:', error);
            return null;
        }
    }

    async getAllImages(): Promise<Image[]> {
        const result = await (this.db as any).rel.find('image');
        return result.images;
    }

    async getImagesLength(): Promise<number> {
        const images = await this.getAllImages();
        return images.length;
    }

    async updateImage(id: string, updates: Partial<Image>): Promise<Image | null> {
        try {
            const existing = await this.getImage(id);
            if (!existing) return null;

            const updated = {
                ...existing,
                ...updates,
                rev: existing.rev,
                updatedAt: Date.now()
            };
            const result = await (this.db as any).rel.save('image', updated);
            return result;
        } catch (error) {
            console.error('Error updating image:', error);
            return null;
        }
    }

    async deleteImage(id: string): Promise<boolean> {
        try {
            const image = await this.getImage(id);
            if (!image) return false;

            await (this.db as any).rel.del('image', image);
            return true;
        } catch (error) {
            console.error('Error deleting image:', error);
            return false;
        }
    }

    // Category CRUD Operations
    async createCategory(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> {
        const timestamp = Date.now();
        const newCategory = {
            ...category,
            createdAt: timestamp,
            updatedAt: timestamp
        };
        const result = await (this.db as any).rel.save('category', newCategory);
        return result;
    }

    async createCategories(categories: Category[]): Promise<Category[]> {
        const timestamp = Date.now();
        const docs = categories.map(category => ({
            _id: (this.db as any).rel.makeDocID({ type: 'category', id: category.id }),
            data: {
                ...category,
                createdAt: timestamp,
                updatedAt: timestamp
            }
        }));
        
        try {
            await this.db.bulkDocs(docs);
            return categories;
        } catch (error) {
            console.error('Error bulk creating categories:', error);
            return [];
        }
    }

    async getCategory(id: string): Promise<Category | null> {
        try {
            const result = await (this.db as any).rel.find('category', id);
            return result.categories[0] || null;
        } catch (error) {
            console.error('Error getting category:', error);
            return null;
        }
    }

    async getAllCategories(): Promise<Category[]> {
        const result = await (this.db as any).rel.find('category');
        return result.categories;
    }

    async updateCategory(id: string, updates: Partial<Category>): Promise<Category | null> {
        try {
            const existing = await this.getCategory(id);
            if (!existing) return null;

            const updated = {
                ...existing,
                ...updates,
                rev: existing.rev,
                updatedAt: Date.now()
            };

            const result = await (this.db as any).rel.save('category', updated);
            return result;
        } catch (error) {
            console.error('Error updating category:', error);
            return null;
        }
    }

    async deleteCategory(id: string): Promise<boolean> {
        try {
            const category = await this.getCategory(id);
            if (!category) return false;

            await (this.db as any).rel.del('category', category);
            return true;
        } catch (error) {
            console.error('Error deleting category:', error);
            return false;
        }
    }

    // Relationship Operations
    async addImageToCategory(imageId: string, categoryId: string): Promise<boolean> {
        try {
            const image = await this.getImage(imageId);
            const category = await this.getCategory(categoryId);
            if (!image || !category) return false;

            const imageCategories = new Set(image.categories || []);
            const categoryImages = new Set(category.images || []);

            await imageCategories.add(categoryId);
            await categoryImages.add(imageId);

            await this.updateImage(imageId, { categories: Array.from(imageCategories) });
            await this.updateCategory(categoryId, { images: Array.from(categoryImages) });

            return true;
        } catch (error) {
            console.error('Error adding image to category:', error);
            return false;
        }
    }

    async removeImageFromCategory(imageId: string, categoryId: string): Promise<boolean> {
        try {
            const image = await this.getImage(imageId);
            const category = await this.getCategory(categoryId);

            if (!image || !category) return false;

            const imageCategories = new Set(image.categories || []);
            const categoryImages = new Set(category.images || []);

            await imageCategories.delete(categoryId);
            await categoryImages.delete(imageId);

            await this.updateImage(imageId, { categories: Array.from(imageCategories) });
            await this.updateCategory(categoryId, { images: Array.from(categoryImages) });

            return true;
        } catch (error) {
            console.error('Error removing image from category:', error);
            return false;
        }
    }

    // Database Management
    async destroyDatabase(): Promise<void> {
        await this.db.destroy();
    }

    async getDatabaseInfo(): Promise<PouchDB.Core.DatabaseInfo> {
        return await this.db.info();
    }

    async syncDatabaseFromLocalJson(jsonPath: string): Promise<{ images: Image[], categories: Category[] }> {
        const jsonData = await fs.readFile(jsonPath, 'utf8');
        const { images, categories } = JSON.parse(jsonData);
        const oriImages = await this.getAllImages();
        const oriCategories = await this.getAllCategories();
        if (images.length === 0 && categories.length === 0) {
            return { images: [], categories: [] };
        }
        const isSame = images.length === oriImages.length && categories.length === oriCategories.length;
        if (isSame) {
            return { images: [], categories: [] };
        }
        const newImages = images.filter((image: Image) => !oriImages.some((oriImage: Image) => oriImage.id === image.id));
        const newCategories = categories.filter((category: Category) => !oriCategories.some((oriCategory: Category) => oriCategory.id === category.id));
        const deletedImages = oriImages.filter((image: Image) => !images.some((newImage: Image) => newImage.id === image.id));
        const deletedCategories = oriCategories.filter((category: Category) => !categories.some((newCategory: Category) => newCategory.id === category.id));
        const updatedImages = images.filter((image: Image) => oriImages.some((oriImage: Image) => oriImage.id === image.id));
        const updatedCategories = categories.filter((category: Category) => oriCategories.some((oriCategory: Category) => oriCategory.id === category.id));
        await Promise.all(deletedImages.map((image: Image) => this.deleteImage(image.id)));
        await Promise.all(deletedCategories.map((category: Category) => this.deleteCategory(category.id)));
        await this.createImages(newImages);
        await this.createCategories(newCategories);
        await Promise.all(updatedImages.map(async (image: Image) => {
            const oriImage = await this.getImage(image.id);
            if (!oriImage) return;
            const idDiff = compare(oriImage, image);
            if (idDiff) {
                await this.updateImage(image.id, image)
            }
        }));
        await Promise.all(updatedCategories.map(async (category: Category) => {
            const oriCategory = await this.getCategory(category.id);
            if (!oriCategory) return;
            const idDiff = compare(oriCategory, category);
            if (idDiff) {
                await this.updateCategory(category.id, category)
            }
        }));
        return { images, categories };
    }

    async exportDatabaseToLocalJson(jsonPath: string): Promise<{ images: Image[], categories: Category[] }> {
        const images = await this.getAllImages();
        const categories = await this.getAllCategories();
        const result = { images, categories };
        const jsonData = JSON.stringify(result, null, 2);
        await fs.writeFile(jsonPath, jsonData);
        return result;
    }

    async filterAndSortImagesFromDB({
        filter,
        selectedCategory,
        categories,
        searchTags,
        filterColors,
        multiFilter,
        sortBy,
        sortDirection,
        limit = Infinity
    }: {
        filter: FilterType;
        selectedCategory: FilterType | string;
        categories: Category[];
        searchTags: string[];
        filterColors: string[];
        multiFilter: FilterOptions;
        sortBy: SortType;
        sortDirection: SortDirection;
        limit: number;
    }): Promise<FetchDataResult> {
        try {
            const fields = [
                'data.path',
                'data.name',
                'data.tags',
                'data.thumbnail',
                'data.duration',
                'data.favorite',
                'data.categories',
                'data.colors',
                'data.ratio',
                'data.rating',
                'data.dateModified',
                'data.extension',
                'data.type',
                'data.size',
                'data.id',
                'data.width',
                'data.height',
                '_id',
                '_rev'
            ];
            // Create an index if not already created
            await this.db.createIndex({
                index: {
                    fields: fields,
                }
            });

            // Build the selector for the query
            const selector: any = {};

            if (searchTags.length > 0) {
                selector['data.tags'] = { $all: searchTags };
            }
            selector['data.type'] = 'image';
            if (selectedCategory === FilterType.Videos) {
                selector['data.type'] = { $eq: 'video' };
            } else if (filter === FilterType.Favorites) {
                selector['data.favorite'] = { $eq: true };
            } else if (filter === FilterType.Recent) {
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                selector['data.dateModified'] = { $gte: sevenDaysAgo.toISOString() };
            } else if (selectedCategory !== FilterType.Photos) {
                const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);
                if (selectedCategoryData) {
                    selector['data.categories'] = { $in: [selectedCategory] };
                }
            }

            if (multiFilter.ratio.length > 0) {
                selector['data.ratio'] = { $in: multiFilter.ratio };
            }
            if (typeof multiFilter.rating === 'number') {
                selector['data.rating'] = multiFilter.rating;
            }
            if (multiFilter.formats.length > 0) {
                selector['data.extension'] = { $in: multiFilter.formats.map((format: string) => format.toLowerCase()) };
            }

            const allImages = await this.getAllImages();
            limit = limit > allImages.length ? allImages.length : limit;
            //   // Perform the query
            const result = await this.db.find({
                fields: fields,
                selector,
                limit: limit
            });

            const images = result.docs.map((doc: any) => {
                const id = doc._id.split('_')[2];
                return {
                    ...doc.data,
                    id,
                    dateModified: doc.data.dateModified || doc.data.dateCreated
                } as LocalImageData;
            });
            let sortedImages = images;

            if (filterColors.length > 0) {
                sortedImages = sortedImages.filter(img =>
                    (img.colors || []).some((c: string | ColorInfo) => {
                        const imgColor = typeof c === 'string' ? c : c.color;
                        return isSimilarColor(imgColor, filterColors[0], multiFilter.precision);
                    })
                );
            }
            // 内存里排序
            if (sortBy === SortType.Date) {
                sortedImages = sortedImages.sort((a: LocalImageData, b: LocalImageData) => new Date(a.dateModified).getTime() - new Date(b.dateModified).getTime());
            } else if (sortBy === SortType.Name) {
                sortedImages = sortedImages.sort((a: LocalImageData, b: LocalImageData) => a.name.localeCompare(b.name));
            } else if (sortBy === SortType.Size) {
                sortedImages = sortedImages.sort((a: LocalImageData, b: LocalImageData) => a.size - b.size);
            }
            const resultImages = sortDirection === 'asc' ? sortedImages : sortedImages.reverse();
            return {
                images: resultImages,
                hasMore: resultImages.length != allImages.length,
                limit: limit
            };
        } catch (error) {
            console.error('Error querying images from DB:', error);
            return {
                images: [],
                hasMore: false,
                limit: limit
            };
        }
    }

} 

export function getTestDBInstance() {
    return ImageDatabase.getInstance(true);
}
