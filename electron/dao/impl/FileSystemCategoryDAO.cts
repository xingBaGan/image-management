import { CategoryDAO } from '../CategoryDAO.cjs';
import { LocalImageData, Category } from '../type.cjs';
import { loadImagesData, saveImagesAndCategories, saveCategories, readImagesFromFolder } from '../../services/FileService.cjs';
import { promises as fsPromises } from 'fs';
import { getJsonFilePath } from '../../services/FileService.cjs';
import { logger } from '../../services/logService.cjs';

interface LogMeta {
  [key: string]: any;
}


export default class FileSystemCategoryDAO implements CategoryDAO {
  async getImagesAndCategories() {
    const data = await loadImagesData();
    return data;
  }

  async addCategory(newCategory: Category, images: LocalImageData[], categories: Category[]): Promise<Category[]> {
    try {
      const categoryWithImages = {
        ...newCategory,
        images: [],
        count: 0
      };
      const updatedCategories = [...categories, categoryWithImages];
      await saveImagesAndCategories(images, updatedCategories);
      return updatedCategories;
    } catch (error) {
      console.error('Error in add-category:', error);
      throw error;
    }
  }

  async renameCategory(categoryId: string, newName: string, categories: Category[]): Promise<Category[]> {
    try {
      const updatedCategories = categories.map(category =>
        category.id === categoryId
          ? { ...category, name: newName }
          : category
      );
      await saveCategories(updatedCategories);
      return updatedCategories;
    } catch (error) {
      console.error('Error in rename-category:', error);
      throw error;
    }
  }

  async deleteCategory(categoryId: string, images: LocalImageData[], categories: Category[]): Promise<{
    updatedCategories: Category[],
    updatedImages: LocalImageData[]
  }> {
    try {
      const deletedCategory = categories.find(category => category.id === categoryId);
      if (deletedCategory?.isImportFromFolder) {
        deletedCategory?.images?.forEach(imageId => {
          const image = images.find(img => img.id === imageId);
          if (image) {
            image.isBindInFolder = false;
          }
        });
      }
      let updatedCategories = categories.filter(category => category.id !== categoryId);      
      // delete it's children
      if (deletedCategory?.children) {
        for (const child of deletedCategory.children) {
          const { updatedCategories: updatedCategories2, updatedImages } = await this.deleteCategory(child, images, updatedCategories);
          updatedCategories = updatedCategories2;
          images = updatedImages;
        }
      }

      // remove it from parent's children
      const parentCategory = updatedCategories.find(category => category.father === categoryId);
      if (parentCategory) {
        parentCategory.children = parentCategory.children?.filter(child => child !== categoryId) || [];
      }
      await saveImagesAndCategories(images, updatedCategories);
      const { images: updatedImages } = await loadImagesData();
      return {
        updatedCategories,
        updatedImages
      };
    } catch (error) {
      console.error('Error in delete-category:', error);
      throw error;
    }
  }

  async addToCategory(selectedImages: Set<string>, selectedCategories: string[], images: LocalImageData[], categories: Category[]): Promise<{
    updatedImages: LocalImageData[];
    updatedCategories: Category[];
  }> {
    try {
      const updatedImages = images.map(img => {
        if (selectedImages.has(img.id)) {
          return {
            ...img,
            categories: Array.from(new Set([...(img.categories || []), ...selectedCategories]))
          };
        }
        return img;
      });

      const updatedCategories = categories.map(category => {
        if (selectedCategories.includes(category.id)) {
          const existingImages = category.images || [];
          const newImages = Array.from(selectedImages);
          const allImages = Array.from(new Set([...existingImages, ...newImages]));

          return {
            ...category,
            images: allImages,
            count: allImages.length
          };
        }
        return category;
      });
      await saveImagesAndCategories(updatedImages, updatedCategories);

      return { updatedImages, updatedCategories };
    } catch (error) {
      console.error('Error in add-to-category:', error);
      throw error;
    }
  }

  async importFolderFromPath(folderPath: string, images: LocalImageData[], categories: Category[]): Promise<{
    newImages: LocalImageData[];
    updatedCategories: Category[];
    categoryId: string;
  }> {
    try {
      let { category, images: newImages } = await readImagesFromFolder(folderPath);
      newImages = newImages.map(img => ({
        ...img,
        isBindInFolder: true
      }));
      
      const updatedCategories = [...categories, category];
      const filteredImages = [...images.filter(img => !newImages.some(newImg => newImg.id === img.id)), ...newImages];
      
      await saveImagesAndCategories([...images, ...newImages] as LocalImageData[], updatedCategories);
      
      return {
        newImages: filteredImages as LocalImageData[],
        updatedCategories,
        categoryId: category.id
      };
    } catch (error) {
      console.error('Error in import-folder-from-path:', error);
      throw error;
    }
  }

  async saveCategories(categories: Category[]): Promise<boolean> {
    try {
      const filePath = getJsonFilePath();
      const existingData = JSON.parse(await fsPromises.readFile(filePath, 'utf8'));
      existingData.categories = categories;
      await fsPromises.writeFile(filePath, JSON.stringify(existingData, null, 2));
      return true;
    } catch (error) {
      logger.error('保存分类数据失败:', { error } as LogMeta);
      throw error;
    }
  }
}