import { LocalImageData, Category, ImportFile, ImportStatus, SortDirection, FilterType, SortType, FilterOptions, ColorInfo } from '../types';
import { processMedia, addImagesToCategory, isSimilarColor } from '../utils';
export const toggleFavorite = async (
  id: string,
  images: LocalImageData[],
  categories: Category[]
): Promise<LocalImageData[]> => {
  const updatedImages = images.map((img) =>
    img.id === id ? { ...img, favorite: !img.favorite } : img
  );

  await window.electron.saveImagesToJson(updatedImages, categories);
  return updatedImages;
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
  const newImagesData = newImages.filter(img => 
    !currentImages.some(existingImg => existingImg.id === img.id)
  );
  
  const updatedImages = [...currentImages, ...newImagesData];
  await window.electron.saveImagesToJson(
    updatedImages,
    categories,
    currentSelectedCategory
  );
  
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
  const updatedImages = images.filter(img => !selectedImages.has(img.id));
  
  const updatedCategories = categories.map(category => {
    const newImages = category.images?.filter(id => !selectedImages.has(id)) || [];
    return {
      ...category,
      images: newImages,
      count: newImages.length
    };
  });

  await window.electron.saveImagesToJson(updatedImages, updatedCategories);
  return {
    updatedImages: updatedImages,
    updatedCategories: updatedCategories
  };
};

export const bulkDeleteHard = async (
  selectedImages: Set<string>,
  images: LocalImageData[],
  categories: Category[]
): Promise<{
  updatedImages: LocalImageData[];
  updatedCategories?: Category[];
}> => {
  const updatedImages = images.filter(img => !selectedImages.has(img.id));
  const deletedImages = images.filter(img => selectedImages.has(img.id));
  const updatedCategories = categories.map(category => {
    const newImages = category.images?.filter(id => !selectedImages.has(id)) || [];
    return {
      ...category,
      images: newImages,
      count: newImages.length
    };
  });

  for (const img of deletedImages) {
    if (img.path.includes('local-image://') && img.isBindInFolder) {
      await window.electron.deleteFile(img.path);
    }
  }

  await window.electron.saveImagesToJson(updatedImages, updatedCategories);

  return {
    updatedImages,
    updatedCategories
  };
}

export const updateTags = async (
  mediaId: string,
  newTags: string[],
  images: LocalImageData[],
  categories: Category[]
): Promise<LocalImageData[]> => {
  const updatedImages = images.map(img =>
    img.id === mediaId ? { ...img, tags: newTags } : img
  );
  await window.electron.saveImagesToJson(updatedImages, categories);
  return updatedImages;
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
  const updatedImages = images.map(img =>
    img.id === mediaId ? { ...img, rating: rate } : img
  );
  await window.electron.saveImagesToJson(updatedImages, categories);
  
  return {
    updatedImages,
    updatedImage: updatedImages.find(img => img.id === mediaId) || null
  };
};

export const loadImagesFromJson = async () => {
  return await window.electron.loadImagesFromJson();
};

export const filterAndSortImages = (
  mediaList: LocalImageData[],
  {
    filter,
    selectedCategory,
    categories,
    searchTags,
    filterColors,
    multiFilter,
    sortBy,
    sortDirection
  }: {
    filter: FilterType;
    selectedCategory: FilterType | string;
    categories: Category[];
    searchTags: string[];
    filterColors: string[];
    multiFilter: FilterOptions;
    sortBy: SortType;
    sortDirection: SortDirection;
  }
): LocalImageData[] => {
  // 首先根据 filter 和 selectedCategory 过滤图片
  let filtered = mediaList.filter(img => img.type !== 'video') as LocalImageData[];

  // 添加标签过滤逻辑
  if (searchTags.length > 0) {
    filtered = filtered.filter(img =>
      searchTags.every(tag =>
        img.tags?.some((imgTag: string) =>
          imgTag.toLowerCase().includes(tag.toLowerCase())
        )
      )
    );
  }

  if (selectedCategory === FilterType.Videos) {
    filtered = mediaList.filter(img => img.type === 'video') as LocalImageData[];
  } else if (filter === FilterType.Favorites) {
    filtered = filtered.filter(img => img.favorite);
  } else if (filter === FilterType.Recent) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    filtered = mediaList.filter(img => new Date(img.dateModified) >= sevenDaysAgo);
  } else if (selectedCategory !== FilterType.Photos) {
    const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);
    if (selectedCategoryData) {
      filtered = mediaList.filter(img =>
        img.categories?.includes(selectedCategory) ||
        selectedCategoryData.images?.includes(img.id)
      );
    }
  }

  filtered = filtered.filter(img => {
    if (filterColors.length > 0) {
      // 使用颜色相似度比较
      return filterColors.some(filterColor =>
        (img.colors || []).some((c: string | ColorInfo) => {
          const imgColor = typeof c === 'string' ? c : c.color;
          return isSimilarColor(imgColor, filterColor, multiFilter.precision);
        })
      );
    }

    if (multiFilter.ratio.length > 0) {
      return multiFilter.ratio.some(ratio => img.ratio === ratio);
    }
    if (typeof multiFilter.rating === 'number') {
      return img.rating === multiFilter.rating;
    }
    if (multiFilter.formats.length > 0) {
      const ext = img?.extension?.toLowerCase();
      return multiFilter.formats.some(format => ext?.endsWith(format.toLowerCase()));
    }
    return true;
  });

  // 然后对过滤后的结果进行排序
  return [...filtered].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case SortType.Name:
        comparison = a.name.localeCompare(b.name);
        break;
      case SortType.Date:
        comparison = new Date(b.dateModified).getTime() - new Date(a.dateModified).getTime();
        break;
      case SortType.Size:
        comparison = b.size - a.size;
        break;
    }

    return sortDirection === 'asc' ? -comparison : comparison;
  });
}; 