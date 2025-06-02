import { useCallback, useEffect } from 'react';
import { filterAndSortImages } from '../services/imageOperations';
import { FilterType, ImportStatus } from '../types';
/**
 * Hook to manage UI-related functionality and effects
 */
export const useAppUI = (state: any) => {
  const {
    mediaList,
    sortBy,
    sortDirection,
    filter,
    selectedCategory,
    categories,
    searchTags,
    multiFilter,
    filterColors,
    randomInspiration,
    setFilteredAndSortedImages,
    importState,
    setImportState,
    selectedCategory: filterCategory,
    setSelectedImages,
    setSelectedImageForInfo,
    viewingMedia
  } = state;

  const fetchData = useCallback(async () => {
    if (await window.electron.isReadFromDB()) {
      setImportState((importState: any) => importState !== ImportStatus.Imported ? importState : ImportStatus.Loading);
    }
    try {
      const { images, hasMore } = await filterAndSortImages(mediaList, {
        filter,
        selectedCategory,
        categories,
        searchTags,
        filterColors,
        multiFilter,
        sortBy,
        sortDirection,
      });
      // Apply random sorting if randomInspiration is greater than 0
      if (randomInspiration > 0) {
        // Use Fisher-Yates shuffle algorithm with a better seed-based random number generator
        const shuffledImages = [...images];
        const seed = randomInspiration;

        // Simple but effective seed-based random number generator
        const random = (index: number) => {
          const x = Math.sin(seed * 1000 + index) * 10000;
          return Math.abs(x - Math.floor(x));
        };

        for (let i = shuffledImages.length - 1; i > 0; i--) {
          // Generate a random index between 0 and i (inclusive)
          const j = Math.floor(random(i) * (i + 1));
          [shuffledImages[i], shuffledImages[j]] = [shuffledImages[j], shuffledImages[i]];
        }
        setFilteredAndSortedImages(shuffledImages);
      } else {
        setFilteredAndSortedImages(images);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      if (await window.electron.isReadFromDB()) {
        setImportState(ImportStatus.Imported);
      }
    }
  }, [
    mediaList,
    sortBy,
    sortDirection,
    filter,
    selectedCategory,
    categories,
    searchTags,
    multiFilter,
    filterColors,
    randomInspiration,
    setFilteredAndSortedImages,
    setImportState,
  ]);

  // Update filtered images whenever relevant states change
  useEffect(() => {
    fetchData();
  }, [
    fetchData,
  ]);

  // Reset selection when category changes
  useEffect(() => {
    setSelectedImages(new Set());
    setSelectedImageForInfo(null);
  }, [filterCategory, setSelectedImages, setSelectedImageForInfo]);

  // Update selected image info when viewing media changes
  useEffect(() => {
    setSelectedImageForInfo(viewingMedia);
  }, [viewingMedia, setSelectedImageForInfo]);

  // Set appropriate filter based on selected category
  useEffect(() => {
    if (selectedCategory === FilterType.Favorites) {
      state.setFilter(FilterType.Favorites);
    } else if (selectedCategory === FilterType.Recent) {
      state.setFilter(FilterType.Recent);
    } else {
      state.setFilter(FilterType.All);
    }
  }, [selectedCategory, state.setFilter]);

  return {
    // Any UI-specific functions or state could be returned here
  };
}; 