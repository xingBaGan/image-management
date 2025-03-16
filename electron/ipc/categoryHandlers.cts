import { ipcMain } from 'electron';
import * as categoryService from '../services/categoryService.cjs';

export const registerCategoryHandlers = () => {
  ipcMain.handle('add-category', async (_, newCategory: any, images: any[], categories: any[]) => {
    return await categoryService.addCategory(newCategory, images, categories);
  });

  ipcMain.handle('rename-category', async (_, categoryId: string, newName: string, categories: any[]) => {
    return await categoryService.renameCategory(categoryId, newName, categories);
  });

  ipcMain.handle('delete-category', async (_, categoryId: string, images: any[], categories: any[]) => {
    return await categoryService.deleteCategory(categoryId, images, categories);
  });

  ipcMain.handle('add-to-category', async (_, selectedImages: Set<string>, selectedCategories: string[], images: any[], categories: any[]) => {
    return await categoryService.addToCategory(selectedImages, selectedCategories, images, categories);
  });

  ipcMain.handle('import-folder-from-path', async (_, folderPath: string, images: any[], categories: any[]) => {
    return await categoryService.importFolderFromPath(folderPath, images, categories);
  });
}; 