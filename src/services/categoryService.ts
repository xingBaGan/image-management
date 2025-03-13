import { Category, LocalImageData } from '../types';

export const addCategory = async (
  newCategory: Category,
  images: LocalImageData[],
  categories: Category[]
): Promise<Category[]> => {
  const categoryWithImages = {
    ...newCategory,
    images: [],
    count: 0
  };

  const updatedCategories = [...categories, categoryWithImages];
  await window.electron.saveImagesToJson(images, updatedCategories);
  return updatedCategories;
};

export const renameCategory = async (
  categoryId: string,
  newName: string,
  categories: Category[]
): Promise<Category[]> => {
  const updatedCategories = categories.map(category =>
    category.id === categoryId
      ? { ...category, name: newName }
      : category
  );
  await window.electron.saveCategories(updatedCategories);
  return updatedCategories;
};

export const deleteCategory = async (
  categoryId: string,
  images: LocalImageData[],
  categories: Category[]
): Promise<Category[]> => {
  const deletedCategory = categories.find(category => category.id === categoryId);
  if (deletedCategory?.isImportFromFolder) {
    deletedCategory?.images?.forEach(imageId => {
      const image = images.find(img => img.id === imageId);
      if (image) {
        image.isBindInFolder = false;
      }
    });
  }
  const updatedCategories = categories.filter(category => category.id !== categoryId);
  await window.electron.saveImagesToJson(images, updatedCategories);
  return updatedCategories;
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
  const updatedImages = images.map(img => {
    if (selectedImages.has(img.id)) {
      return {
        ...img,
        categories: Array.from(new Set([...(img.categories || []), ...selectedCategories]))
      };
    }
    return img;
  });

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
  return { updatedImages, updatedCategories };
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
  let { category, images: newImages } = await window.electron.readImagesFromFolder(folderPath);
  newImages = newImages.map(img => ({
    ...img,
    isBindInFolder: true
  }));
  
  const updatedCategories = [...categories, category];
  const filteredImages = [...images.filter(img => !newImages.some(newImg => newImg.id === img.id)), ...newImages];
  
  await window.electron.saveImagesToJson([...images, ...newImages], updatedCategories);
  
  return {
    newImages: filteredImages,
    updatedCategories,
    categoryId: category.id
  };
}; 