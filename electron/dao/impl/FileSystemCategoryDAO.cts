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
      let updatedCategories = categories;
      // delete it's children
      if (deletedCategory?.children) {
        for (const child of deletedCategory.children) {
          const { updatedCategories: updatedCategories2, updatedImages } = await this.deleteCategory(child, images, updatedCategories);
          updatedCategories = updatedCategories2;
          images = updatedImages;
        }
      }
      
      // remove it from parent's children
      const parentCategory = categories.find(category => category.id === deletedCategory?.father);
      if (parentCategory) {
        parentCategory.children = parentCategory.children?.filter(child => child !== categoryId) || [];
      }

      // remove itself from categories
      updatedCategories = updatedCategories.filter(category => category.id !== categoryId);
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

  async removeFromGrandParentCategory(selectedImages: Set<string>, selectedCategories: string[], images: LocalImageData[], categories: Category[]): Promise<{
    updatedImages: LocalImageData[];
    updatedCategories: Category[];
  }> {
    let grandParentCategories = new Set<string>();
    // 遍历selectedCategories 的父级以上的categories, 删除selectedImages
    for (const categoryId of selectedCategories) {
      let currentCategory = categories.find(category => category.id === categoryId);
      while (currentCategory && currentCategory?.father) {
        currentCategory = categories.find(category => category.id === currentCategory!.father);
        if (currentCategory) {
          currentCategory.images = currentCategory.images?.filter(image => !selectedImages.has(image)) || [];
          currentCategory.count = currentCategory.images?.length || 0;
          // 找到images中对应的image, 删除
          grandParentCategories.add(currentCategory.id);
        }
      }
    }
    // 遍历selectedImages, 删除categories中对应的 parentCategory
    for (const imageId of selectedImages) {
      const image = images.find(image => image.id === imageId);
      if (image) {
        image.categories = image.categories?.filter(categoryId => !grandParentCategories.has(categoryId)) || [];
      }
    }
    return { updatedImages: images, updatedCategories: categories };
  }

  collectChildren(categoryId: string, categories: Category[]): string[] {
    const children: string[] = [];
    const current = categories?.find(cat => cat.id === categoryId);
    if (!current?.children) return children;
    for (const childId of current.children) {
      // 收集儿子
      children.push(childId);
      const child = categories?.find(cat => cat.id === childId);
      if (child?.children) {
        children.push(...this.collectChildren(childId, categories));
      }
    }
    return children;
  };
  async removeFromChildrenCategory(selectedImages: Set<string>, selectedCategories: string[], images: LocalImageData[], categories: Category[]): Promise<{
    updatedImages: LocalImageData[];
    updatedCategories: Category[];
  }> {
    const allChildrenId: string[] = [];
    for (const selectedId of selectedCategories) {
      allChildrenId.push(...this.collectChildren(selectedId, categories));
    }
    for (const categoryId of allChildrenId) {
      const category = categories.find(cat => cat.id === categoryId);
      if (category) {
        category.images = category.images?.filter(imageId => !selectedImages.has(imageId)) || [];
        category.count = category.images?.length || 0;
      }
    }
    for (const imageId of selectedImages) {
      const image = images.find(image => image.id === imageId);
      if (image) {
        image.categories = image.categories?.filter(categoryId => !allChildrenId.includes(categoryId)) || [];
      }
    }
    return { updatedImages: images, updatedCategories: categories };
  }

  async addToCategory(selectedImages: Set<string>, selectedCategories: string[], images: LocalImageData[], categories: Category[]): Promise<{
    updatedImages: LocalImageData[];
    updatedCategories: Category[];
  }> {
    try {
      // 更新images 的分类
      const updatedImages = images.map(img => {
        if (selectedImages.has(img.id)) {
          return {
            ...img,
            categories: Array.from(new Set([...(img.categories || []), ...selectedCategories]))
          };
        }
        return img;
      });

      // 更新categories 的图片
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
      const {
        updatedImages: updatedImages2,
        updatedCategories: updatedCategories2
      } = await this.removeFromGrandParentCategory(selectedImages, selectedCategories, updatedImages, updatedCategories);
      const {
        updatedImages: updatedImages3,
        updatedCategories: updatedCategories3
      } = await this.removeFromChildrenCategory(selectedImages, selectedCategories, updatedImages2, updatedCategories2);
      await saveImagesAndCategories(updatedImages3, updatedCategories3);
      return { updatedImages: updatedImages3, updatedCategories: updatedCategories3 };
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