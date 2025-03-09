import { useState } from 'react';
import { LocalImageData, Category, ImportFile, ImportStatus } from '../types';
import { processMedia, addImagesToCategory } from '../utils';
import { useLocale } from '../contexts/LanguageContext';

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

  const handleImportImages = async (categories: Category[], currentSelectedCategory?: Category) => {
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
          setImportState,
          currentSelectedCategory
        );
        await addImagesToCategory(updatedImages, categories, currentSelectedCategory);
        setImages([...images, ...updatedImages]);
        setImportState(ImportStatus.Imported);
      }
    } catch (error) {
      console.error(t('importFailed', { error: String(error) }));
    }
  };

  const handleAddImages = async (newImages: LocalImageData[], categories: Category[], currentSelectedCategory?: Category) => {
    const newImagesData = newImages.filter(img => !images.some(existingImg => existingImg.id === img.id));
    await window.electron.saveImagesToJson(
      [...images, ...newImagesData],
      categories,
      currentSelectedCategory
    );
    setImages([...images, ...newImagesData]);
  };

  const handleBulkDelete = async (selectedImages: Set<string>, categories: Category[]) => {
    try {
      // 检查是否包含绑定文件夹的图片
      const selectedImagesList = images.filter(img => selectedImages.has(img.id));
      const bindInFolderImages = selectedImagesList.filter(img => img.isBindInFolder);

      if (bindInFolderImages.length > 0) {
        // 如果有绑定文件夹的图片，显示确认对话框
        setShowBindInFolderConfirm({ selectedImages, categories });
        return null;
      }

      // 如果没有绑定文件夹的图片，直接执行删除
      return await executeDelete(selectedImages, categories);
    } catch (error) {
      console.error(t('deleteFailed', { error: String(error) }));
      return null;
    }
  };

  const executeDelete = async (selectedImages: Set<string>, categories: Category[]) => {
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
      const result = await window.electron.loadImagesFromJson();
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