import { Category, LocalImageData, FilterType, FilterOptions, SortType, SortDirection } from '../dao/type.cjs';
import { DAOFactory } from '../dao/DAOFactory.cjs';
import { imageCountManager } from './FileService.cjs';

const imageDAO = DAOFactory.getImageDAO();

export const toggleFavorite = async (
  id: string,
  images: LocalImageData[],
  categories: Category[]
): Promise<LocalImageData[]> => {
  return await imageDAO.toggleFavorite(id, images, categories);
};

export const addImages = async (
  newImages: LocalImageData[],
  currentImages: LocalImageData[],
  categories: Category[],
  currentSelectedCategory?: Category
): Promise<LocalImageData[]> => {
  const updatedImages = await imageDAO.addImages(newImages, currentImages, categories, currentSelectedCategory);
  imageCountManager.updateCount(updatedImages.length);
  return updatedImages;
};

export const bulkDeleteSoft = async (
  selectedImages: Set<string>,
  images: LocalImageData[],
  categories: Category[]
): Promise<{
  updatedImages: LocalImageData[];
  updatedCategories?: Category[];
}> => {
  const { updatedImages, updatedCategories } = await imageDAO.bulkDeleteSoft(selectedImages, images, categories);
  imageCountManager.updateCount(updatedImages.length);
  return { updatedImages, updatedCategories };
};

export const bulkDeleteFromCategory = async (selectedImages: Set<string>, categories: Category[], currentSelectedCategory?: Category) => {
  return await imageDAO.bulkDeleteFromCategory(selectedImages, categories, currentSelectedCategory);
};

export const bulkDeleteHard = async (
  selectedImages: Set<string>,
  images: LocalImageData[],
  categories: Category[]
): Promise<{
  updatedImages: LocalImageData[];
  updatedCategories?: Category[];
}> => {
  const { updatedImages, updatedCategories } = await imageDAO.bulkDeleteHard(selectedImages, images, categories);
  imageCountManager.updateCount(updatedImages.length);
  return { updatedImages, updatedCategories };
};

export const updateTags = async (
  mediaId: string,
  newTags: string[],
  images: LocalImageData[],
  categories: Category[]
): Promise<LocalImageData[]> => {
  return await imageDAO.updateTags(mediaId, newTags, images, categories);
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
  return await imageDAO.updateRating(mediaId, rate, images, categories);
};

export const filterAndSortImages = (
  mediaList: LocalImageData[],
  options: {
    filter: FilterType;
    selectedCategory: string;
    categories: Category[];
    searchTags: string[];
    filterColors: string[];
    multiFilter: FilterOptions;
    sortBy: SortType;
    sortDirection: SortDirection;
  }
) => {
  return imageDAO.filterAndSortImages(mediaList, options);
};

export const getImageById = async (imageId: string) => {
  return await imageDAO.getImageById(imageId);
};

