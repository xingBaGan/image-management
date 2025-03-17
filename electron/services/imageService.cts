import { Category, LocalImageData, FilterType, FilterOptions, SortType, SortDirection } from '../dao/type.cjs';
import FileSystemImageDAO from '../dao/impl/FileSystemImageDAO.cjs';

const imageDAO = new FileSystemImageDAO();

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
  return await imageDAO.addImages(newImages, currentImages, categories, currentSelectedCategory);
};

export const bulkDeleteSoft = async (
  selectedImages: Set<string>,
  images: LocalImageData[],
  categories: Category[]
): Promise<{
  updatedImages: LocalImageData[];
  updatedCategories?: Category[];
}> => {
  return await imageDAO.bulkDeleteSoft(selectedImages, images, categories);
};

export const bulkDeleteHard = async (
  selectedImages: Set<string>,
  images: LocalImageData[],
  categories: Category[]
): Promise<{
  updatedImages: LocalImageData[];
  updatedCategories?: Category[];
}> => {
  return await imageDAO.bulkDeleteHard(selectedImages, images, categories);
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
