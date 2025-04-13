import { useState } from 'react';
import { Category, LocalImageData } from '../types/index.ts';
import { useLocale } from '../contexts/LanguageContext';
import * as categoryService from '../services/categoryService';

export const useCategoryOperations = ({
  images,
  setImages,
  setSelectedCategory,
  categories,
  setCategories
}: {
  images: LocalImageData[];
  setImages: (images: LocalImageData[]) => void;
  setSelectedCategory: (category: string) => void;
  categories: Category[];
  setCategories: (categories: Category[]) => void;
}) => {
  const { t } = useLocale();

  const handleAddCategory = async (newCategory: Category, images: LocalImageData[]) => {
    try {
      const updatedCategories = await categoryService.addCategory(newCategory, images, categories);
      setCategories(updatedCategories);
    } catch (error) {
      console.error(t('addCategoryFailed', { error: String(error) }));
    }
  };

  const handleRenameCategory = async (categoryId: string, newName: string) => {
    try {
      const updatedCategories = await categoryService.renameCategory(categoryId, newName, categories);
      setCategories(updatedCategories);
    } catch (error) {
      console.error(t('renameCategoryFailed', { error: String(error) }));
    }
  };

  const handleDeleteCategory = async (categoryId: string, images: LocalImageData[]) => {
    try {
      const { updatedCategories, updatedImages } = await categoryService.deleteCategory(categoryId, images, categories);
      setCategories(updatedCategories);
      setImages(updatedImages);
    } catch (error) {
      console.error(t('deleteCategoryFailed', { error: String(error) }));
    }
  };

  const handleReorderCategories = (newCategories: Category[]) => {
    window.electron.saveCategories(newCategories);
    setCategories(newCategories);
  };

  const handleAddToCategory = async (selectedImages: Set<string>, selectedCategories: string[], images: LocalImageData[]) => {
    try {
      const { updatedImages, updatedCategories } = await categoryService.addToCategory(
        selectedImages,
        selectedCategories,
        images,
        categories
      );
      setCategories(updatedCategories);
      return updatedImages;
    } catch (error) {
      console.error(t('addCategoryFailed', { error: String(error) }));
      return null;
    }
  };

  const handleImportFolder = async () => {
    try {
      const folderPath = await window.electron.openFolderDialog();
      if (folderPath) {
        await handleImportFolderFromPath(folderPath);
      }
    } catch (error) {
      console.error(t('importFolderFailed', { error: String(error) }));
    }
  };

  const handleImportFolderFromPath = async (folderPath: string) => {
    const { newImages, updatedCategories, categoryId } = await categoryService.importFolderFromPath(
      folderPath,
      images,
      categories
    );
    setCategories(updatedCategories);
    setImages(newImages);
    setSelectedCategory(categoryId);
  };

  const handleSelectSubfolder = (subfolderId: string) => {
    const subfolder = categories.find(category => category.id === subfolderId);
    if (subfolder) {
      setSelectedCategory(subfolder.id);
    }
  };

  return {
    categories,
    setCategories,
    handleAddCategory,
    handleRenameCategory,
    handleDeleteCategory,
    handleReorderCategories,
    handleAddToCategory,
    handleImportFolder,
    handleSelectSubfolder
  };
}; 