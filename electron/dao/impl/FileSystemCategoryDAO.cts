import { CategoryDAO } from '../CategoryDAO.cjs';
import { Category } from '../type';
import { loadImagesData, saveImagesAndCategories, saveCategories, readImagesFromFolder } from '../../services/FileService.cjs';
import { LocalImageData } from '../type';

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

  async deleteCategory(categoryId: string, images: LocalImageData[], categories: Category[]): Promise<Category[]> {
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
      const updatedCategories = categories.filter(category => category.id !== categoryId);
      await saveCategories(updatedCategories);
      return updatedCategories;
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
      const result = await readImagesFromFolder(folderPath);
      const { category, images: newImages } = result as any;
      
      const processedImages = [...(images || []), ...newImages].map((img: LocalImageData) => ({
        ...img,
        isBindInFolder: true
      }));
      
      const updatedCategories = [...categories, category];
      const filteredImages = [...(images || []).filter(img => !processedImages.some((newImg: LocalImageData) => newImg.id === img.id)), ...processedImages];
      await saveImagesAndCategories([...images, ...newImages], updatedCategories);
      return {
        newImages: filteredImages,
        updatedCategories,
        categoryId: category.id
      };
    } catch (error) {
      console.error('Error in import-folder-from-path:', error);
      throw error;
    }
  }
}