// src/dao/ImageDAO.ts
import { Category, LocalImageData, FilterType, FilterOptions, SortType, SortDirection, FetchDataResult } from './type.cjs';
export interface IPCImageService {
  toggleFavorite(id: string, images: LocalImageData[], categories: Category[]): Promise<LocalImageData[]>;
  addImages(
    newImages: LocalImageData[],
    currentImages: LocalImageData[],
    categories: Category[],
    currentSelectedCategory?: Category
  ): Promise<LocalImageData[]>;
  bulkDeleteSoft(
    selectedImages: Set<string>,
    images: LocalImageData[],
    categories: Category[]
  ): Promise<{
    updatedImages: LocalImageData[];
    updatedCategories?: Category[];
  }>;
  bulkDeleteHard(
    selectedImages: Set<string>,
    images: LocalImageData[],
    categories: Category[]
  ): Promise<{
    updatedImages: LocalImageData[];
    updatedCategories?: Category[];
  }>;
  bulkDeleteFromCategory(
    selectedImages: Set<string>,
    categories: Category[],
    currentSelectedCategory?: Category
  ): Promise<{
    updatedImages: LocalImageData[];
    updatedCategories: Category[];
  }>;
  updateTags(
    mediaId: string,
    newTags: string[],
    images: LocalImageData[],
    categories: Category[]
  ): Promise<LocalImageData[]>;
  updateRating(
    mediaId: string,
    rate: number,
    images: LocalImageData[],
    categories: Category[]
  ): Promise<{
    updatedImages: LocalImageData[];
    updatedImage: LocalImageData | null;
  }>;
  loadImagesFromJson(): Promise<any>;
  filterAndSortImages(
    mediaList: LocalImageData[],
    options: {
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
  ): Promise<FetchDataResult>;
  getImageById(imageId: string): Promise<LocalImageData>;
}
export interface ImageDAO extends IPCImageService {
  getImagesAndCategories(): Promise<{ images: LocalImageData[], categories: Category[] }>;
  saveImagesAndCategories(images: LocalImageData[], categories: Category[]): Promise<boolean>;
}