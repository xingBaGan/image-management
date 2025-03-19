import FileSystemCategoryDAO from '../../dao/impl/FileSystemCategoryDAO.cjs';
import { loadImagesData, saveImagesAndCategories, saveCategories, readImagesFromFolder } from '../../services/FileService.cjs';
import { Category, LocalImageData } from '../../dao/type.cjs';
type CategoryType = Category;
type LocalImageDataType = LocalImageData;

jest.mock('../../services/FileService.cjs', () => ({
  loadImagesData: jest.fn(),
  saveImagesAndCategories: jest.fn(),
  saveCategories: jest.fn(),
  readImagesFromFolder: jest.fn(),
}));

describe('FileSystemCategoryDAO', () => {
  let dao: InstanceType<typeof FileSystemCategoryDAO>;
  let mockImages: LocalImageDataType[];
  let mockCategory: CategoryType;
  let mockCategories: CategoryType[];

  beforeEach(() => {
    dao = new FileSystemCategoryDAO();
    mockImages = [
      {
        id: "26ba9d87",
        path: "/path/to/image1.jpg",
        name: "image1.jpg",
        extension: "jpg",
        size: 1024,
        dateCreated: "2024-01-01",
        dateModified: "2024-01-01",
        type: "image",
        width: 800,
        height: 600,
        rating: 0,
        ratio: "4:3",
        tags: [],
        favorite: false,
        categories: ["1"],
        colors: [],
        isBindInFolder: false
      },
      {
        id: "2bbb1c86",
        path: "/path/to/image2.jpg",
        name: "image2.jpg",
        extension: "jpg",
        size: 1024,
        dateCreated: "2024-01-01",
        dateModified: "2024-01-01",
        type: "image",
        width: 800,
        height: 600,
        rating: 0,
        ratio: "4:3",
        tags: [],
        favorite: false,
        categories: ["1"],
        colors: [],
        isBindInFolder: false
      }
    ];

    mockCategory = {
      id: "1",
      name: "风景",
      images: ["26ba9d87", "2bbb1c86"],
      count: 2
    };

    mockCategories = [mockCategory];

    // Reset and setup mocks
    (loadImagesData as jest.Mock).mockReset();
    (saveImagesAndCategories as jest.Mock).mockReset();
    (saveCategories as jest.Mock).mockReset();
    (readImagesFromFolder as jest.Mock).mockReset();

    // Setup default mock returns
    (loadImagesData as jest.Mock).mockResolvedValue({
      images: mockImages,
      categories: mockCategories
    });
    (saveImagesAndCategories as jest.Mock).mockResolvedValue(undefined);
    (saveCategories as jest.Mock).mockResolvedValue(undefined);
  });

  describe('getImagesAndCategories', () => {
    it('should return images and categories data', async () => {
      const mockData = {
        images: mockImages,
        categories: mockCategories
      };
      (loadImagesData as jest.Mock).mockResolvedValue(mockData);

      const result = await dao.getImagesAndCategories();
      expect(result).toEqual(mockData);
      expect(loadImagesData).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      const error = new Error('Failed to load data');
      (loadImagesData as jest.Mock).mockRejectedValue(error);

      await expect(dao.getImagesAndCategories()).rejects.toThrow(error);
    });
  });

  describe('addCategory', () => {
    it('should add a new category successfully', async () => {
      const newCategory: CategoryType = {
        id: "2",
        name: "新分类",
        images: [],
        count: 0
      };

      const result = await dao.addCategory(newCategory, mockImages, mockCategories);
      
      expect(result).toHaveLength(mockCategories.length + 1);
      expect(result.find(c => c.id === "2")).toEqual(newCategory);
      expect(saveImagesAndCategories).toHaveBeenCalledWith(mockImages, result);
    });
  });

  describe('renameCategory', () => {
    it('should rename a category successfully', async () => {
      const newName = "新风景";
      
      const result = await dao.renameCategory("1", newName, mockCategories);
      
      expect(result[0].name).toBe(newName);
      expect(saveCategories).toHaveBeenCalledWith(result);
    });
  });

  describe('deleteCategory', () => {
    it('should delete a normal category successfully', async () => {
      const updatedImages = mockImages.map(img => ({
        ...img,
        categories: (img.categories || []).filter(c => c !== "1")
      }));

      (loadImagesData as jest.Mock).mockResolvedValueOnce({
        images: updatedImages,
        categories: []
      });

      const result = await dao.deleteCategory("1", mockImages, mockCategories);
      
      expect(result.updatedCategories).toHaveLength(0);
      expect(result.updatedCategories.find(c => c.id === "1")).toBeUndefined();
      expect(result.updatedImages).toEqual(updatedImages);
      expect(saveImagesAndCategories).toHaveBeenCalledWith(mockImages, []);
    });

    it('should handle folder-imported category deletion', async () => {
      const folderCategory = {
        ...mockCategory,
        isImportFromFolder: true
      };

      const updatedImages = mockImages.map(img => ({
        ...img,
        categories: (img.categories || []).filter(c => c !== folderCategory.id),
        isBindInFolder: false
      }));

      (loadImagesData as jest.Mock).mockResolvedValueOnce({
        images: updatedImages,
        categories: []
      });

      const result = await dao.deleteCategory(
        folderCategory.id,
        mockImages,
        [folderCategory]
      );

      expect(result.updatedCategories).toHaveLength(0);
      expect(result.updatedImages).toBeDefined();
      expect(result.updatedImages.every(img => !img.isBindInFolder)).toBe(true);
      expect(saveImagesAndCategories).toHaveBeenCalled();
    });
  });
});