import { FetchDataResult } from 'electron/dao/type.cts';
import { LocalImageData, Category, ImportFile, ImportStatus, SortDirection, FilterType, SortType, FilterOptions } from '../types/index.ts';
import { processMedia, addImagesToCategory } from '../utils';
export const toggleFavorite = async (
  id: string,
  images: LocalImageData[],
  categories: Category[]
): Promise<LocalImageData[]> => {
  return await window.electron.imageAPI.toggleFavorite(id, images, categories);
};

export const importImages = async (
  categories: Category[],
  currentImages: LocalImageData[],
  currentSelectedCategory?: Category,
  setImportState?: (state: ImportStatus) => void,
): Promise<LocalImageData[]> => {
  const newImages = await window.electron.showOpenDialog();
  if (newImages.length === 0) {
    return currentImages;
  }

  setImportState?.(ImportStatus.Importing);
  
  const processedFiles = newImages.map(file => ({
    ...file,
    dateCreated: file?.dateCreated || new Date().toISOString(),
    dateModified: file?.dateModified || new Date().toISOString(),
    arrayBuffer: async () => new ArrayBuffer(0),
    text: async () => '',
    stream: () => new ReadableStream(),
    slice: () => new Blob(),
    type: file.type || 'image/jpeg'
  })) as unknown as ImportFile[];

  let updatedImages = await processMedia(
    processedFiles,
    currentImages,
    categories,
    setImportState,
    currentSelectedCategory
  );
  
  updatedImages = await addImagesToCategory(updatedImages, categories, currentSelectedCategory);
  setImportState?.(ImportStatus.Imported);
  
  return [...currentImages, ...updatedImages];
};

export const addImages = async (
  newImages: LocalImageData[],
  currentImages: LocalImageData[],
  categories: Category[],
  currentSelectedCategory?: Category
): Promise<LocalImageData[]> => {
  return await window.electron.imageAPI.addImages(newImages, currentImages, categories, currentSelectedCategory);
};

export const bulkDeleteSoft = async (
  selectedImages: Set<string>,
  images: LocalImageData[],
  categories: Category[]
): Promise<{
  updatedImages: LocalImageData[];
  updatedCategories?: Category[];
}> => {
  return await window.electron.imageAPI.bulkDeleteSoft(selectedImages, images, categories);
};

export const bulkDeleteHard = async (
  selectedImages: Set<string>,
  images: LocalImageData[],
  categories: Category[]
): Promise<{
  updatedImages: LocalImageData[];
  updatedCategories?: Category[];
}> => {
  return await window.electron.imageAPI.bulkDeleteHard(selectedImages, images, categories);
}

export const updateTags = async (
  mediaId: string,
  newTags: string[],
  images: LocalImageData[],
  categories: Category[]
): Promise<LocalImageData[]> => {
  return await window.electron.imageAPI.updateTags(mediaId, newTags, images, categories);
};

export const updateRating = async (
  mediaId: string,
  rate: number,
  images: LocalImageData[],
  categories: Category[]
): Promise<{
  updatedImages: LocalImageData[];
  updatedImage: LocalImageData | null;
}> => {
  return await window.electron.imageAPI.updateRating(mediaId, rate, images, categories);
};

export const loadImagesFromJson = async () => {
  return await window.electron.loadImagesFromJson();
};

export const filterAndSortImages = async (
  mediaList: LocalImageData[],
  {
    filter,
    selectedCategory,
    categories,
    searchTags,
    filterColors,
    multiFilter,
    sortBy,
    sortDirection,
    limit
  }: {
    filter: FilterType;
    selectedCategory: FilterType | string;
    categories: Category[];
    searchTags: string[];
    filterColors: string[];
    multiFilter: FilterOptions;
    sortBy: SortType;
    sortDirection: SortDirection;
    limit?: number;
  }
): Promise<FetchDataResult> => {
  return await window.electron.imageAPI.filterAndSortImages(mediaList, { filter, selectedCategory, categories, searchTags, filterColors, multiFilter, sortBy, sortDirection, limit });
};

export const bulkDeleteFromCategory = async (selectedImages: Set<string>, categories: Category[], currentSelectedCategory?: Category) => {
  return await window.electron.imageAPI.bulkDeleteFromCategory(selectedImages, categories, currentSelectedCategory);
};

