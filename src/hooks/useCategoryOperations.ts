import { useState } from 'react';
import { Category, LocalImageData } from '../types';
import { useLocale } from '../contexts/LanguageContext';

export const useCategoryOperations = ({
  images,
  setImages,
  setSelectedCategory
}: {
  images: LocalImageData[];
  setImages: (images: LocalImageData[]) => void;
  setSelectedCategory: (category: string) => void;
}) => {
  const { t } = useLocale();
  const [categories, setCategories] = useState<Category[]>([]);

  const handleAddCategory = async (newCategory: Category, images: LocalImageData[]) => {
    try {
      const categoryWithImages = {
        ...newCategory,
        images: [],
        count: 0
      };

      const updatedCategories = [...categories, categoryWithImages];
      setCategories(updatedCategories);

      await window.electron.saveImagesToJson(images, updatedCategories);
    } catch (error) {
      console.error(t('addCategoryFailed', { error: String(error) }));
    }
  };

  const handleRenameCategory = async (categoryId: string, newName: string) => {
    try {
      const updatedCategories = categories.map(category =>
        category.id === categoryId
          ? { ...category, name: newName }
          : category
      );
      setCategories(updatedCategories);

      await window.electron.saveCategories(updatedCategories);
    } catch (error) {
      console.error(t('renameCategoryFailed', { error: String(error) }));
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      const updatedCategories = categories.filter(category => category.id !== categoryId);
      setCategories(updatedCategories);

      await window.electron.saveCategories(updatedCategories);
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
      // 更新图片的分类信息
      const updatedImages = images.map(img => {
        if (selectedImages.has(img.id)) {
          return {
            ...img,
            categories: Array.from(new Set([...(img.categories || []), ...selectedCategories]))
          };
        }
        return img;
      });

      // 更新分类中的图片信息
      const updatedCategories = categories.map(category => {
        if (selectedCategories.includes(category.id)) {
          const existingImages = category.images || [];
          const newImages = Array.from(selectedImages);
          const allImages = Array.from(new Set([...existingImages, ...newImages]));

          return {
            ...category,
            images: allImages,
            count: allImages.length
          };
        }
        return category;
      });

      await window.electron.saveImagesToJson(updatedImages, updatedCategories);

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
        const { category, images: newImages } = await window.electron.readImagesFromFolder(folderPath);
        
        // 更新分类
        const updatedCategories = [...categories, category];
        setCategories(updatedCategories);

        // 保存更改到文件
        await window.electron.saveImagesToJson(images, updatedCategories);
        
        setImages([...images, ...newImages]);
        setSelectedCategory(category.id);
      }
    } catch (error) {
      console.error(t('importFolderFailed', { error: String(error) }));
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
  };
}; 