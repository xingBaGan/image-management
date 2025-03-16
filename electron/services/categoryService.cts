import { Category, LocalImageData } from '../dao/type';
import { ipcMain } from 'electron';
import { DAOFactory } from '../dao/DAOFactory.cjs';



export const setupCategoryHandlers = () => {
  const categoryDAO = DAOFactory.getCategoryDAO();
  // Add Category
  ipcMain.handle('add-category', async (_, newCategory: Category, images: LocalImageData[], categories: Category[]) => {
    return categoryDAO.addCategory(newCategory, images, categories);
  });

  // Rename Category
  ipcMain.handle('rename-category', async (_, categoryId: string, newName: string, categories: Category[]) => {
    return categoryDAO.renameCategory(categoryId, newName, categories);
  });

  // Delete Category
  ipcMain.handle('delete-category', async (_, categoryId: string, images: LocalImageData[], categories: Category[]) => {
    return categoryDAO.deleteCategory(categoryId, images, categories);
  });

  // Add To Category
  ipcMain.handle('add-to-category', async (
    _,
    selectedImages: Set<string>,
    selectedCategories: string[],
    images: LocalImageData[],
    categories: Category[]
  ) => {
    return categoryDAO.addToCategory(selectedImages, selectedCategories, images, categories);
  });

  // Import Folder From Path
  ipcMain.handle('import-folder-from-path', async (_, folderPath: string, images: LocalImageData[], categories: Category[]) => {
    return categoryDAO.importFolderFromPath(folderPath, images, categories);
  });
}; 