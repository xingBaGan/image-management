import FileSystemImageDAO from '../../dao/impl/FileSystemImageDAO.cjs';
import { loadImagesData, saveImagesAndCategories, deletePhysicalFile, getJsonFilePath } from '../../services/FileService.cjs';
import { LocalImageData, Category, FilterType, FilterOptions, SortType, SortDirection } from '../../dao/type.cjs';

jest.mock('../../services/mediaService.cjs', () => ({
  getVideoDuration: jest.fn(),
  generateVideoThumbnail: jest.fn(),
  processDirectoryFiles: jest.fn(),
}));

jest.mock('../../services/FileService.cjs', () => ({
  loadImagesData: jest.fn(),
  saveImagesAndCategories: jest.fn(),
  saveCategories: jest.fn(),
  readImagesFromFolder: jest.fn(),
  deletePhysicalFile: jest.fn(),
  getJsonFilePath: jest.fn(),
}));


describe('FileSystemImageDAO', () => {
  let dao: FileSystemImageDAO;
  let mockImages: LocalImageData[];
  let mockCategories: Category[];
  let filterOptions: {
    filter: FilterType;
    selectedCategory: string;
    categories: Category[];
    searchTags: string[];
    filterColors: string[];
    multiFilter: FilterOptions;
    sortBy: SortType;
    sortDirection: SortDirection;
  };

  beforeEach(() => {
    dao = new FileSystemImageDAO();
    mockImages = [
      {
        id: '1',
        name: 'test1.jpg',
        path: 'local-image://path/to/test1.jpg',
        size: 1000,
        type: 'image',
        extension: '.jpg',
        dateModified: '2024-01-01',
        dateCreated: '2024-01-01',
        favorite: false,
        rating: 0,
        tags: ['tag1'],
        colors: [{
          color: '#FF0000',
          percentage: 0.5
        }],
        ratio: '16:9',
        categories: ['cat1'],
        isBindInFolder: true
      },
      {
        id: '2',
        name: 'test2.jpg',
        path: 'path/to/test2.jpg',
        size: 2000,
        type: 'image',
        extension: '.jpg',
        dateModified: '2024-01-02',
        dateCreated: '2024-01-02',
        favorite: true,
        rating: 5,
        tags: ['tag2'],
        colors: [{
          color: '#00FF00',
          percentage: 0.5
        }],
        ratio: '4:3',
        categories: ['cat2'],
        isBindInFolder: false
      }
    ];
    mockCategories = [
      { id: 'cat1', name: 'Category 1', images: ['1'], count: 1 },
      { id: 'cat2', name: 'Category 2', images: ['2'], count: 1 }
    ];

    filterOptions = {
      filter: FilterType.Photos,
      selectedCategory: FilterType.Photos,
      categories: mockCategories,
      searchTags: [],
      filterColors: [],
      multiFilter: {
        precision: 0.8,
        ratio: [],
        rating: null,
        formats: [],
        colors: []
      },
      sortBy: SortType.Name,
      sortDirection: SortDirection.Asc
    };

    (loadImagesData as jest.Mock).mockResolvedValue({
      images: mockImages,
      categories: mockCategories
    });
    (saveImagesAndCategories as jest.Mock).mockResolvedValue(undefined);
    (deletePhysicalFile as jest.Mock).mockResolvedValue(undefined);
    (getJsonFilePath as jest.Mock).mockReturnValue('test.json');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getImagesAndCategories', () => {
    it('should load images and categories', async () => {
      const result = await dao.getImagesAndCategories();
      expect(result).toEqual({ images: mockImages, categories: mockCategories });
      expect(loadImagesData).toHaveBeenCalled();
    });

    it('should handle errors when loading images and categories', async () => {
      (loadImagesData as jest.Mock).mockRejectedValue(new Error('Failed to load data'));
      await expect(dao.getImagesAndCategories()).rejects.toThrow('Failed to load data');
    });
  });

  describe('toggleFavorite', () => {
    it('should toggle favorite status of an image', async () => {
      const result = await dao.toggleFavorite('1', mockImages, mockCategories);
      expect(result.find(img => img.id === '1')?.favorite).toBe(true);
      expect(saveImagesAndCategories).toHaveBeenCalled();
    });

    it('should handle invalid image ID gracefully', async () => {
      const result = await dao.toggleFavorite('invalid-id', mockImages, mockCategories);
      expect(result).toEqual(mockImages);
      expect(saveImagesAndCategories).not.toHaveBeenCalled();
    });
  });

  describe('addImages', () => {
    it('should add new images if they dont exist', async () => {
      const newImage: LocalImageData = {
        id: '3',
        name: 'test3.jpg',
        path: 'path/to/test3.jpg',
        size: 3000,
        type: 'image',
        extension: '.jpg',
        dateModified: '2024-01-03',
        dateCreated: '2024-01-03',
        favorite: false,
        rating: 0,
        tags: [],
        colors: [],
        ratio: '16:9',
        categories: [],
        isBindInFolder: false
      };

      const result = await dao.addImages([newImage], mockImages, mockCategories);
      expect(result).toHaveLength(3);
      expect(result.find(img => img.id === '3')).toBeTruthy();
      expect(saveImagesAndCategories).toHaveBeenCalled();
    });

    it('should handle adding images with existing IDs', async () => {
      const duplicateImage: LocalImageData = {
        id: '1',
        name: 'duplicate.jpg',
        path: 'path/to/duplicate.jpg',
        size: 3000,
        type: 'image',
        extension: '.jpg',
        dateModified: '2024-01-03',
        dateCreated: '2024-01-03',
        favorite: false,
        rating: 0,
        tags: [],
        colors: [],
        ratio: '16:9',
        categories: [],
        isBindInFolder: false
      };

      const result = await dao.addImages([duplicateImage], mockImages, mockCategories);
      expect(result).toHaveLength(2); // No new image should be added
      expect(saveImagesAndCategories).not.toHaveBeenCalled();
    });
  });

  describe('bulkDeleteSoft and bulkDeleteHard', () => {
    it('should perform soft delete of selected images', async () => {
      const selectedImages = new Set(['1']);
      const result = await dao.bulkDeleteSoft(selectedImages, mockImages, mockCategories);
      expect(result.updatedImages).toHaveLength(1);
      expect(result.updatedImages.find(img => img.id === '1')).toBeUndefined();
      expect(saveImagesAndCategories).toHaveBeenCalled();
    });

    it('should perform hard delete of selected images', async () => {
      const selectedImages = new Set(['1']);
      const result = await dao.bulkDeleteHard(selectedImages, mockImages, mockCategories);
      
      expect(result.updatedImages).toHaveLength(1);
      expect(result.updatedImages.find(img => img.id === '1')).toBeUndefined();
      expect(deletePhysicalFile).toHaveBeenCalledWith('local-image://path/to/test1.jpg');
      expect(saveImagesAndCategories).toHaveBeenCalled();
    });

    it('should handle empty selection for soft delete', async () => {
      const selectedImages = new Set<string>();
      const result = await dao.bulkDeleteSoft(selectedImages, mockImages, mockCategories);
      expect(result.updatedImages).toHaveLength(2);
      expect(saveImagesAndCategories).toHaveBeenCalled();
    });

    it('should handle empty selection for hard delete', async () => {
      const selectedImages = new Set<string>();
      const result = await dao.bulkDeleteHard(selectedImages, mockImages, mockCategories);
      expect(result.updatedImages).toHaveLength(2);
      expect(saveImagesAndCategories).toHaveBeenCalled();
    });
  });

  describe('updateTags', () => {
    it('should update tags for an image', async () => {
      const newTags = ['newTag1', 'newTag2'];
      const result = await dao.updateTags('1', newTags, mockImages, mockCategories);
      expect(result.find(img => img.id === '1')?.tags).toEqual(newTags);
      expect(saveImagesAndCategories).toHaveBeenCalled();
    });

    it('should handle updating tags for non-existent image', async () => {
      const newTags = ['newTag1', 'newTag2'];
      const result = await dao.updateTags('invalid-id', newTags, mockImages, mockCategories);
      expect(result).toEqual(mockImages);
      expect(saveImagesAndCategories).not.toHaveBeenCalled();
    });
  });

  describe('updateRating', () => {
    it('should update rating for an image', async () => {
      const result = await dao.updateRating('1', 5, mockImages, mockCategories);
      expect(result.updatedImages.find(img => img.id === '1')?.rating).toBe(5);
      expect(saveImagesAndCategories).toHaveBeenCalled();
    });

    it('should handle updating rating for non-existent image', async () => {
      const result = await dao.updateRating('invalid-id', 5, mockImages, mockCategories);
      expect(result.updatedImages).toEqual(mockImages);
      expect(saveImagesAndCategories).not.toHaveBeenCalled();
    });
  });

  describe('filterAndSortImages', () => {
    describe('filtering', () => {
      it('should filter by category', () => {
        const result = dao.filterAndSortImages(mockImages, {
          ...filterOptions,
          selectedCategory: 'cat1'
        });
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('1');
      });

      it('should filter by favorites', () => {
        const result = dao.filterAndSortImages(mockImages, {
          ...filterOptions,
          filter: FilterType.Favorites
        });
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('2');
      });

      it('should filter by search tags', () => {
        const result = dao.filterAndSortImages(mockImages, {
          ...filterOptions,
          searchTags: ['tag1']
        });
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('1');
      });

      it('should filter by colors', () => {
        const result = dao.filterAndSortImages(mockImages, {
          ...filterOptions,
          filterColors: ['#FF0000']
        });
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('1');
      });
    });

    describe('sorting', () => {
      it('should sort by name in ascending order', () => {
        const result = dao.filterAndSortImages(mockImages, {
          ...filterOptions,
          sortBy: SortType.Name,
          sortDirection: SortDirection.Asc
        });
        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('test1.jpg');
        expect(result[1].name).toBe('test2.jpg');
      });

      it('should sort by name in descending order', () => {
        const result = dao.filterAndSortImages(mockImages, {
          ...filterOptions,
          sortBy: SortType.Name,
          sortDirection: SortDirection.Desc
        });
        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('test2.jpg');
        expect(result[1].name).toBe('test1.jpg');
      });

      it('should sort by date in ascending order', () => {
        const result = dao.filterAndSortImages(mockImages, {
          ...filterOptions,
          sortBy: SortType.Date,
          sortDirection: SortDirection.Asc
        });
        expect(result).toHaveLength(2);
        expect(result[0].dateModified).toBe('2024-01-01');
        expect(result[1].dateModified).toBe('2024-01-02');
      });

      it('should sort by date in descending order', () => {
        const result = dao.filterAndSortImages(mockImages, {
          ...filterOptions,
          sortBy: SortType.Date,
          sortDirection: SortDirection.Desc
        });
        expect(result).toHaveLength(2);
        expect(result[0].dateModified).toBe('2024-01-02');
        expect(result[1].dateModified).toBe('2024-01-01');
      });
    });

    it('should handle empty media list', () => {
      const result = dao.filterAndSortImages([], filterOptions);
      expect(result).toHaveLength(0);
    });
  });

  describe('isSimilarColor', () => {
    it('should return true for similar colors', () => {
      const result = dao.filterAndSortImages(mockImages, {
        ...filterOptions,
        selectedCategory: FilterType.Photos,
        filterColors: ['#FF0001']
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('should return false for different colors', () => {
      const result = dao.filterAndSortImages(mockImages, {
        ...filterOptions,
        selectedCategory: FilterType.Photos,
        filterColors: ['#0000FF']
      });
      expect(result).toHaveLength(0);
    });
  });
}); 