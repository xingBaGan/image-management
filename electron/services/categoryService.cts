import { Category, LocalImageData } from '../dao/type.cjs';
import { DAOFactory } from '../dao/DAOFactory.cjs';
const categoryDAO = DAOFactory.getCategoryDAO();

export const addCategory = async (
  newCategory: Category,
  images: LocalImageData[],
  categories: Category[]
): Promise<Category[]> => {
  return await categoryDAO.addCategory(newCategory, images, categories);
};

export const renameCategory = async (
  categoryId: string,
  newName: string,
  categories: Category[]
): Promise<Category[]> => {
  return await categoryDAO.renameCategory(categoryId, newName, categories);
};

export const deleteCategory = async (
  categoryId: string,
  images: LocalImageData[],
  categories: Category[]
): Promise<{
  updatedCategories: Category[];
  updatedImages: LocalImageData[]
}> => {
  return await categoryDAO.deleteCategory(categoryId, images, categories);
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
  return await categoryDAO.addToCategory(selectedImages, selectedCategories, images, categories);
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
  return await categoryDAO.importFolderFromPath(folderPath, images, categories);
}; 