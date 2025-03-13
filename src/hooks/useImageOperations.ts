import { useState } from 'react';
import { LocalImageData, Category, ImportStatus } from '../types';
import { useLocale } from '../contexts/LanguageContext';
import * as imageOperations from '../services/imageOperations';

export const useImageOperations = () => {
  const { t } = useLocale();
  const [images, setImages] = useState<LocalImageData[]>([]);
  const [importState, setImportState] = useState<ImportStatus>(ImportStatus.Imported);
  const [showBindInFolderConfirm, setShowBindInFolderConfirm] = useState<{
    selectedImages: Set<string>;
    categories: Category[];
  } | null>(null);

  const handleFavorite = async (id: string, categories: Category[]) => {
    try {
      const updatedImages = await imageOperations.toggleFavorite(id, images, categories);
      setImages(updatedImages);
    } catch (error) {
      console.error(t('updateFavoritesFailed', { error: String(error) }));
    }
  };

  const handleImportImages = async (categories: Category[], currentSelectedCategory?: Category) => {
    try {
      const updatedImages = await imageOperations.importImages(
        categories,
        images,
        currentSelectedCategory,
        setImportState
      );
      setImages(updatedImages);
    } catch (error) {
      console.error(t('importFailed', { error: String(error) }));
    }
  };

  const handleAddImages = async (newImages: LocalImageData[], categories: Category[], currentSelectedCategory?: Category) => {
    const updatedImages = await imageOperations.addImages(newImages, images, categories, currentSelectedCategory);
    setImages(updatedImages);
  };

  const handleBulkDelete = async (selectedImages: Set<string>, categories: Category[]) => {
    try {
      const bindInFolderImages = images.filter(img => selectedImages.has(img.id) && img.isBindInFolder);

      if (bindInFolderImages.length > 0) {
        setShowBindInFolderConfirm({ selectedImages, categories });
        return null;
      }

      const { updatedImages, updatedCategories } = await imageOperations.bulkDeleteSoft(
        selectedImages,
        images,
        categories
      );
      
      setImages(updatedImages);
      return updatedCategories;
    } catch (error) {
      console.error(t('deleteFailed', { error: String(error) }));
      return null;
    }
  };

  const executeDelete = async (selectedImages: Set<string>, categories: Category[]) => {
    const { updatedImages, updatedCategories } = await imageOperations.bulkDeleteHard(selectedImages, images, categories);
    setImages(updatedImages);
    return updatedCategories;
  };

  const updateTagsByMediaId = (mediaId: string, newTags: string[], categories: Category[]) => {
    imageOperations.updateTags(mediaId, newTags, images, categories)
      .then(setImages);
  };

  const handleRateChange = async (mediaId: string, rate: number, categories: Category[]) => {
    const { updatedImages, updatedImage } = await imageOperations.updateRating(mediaId, rate, images, categories);
    setImages(updatedImages);
    return updatedImage;
  };

  const loadImages = async () => {
    try {
      const result = await imageOperations.loadImagesFromJson();
      setImages(result.images);
      return result;
    } catch (error) {
      console.error(t('loadImagesFailed', { error: String(error) }));
      return null;
    }
  };

  return {
    images,
    setImages,
    importState,
    setImportState,
    handleFavorite,
    handleImportImages,
    handleAddImages,
    handleBulkDelete,
    updateTagsByMediaId,
    handleRateChange,
    loadImages,
    showBindInFolderConfirm,
    setShowBindInFolderConfirm,
    executeDelete,
  };
}; 