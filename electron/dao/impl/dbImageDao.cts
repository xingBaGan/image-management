import { ImageDAO } from '../ImageDAO.cjs';
import { LocalImageData, Category, FilterType, FilterOptions, SortType, SortDirection, ColorInfo, VideoData } from '../type.cjs';
import { ImageDatabase, Image } from '../../pouchDB/Database.cjs';

// 颜色相似度比较函数
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

export const isSimilarColor = (color1: string, color2: string, precision: number = 0.8): boolean => {
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

// 转换 PouchDB Image 到 LocalImageData
const convertToLocalImageData = (image: Image): LocalImageData => {
  return {
    ...image,
    id: image.id,
    path: image.path,
    name: image.name,
    extension: image.extension,
    size: image.size,
    dateCreated: image.dateCreated,
    dateModified: image.dateModified,
    tags: image.tags || [],
    favorite: image.favorite,
    categories: image.categories || [],
    type: image.type,
    width: image.width,
    height: image.height,
    ratio: image.ratio || `${image.width}:${image.height}`,
    duration: image.duration,
    thumbnail: image.thumbnail,
    isBindInFolder: image.isBindInFolder,
    rating: image.rating,
    colors: image.colors || []
  };
};

// 转换 LocalImageData 到 PouchDB Image
const convertToPouchDBImage = (image: LocalImageData): Image => {
  return {
    ...image,
    id: image.id,
    path: image.path,
    name: image.name,
    extension: image.extension,
    size: image.size,
    dateCreated: image.dateCreated,
    dateModified: image.dateModified,
    tags: image.tags || [],
    favorite: image.favorite || false,
    categories: image.categories || [],
    type: image.type as 'video' | 'image',
    width: image.width || 0,
    height: image.height || 0,
    ratio: image.ratio || '1:1',
    isBindInFolder: image.isBindInFolder || false,
    rating: image.rating || 0,
    colors: image.colors || [],
  };
};

export default class DBImageDAO implements ImageDAO {
  private db: ImageDatabase;

  constructor() {
    this.db = ImageDatabase.getInstance();
  }

  async getImagesAndCategories(): Promise<{ images: LocalImageData[], categories: Category[] }> {
    try {
      const dbImages = await this.db.getAllImages();
      const dbCategories = await this.db.getAllCategories();

      const images = dbImages.map(convertToLocalImageData);
      const categories = dbCategories.map(cat => ({
        id: cat.id,
        name: cat.name,
        images: cat.images || [],
        count: cat.count || 0,
        folderPath: cat.folderPath,
        isImportFromFolder: cat.isImportFromFolder
      }));

      return { images, categories };
    } catch (error) {
      console.error('Error getting images and categories:', error);
      return { images: [], categories: [] };
    }
  }

  async toggleFavorite(
    id: string,
    images: LocalImageData[],
    categories: Category[]
  ): Promise<LocalImageData[]> {
    try {
      const image = images.find(img => img.id === id);
      if (!image) return images;

      const updatedImage = { ...image, favorite: !image.favorite };
      await this.db.updateImage(id, { favorite: updatedImage.favorite });

      return images.map(img => img.id === id ? updatedImage : img);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      return images;
    }
  }

  async addImages(
    newImages: LocalImageData[],
    currentImages: LocalImageData[],
    categories: Category[],
    currentSelectedCategory?: Category
  ): Promise<LocalImageData[]> {
    try {
      const imagesToAdd = newImages.filter(img =>
        !currentImages.some(existingImg => existingImg.id === img.id)
      );

      for (const image of imagesToAdd) {
        const pouchImage = convertToPouchDBImage(image);
        await this.db.createImage(pouchImage);

        // 如果有选中的分类，将图片添加到该分类
        if (currentSelectedCategory) {
          await this.db.addImageToCategory(image.id, currentSelectedCategory.id);
        }
      }

      return [...currentImages, ...imagesToAdd];
    } catch (error) {
      console.error('Error adding images:', error);
      return currentImages;
    }
  }

  async bulkDeleteSoft(
    selectedImages: Set<string>,
    images: LocalImageData[],
    categories: Category[]
  ): Promise<{
    updatedImages: LocalImageData[];
    updatedCategories?: Category[];
  }> {
    try {
      const updatedImages = images.filter(img => !selectedImages.has(img.id));

      // 从数据库中删除图片
      for (const imageId of selectedImages) {
        await this.db.deleteImage(imageId);
      }

      // 更新分类中的图片引用
      const updatedCategories = categories.map(category => {
        const newImages = category.images?.filter(id => !selectedImages.has(id)) || [];
        
        // 更新数据库中的分类
        this.db.updateCategory(category.id, { 
          images: newImages,
          count: newImages.length
        });
        
        return {
          ...category,
          images: newImages,
          count: newImages.length
        };
      });

      return {
        updatedImages,
        updatedCategories
      };
    } catch (error) {
      console.error('Error performing soft delete:', error);
      return { updatedImages: images, updatedCategories: categories };
    }
  }

  async bulkDeleteHard(
    selectedImages: Set<string>,
    images: LocalImageData[],
    categories: Category[]
  ): Promise<{
    updatedImages: LocalImageData[];
    updatedCategories?: Category[];
  }> {
    try {
      const updatedImages = images.filter(img => !selectedImages.has(img.id));
      const deletedImages = images.filter(img => selectedImages.has(img.id));

      // 从数据库中删除图片
      for (const imageId of selectedImages) {
        await this.db.deleteImage(imageId);
      }

      // 更新分类中的图片引用
      const updatedCategories = categories.map(category => {
        const newImages = category.images?.filter(id => !selectedImages.has(id)) || [];
        
        // 更新数据库中的分类
        this.db.updateCategory(category.id, { 
          images: newImages,
          count: newImages.length
        });
        
        return {
          ...category,
          images: newImages,
          count: newImages.length
        };
      });

      // 如果需要物理删除文件，可以在这里添加代码
      // 这里可以调用 electron 的 API 来删除文件

      return {
        updatedImages,
        updatedCategories
      };
    } catch (error) {
      console.error('Error performing hard delete:', error);
      return { updatedImages: images, updatedCategories: categories };
    }
  }

  async updateTags(
    mediaId: string,
    newTags: string[],
    images: LocalImageData[],
    categories: Category[]
  ): Promise<LocalImageData[]> {
    try {
      await this.db.updateImage(mediaId, { tags: newTags });
      
      return images.map(img =>
        img.id === mediaId ? { ...img, tags: newTags } : img
      );
    } catch (error) {
      console.error('Error updating tags:', error);
      return images;
    }
  }

  async updateRating(
    mediaId: string,
    rate: number,
    images: LocalImageData[],
    categories: Category[]
  ): Promise<{
    updatedImages: LocalImageData[];
    updatedImage: LocalImageData | null;
  }> {
    try {
      await this.db.updateImage(mediaId, { rating: rate });
      
      const updatedImages = images.map(img =>
        img.id === mediaId ? { ...img, rating: rate } : img
      );
      
      return {
        updatedImages,
        updatedImage: updatedImages.find(img => img.id === mediaId) || null
      };
    } catch (error) {
      console.error('Error updating rating:', error);
      return { updatedImages: images, updatedImage: null };
    }
  }

  async loadImagesFromJson(): Promise<any> {
    return await this.getImagesAndCategories();
  }

  filterAndSortImages(
    mediaList: LocalImageData[],
    {
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
    }
  ): LocalImageData[] {
    let filtered = mediaList.filter(img => img.type !== 'video') as LocalImageData[];

    if (searchTags.length > 0) {
      filtered = filtered.filter(img =>
        searchTags.every(tag =>
          img.tags?.some((imgTag: string) =>
            imgTag.toLowerCase().includes(tag.toLowerCase())
          )
        )
      );
    }

    if (selectedCategory === FilterType.Videos) {
      filtered = mediaList.filter(img => img.type === 'video') as LocalImageData[];
    } else if (filter === FilterType.Favorites) {
      filtered = filtered.filter(img => img.favorite);
    } else if (filter === FilterType.Recent) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      filtered = mediaList.filter(img => new Date(img.dateModified) >= sevenDaysAgo);
    } else if (selectedCategory !== FilterType.Photos) {
      const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);
      if (selectedCategoryData) {
        filtered = mediaList.filter(img =>
          img.categories?.includes(selectedCategory) ||
          selectedCategoryData.images?.includes(img.id)
        );
      }
    }

    filtered = filtered.filter(img => {
      if (filterColors.length > 0) {
        return filterColors.some(filterColor =>
          (img.colors || []).some((c: string | ColorInfo) => {
            const imgColor = typeof c === 'string' ? c : c.color;
            return isSimilarColor(imgColor, filterColor, multiFilter.precision);
          })
        );
      }

      if (multiFilter.ratio.length > 0) {
        return multiFilter.ratio.some(ratio => img.ratio === ratio);
      }
      if (typeof multiFilter.rating === 'number') {
        return img.rating === multiFilter.rating;
      }
      if (multiFilter.formats.length > 0) {
        const ext = img?.extension?.toLowerCase();
        return multiFilter.formats.some(format => ext?.endsWith(format.toLowerCase()));
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case SortType.Name:
          comparison = a.name.localeCompare(b.name);
          break;
        case SortType.Date:
          comparison = new Date(a.dateModified).getTime() - new Date(b.dateModified).getTime();
          break;
        case SortType.Size:
          comparison = a.size - b.size;
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  async saveImagesAndCategories(images: LocalImageData[], categories: Category[]): Promise<boolean> {
    // 使用 Promise.all 来并行处理所有图片更新
    await Promise.all(images.map(async (image) => {
      console.log('saveImagesAndCategories',image);
      try {
        if (image.isDirty) {
          delete image.isDirty;
          await this.db.updateImage(image.id, convertToPouchDBImage(image));
        } else {
          delete image.isDirty;
          await this.db.createImage(convertToPouchDBImage(image));
        }
      } catch (error) {
        console.error(`Error saving image ${image.id}:`, error);
      }
    }));

    // 使用 Promise.all 来并行处理所有分类更新
    await Promise.all(categories.map(async (category) => {
      try {
        const result = await this.db.updateCategory(category.id, category);
        if (!result) {
          await this.db.createCategory(category);
        }
      } catch (error) {
        console.error(`Error saving category ${category.id}:`, error);
      }
    }));

    return true;
  }
}
