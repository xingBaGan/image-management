import FileSystemImageDAO from '../../dao/impl/FileSystemImageDAO.cts';
import { loadImagesData, saveImagesAndCategories } from '../../services/FileService.cjs';
import { Image } from '../../dao/type';

jest.mock('../../services/FileService.cjs');

describe('FileSystemImageDAO', () => {
  let dao: FileSystemImageDAO;
  let mockImage: Image;

  beforeEach(() => {
    dao = new FileSystemImageDAO();
    mockImage = {
      id: 'test-1',
      path: '/test/image.jpg',
      name: 'test',
      extension: 'jpg',
      size: 1000,
      dateCreated: new Date().toISOString(),
      dateModified: new Date().toISOString(),
      tags: ['test'],
      favorite: false,
      categories: [],
      type: 'image',
      width: 100,
      height: 100,
      isBindInFolder: false
    };

    // Reset mocks
    (loadImagesData as jest.Mock).mockReset();
    (saveImagesAndCategories as jest.Mock).mockReset();
  });

  describe('create', () => {
    it('should create a new image', async () => {
      (loadImagesData as jest.Mock).mockResolvedValue({ images: [], categories: [] });
      
      const result = await dao.create(mockImage);
      
      expect(result).toEqual(mockImage);
      expect(saveImagesAndCategories).toHaveBeenCalledWith([mockImage], []);
    });
  });

  describe('update', () => {
    it('should update an existing image', async () => {
      const existingImage = { ...mockImage };
      const updatedImage = { ...mockImage, name: 'updated' };
      
      (loadImagesData as jest.Mock).mockResolvedValue({ 
        images: [existingImage], 
        categories: [] 
      });

      const result = await dao.update(updatedImage);
      
      expect(result).toEqual(updatedImage);
      expect(saveImagesAndCategories).toHaveBeenCalledWith([updatedImage], []);
    });
  });

  describe('delete', () => {
    it('should delete an image and update categories', async () => {
      const category = { id: 'cat-1', images: [mockImage.id], count: 1 };
      
      (loadImagesData as jest.Mock).mockResolvedValue({ 
        images: [mockImage], 
        categories: [category] 
      });

      const result = await dao.delete(mockImage.id);
      
      expect(result).toBe(true);
      expect(saveImagesAndCategories).toHaveBeenCalledWith([], [
        { ...category, images: [], count: 0 }
      ]);
    });
  });

  describe('query', () => {
    it('should return sorted and paginated results', async () => {
      const images = [
        { ...mockImage, id: '1', name: 'a' },
        { ...mockImage, id: '2', name: 'b' },
        { ...mockImage, id: '3', name: 'c' }
      ];
      
      (loadImagesData as jest.Mock).mockResolvedValue({ images, categories: [] });

      const result = await dao.query({
        sort: { field: 'name', order: 'desc' },
        skip: 1,
        limit: 1
      });
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('b');
    });
  });

  describe('findByCategory', () => {
    it('should return images in category', async () => {
      const categoryId = 'cat-1';
      const imageInCategory = { ...mockImage, categories: [categoryId] };
      const imageNotInCategory = { ...mockImage, id: 'test-2', categories: [] };
      
      (loadImagesData as jest.Mock).mockResolvedValue({ 
        images: [imageInCategory, imageNotInCategory], 
        categories: [] 
      });

      const result = await dao.findByCategory(categoryId);
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(imageInCategory.id);
    });
  });
}); 