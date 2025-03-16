// src/dao/CategoryDAO.ts
import { Category } from './type';
import { LocalImageData } from './type';


export interface ipcCategoryAPI {
  // Category Service Methods
  addCategory: (newCategory: Category, images: LocalImageData[], categories: Category[]) => Promise<Category[]>;
  renameCategory: (categoryId: string, newName: string, categories: Category[]) => Promise<Category[]>;
  deleteCategory: (categoryId: string, images: LocalImageData[], categories: Category[]) => Promise<Category[]>;
  addToCategory: (
    selectedImages: Set<string>,
    selectedCategories: string[],
    images: LocalImageData[],
    categories: Category[]
  ) => Promise<{
    updatedImages: LocalImageData[];
    updatedCategories: Category[];
  }>;
  importFolderFromPath: (
    folderPath: string,
    images: LocalImageData[],
    categories: Category[]
  ) => Promise<{
    newImages: LocalImageData[];
    updatedCategories: Category[];
    categoryId: string;
  }>;
}

export interface CategoryDAO extends ipcCategoryAPI {
  getImagesAndCategories: () => Promise<{ images: LocalImageData[], categories: Category[] }>;
  addCategory: (newCategory: Category, images: LocalImageData[], categories: Category[]) => Promise<Category[]>;
  
  renameCategory: (categoryId: string, newName: string, categories: Category[]) => Promise<Category[]>;
  
  deleteCategory: (categoryId: string, images: LocalImageData[], categories: Category[]) => Promise<Category[]>;
  
  addToCategory: (selectedImages: Set<string>, selectedCategories: string[], images: LocalImageData[], categories: Category[]) => Promise<{
    updatedImages: LocalImageData[];
    updatedCategories: Category[];
  }>;
  
  importFolderFromPath: (folderPath: string, images: LocalImageData[], categories: Category[]) => Promise<{
    newImages: LocalImageData[];
    updatedCategories: Category[];
    categoryId: string;
  }>;
}