import { useState } from 'react';
import { LocalImageData, Category, ImportFile, ImportStatus } from '../types';
import { processMedia } from '../utils';
import { useLocale } from '../contexts/LanguageContext';

export const useImageOperations = () => {
  const { t } = useLocale();
  const [images, setImages] = useState<LocalImageData[]>([]);
  const [importState, setImportState] = useState<ImportStatus>(ImportStatus.Imported);

  const handleFavorite = async (id: string, categories: Category[]) => {
    try {
      const updatedImages = images.map((img) =>
        img.id === id ? { ...img, favorite: !img.favorite } : img
      );

      await window.electron.saveImagesToJson(
        updatedImages,
        categories
      );

      setImages(updatedImages);
    } catch (error) {
      console.error(t('updateFavoritesFailed', { error: String(error) }));
    }
  };

  const handleImportImages = async (categories: Category[]) => {
    try {
      const newImages = await window.electron.showOpenDialog();
      if (newImages.length > 0) {
        setImportState(ImportStatus.Importing);
        const updatedImages = await processMedia(
          newImages.map(file => ({
            ...file,
            dateCreated: file?.dateCreated || new Date().toISOString(),
            dateModified: file?.dateModified || new Date().toISOString(),
            arrayBuffer: async () => new ArrayBuffer(0),
            text: async () => '',
            stream: () => new ReadableStream(),
            slice: () => new Blob(),
            type: file.type || 'image/jpeg'
          })) as unknown as ImportFile[],
          images,
          categories,
          setImportState
        );
        setImages([...images, ...updatedImages]);
        setImportState(ImportStatus.Imported);
      }
    } catch (error) {
      console.error(t('importFailed', { error: String(error) }));
    }
  };

  const handleAddImages = async (newImages: LocalImageData[], categories: Category[]) => {
    const newImagesData = newImages.filter(img => !images.some(existingImg => existingImg.id === img.id));
    await window.electron.saveImagesToJson(
      [...images, ...newImagesData],
      categories
    );
    setImages([...images, ...newImagesData]);
  };

  const handleBulkDelete = async (selectedImages: Set<string>, categories: Category[]) => {
    try {
      const updatedImages = images.filter(img => !selectedImages.has(img.id));

      const newCategories = categories.map(category => {
        const newImages = category.images?.filter(id => !selectedImages.has(id)) || [];
        return {
          ...category,
          images: newImages,
          count: newImages.length
        };
      });

      await window.electron.saveImagesToJson(
        updatedImages,
        newCategories
      );

      setImages(updatedImages);
      return newCategories;
    } catch (error) {
      console.error(t('deleteFailed', { error: String(error) }));
      return null;
    }
  };

  const updateTagsByMediaId = (mediaId: string, newTags: string[], categories: Category[]) => {
    const updatedImages = images.map(img =>
      img.id === mediaId ? { ...img, tags: newTags } : img
    );
    window.electron.saveImagesToJson(updatedImages, categories);
    setImages(updatedImages);
  };

  const handleRateChange = (mediaId: string, rate: number, categories: Category[]) => {
    const updatedImages = images.map(img =>
      img.id === mediaId ? { ...img, rating: rate } : img
    );
    window.electron.saveImagesToJson(updatedImages, categories);
    setImages(updatedImages);
    return updatedImages.find(img => img.id === mediaId) || null;
  };

  const loadImages = async () => {
    try {
      const result = await window.electron.loadImagesFromJson('images.json');
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
  };
}; 