import PouchDB from 'pouchdb';
import PouchDBFind from 'pouchdb-find';
import { LocalImageData, FilterType, FilterOptions, SortType, SortDirection } from '../dao/type.cjs';
import RelationalPouch from 'relational-pouch';
import * as fs from 'fs/promises';
// Register PouchDB plugins
PouchDB.plugin(RelationalPouch);
PouchDB.plugin(PouchDBFind);
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
    order?: number;
  }

export class ImageDatabase {
    private db: PouchDB.Database;
    private static instance: ImageDatabase;
    
    private constructor() {
        this.db = new PouchDB('images-db');
        this.initSchema();
    }

    public static getInstance(): ImageDatabase {
        if (!ImageDatabase.instance) {
            ImageDatabase.instance = new ImageDatabase();
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
        await Promise.all(images.map(async (image) => {
            await this.createImage(image);
        }));
        return images;
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
        await Promise.all(categories.map(async (category) => {
            await this.createCategory(category);
        }));
        return categories;
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

            imageCategories.add(categoryId);
            categoryImages.add(imageId);

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

            imageCategories.delete(categoryId);
            categoryImages.delete(imageId);

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
        const createdImages = await this.createImages(images);
        const createdCategories = await this.createCategories(categories);
        return { images: createdImages, categories: createdCategories };
    }

    async exportDatabaseToLocalJson(jsonPath: string): Promise<void> {
        const images = await this.getAllImages();
        const categories = await this.getAllCategories();
        const jsonData = JSON.stringify({ images, categories }, null, 2);
        await fs.writeFile(jsonPath, jsonData);
    }

    async filterAndSortImagesFromDB({
        filter,
        selectedCategory,
        categories,
        searchTags,
        filterColors,
        multiFilter,
        sortBy,
        sortDirection
      }: {
        filter: FilterType;
        selectedCategory: FilterType | string;
        categories: Category[];
        searchTags: string[];
        filterColors: string[];
        multiFilter: FilterOptions;
        sortBy: SortType;
        sortDirection: SortDirection;
      }): Promise<LocalImageData[]> {
        try {
        const fields = [
            'data.path',
            'data.name',
            'data.tags',
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

          if (filterColors.length > 0) {
            selector['data.colors'] = { $elemMatch: { $in: filterColors } };
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
          

        //   // Perform the query
          const result = await this.db.find({
            fields: fields,
            selector,
            limit: 10000
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
          // 内存里排序
          if (sortBy === SortType.Date) {
            sortedImages = images.sort((a, b) => new Date(a.dateModified).getTime() - new Date(b.dateModified).getTime());
          } else if (sortBy === SortType.Name) {
            sortedImages = images.sort((a, b) => a.name.localeCompare(b.name));
          } else if (sortBy === SortType.Size) {
            sortedImages = images.sort((a, b) => a.size - b.size);
          }
          return sortDirection === 'asc' ? sortedImages : sortedImages.reverse();
        } catch (error) {
          console.error('Error querying images from DB:', error);
          return [];
        }
      }
    
} 
