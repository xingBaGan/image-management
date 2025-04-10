import { ipcMain } from 'electron';
import * as imageService from '../services/imageService.cjs';

export const registerImageHandlers = () => {
  ipcMain.handle('toggle-favorite', async (_, id: string, images: any[], categories: any[]) => {
    return await imageService.toggleFavorite(id, images, categories);
  });

  ipcMain.handle('add-images', async (_, newImages: any[], currentImages: any[], categories: any[], currentSelectedCategory: any) => {
    return await imageService.addImages(newImages, currentImages, categories, currentSelectedCategory);
  });

  ipcMain.handle('bulk-delete-soft', async (_, selectedImages: Set<string>, images: any[], categories: any[]) => {
    return await imageService.bulkDeleteSoft(selectedImages, images, categories);
  });

  ipcMain.handle('bulk-delete-hard', async (_, selectedImages: Set<string>, images: any[], categories: any[]) => {
    return await imageService.bulkDeleteHard(selectedImages, images, categories);
  });

  ipcMain.handle('bulk-delete-from-category', async (_, selectedImages: Set<string>, categories: any[], currentSelectedCategory: any) => {
    return await imageService.bulkDeleteFromCategory(selectedImages, categories, currentSelectedCategory);
  });

  ipcMain.handle('update-tags', async (_, mediaId: string, newTags: string[], images: any[], categories: any[]) => {
    return await imageService.updateTags(mediaId, newTags, images, categories);
  });

  ipcMain.handle('update-rating', async (_, mediaId: string, rate: number, images: any[], categories: any[]) => {
    return await imageService.updateRating(mediaId, rate, images, categories);
  });

  ipcMain.handle('filter-and-sort-images', async (_, mediaList: any[], options: any) => {
    return imageService.filterAndSortImages(mediaList, options);
  });

  ipcMain.handle('get-image-by-id', async (_, imageId: string) => {
    return await imageService.getImageById(imageId);
  });
}; 