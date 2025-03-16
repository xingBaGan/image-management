import { Category, LocalImageData } from '../types/index.ts';

export const addCategory = async (
  newCategory: Category,
  images: LocalImageData[],
  categories: Category[]
): Promise<Category[]> => {
  const categoryWithImages = {
    ...newCategory,
    images: [],
    count: 0
  };
   return await window.electron.categoryAPI.addCategory(categoryWithImages, images, categories);
};

export const renameCategory = async (
  categoryId: string,
  newName: string,
  categories: Category[]
): Promise<Category[]> => {
  return await window.electron.categoryAPI.renameCategory(categoryId, newName, categories);
};

export const deleteCategory = async (
  categoryId: string,
  images: LocalImageData[],
  categories: Category[]
): Promise<{
  updatedCategories: Category[],
  updatedImages: LocalImageData[]
}> => {
  return await window.electron.categoryAPI.deleteCategory(categoryId, images, categories);
};

export const addToCategory = async (
  selectedImages: Set<string>,
  selectedCategories: string[],
  images: LocalImageData[],
  categories: Category[]
): Promise<{
  updatedImages: LocalImageData[];
  updatedCategories: Category[];
}> => {
  return await window.electron.categoryAPI.addToCategory(selectedImages, selectedCategories, images, categories);
};

export const importFolderFromPath = async (
  folderPath: string,
  images: LocalImageData[],
  categories: Category[]
): Promise<{
  newImages: LocalImageData[];
  updatedCategories: Category[];
  categoryId: string;
}> => {
  return await window.electron.categoryAPI.importFolderFromPath(folderPath, images, categories);
}; 