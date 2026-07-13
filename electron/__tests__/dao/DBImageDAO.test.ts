import DBImageDAO from '../../dao/impl/dbImageDao.cjs';
import { ImageDatabase } from '../../pouchDB/Database.cjs';
import type { LocalImageData, Category } from '../../dao/type.cts';

jest.mock('../../services/FileService.cjs', () => ({
  deletePhysicalFile: jest.fn(),
}));

jest.mock('../../services/tagFrequencyCache.cjs', () => ({
  tagFrequencyCache: {
    invalidateCache: jest.fn(),
    getTagFrequency: jest.fn(),
  }
}));

jest.mock('../../pouchDB/Database.cjs', () => ({
  ImageDatabase: {
    getInstance: jest.fn(),
  }
}));

describe('DBImageDAO', () => {
  let dao: DBImageDAO;
  let mockDb: {
    updateImage: jest.Mock;
    getImage: jest.Mock;
    getAllImages: jest.Mock;
    getAllCategories: jest.Mock;
  };
  let mockImages: LocalImageData[];
  let mockCategories: Category[];

  beforeEach(() => {
    mockDb = {
      updateImage: jest.fn().mockResolvedValue(null),
      getImage: jest.fn(),
      getAllImages: jest.fn().mockResolvedValue([]),
      getAllCategories: jest.fn().mockResolvedValue([]),
    };
    (ImageDatabase.getInstance as jest.Mock).mockReturnValue(mockDb);

    dao = new DBImageDAO();
    mockImages = [
      {
        id: '1',
        name: 'test1.jpg',
        path: 'path/to/test1.jpg',
        size: 1000,
        type: 'image',
        extension: '.jpg',
        dateModified: '2024-01-01',
        dateCreated: '2024-01-01',
        favorite: false,
        rating: 0,
        tags: ['tag1'],
        colors: [],
        ratio: '16:9',
        categories: ['cat1'],
        isBindInFolder: false
      }
    ];
    mockCategories = [
      { id: 'cat1', name: 'Category 1', images: ['1'], count: 1 }
    ];
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateTagTranslation', () => {
    it('should persist translated tags for an image', async () => {
      const translatedTags = ['标签1', '标签2'];

      const result = await dao.updateTagTranslation('1', 'zh', translatedTags, mockImages, mockCategories);

      expect(mockDb.updateImage).toHaveBeenCalledWith('1', {
        tagTranslations: {
          zh: translatedTags
        }
      });
      expect(result.find((img: LocalImageData) => img.id === '1')).toMatchObject({
        id: '1',
        tagTranslations: {
          zh: translatedTags
        }
      });
    });
  });

  describe('getImagesAndCategories', () => {
    it('should preserve tag translations when converting DB records', async () => {
      mockDb.getAllImages.mockResolvedValue([
        {
          id: '1',
          path: 'path/to/test1.jpg',
          name: 'test1.jpg',
          extension: '.jpg',
          size: 1000,
          dateCreated: '2024-01-01',
          dateModified: '2024-01-01',
          tags: ['tag1'],
          tagTranslations: {
            zh: ['标签1']
          },
          favorite: false,
          categories: ['cat1'],
          type: 'image',
          width: 100,
          height: 100,
          isBindInFolder: false,
          rating: 0,
          colors: []
        }
      ]);

      const result = await dao.getImagesAndCategories();

      expect(result.images[0]).toMatchObject({
        id: '1',
        tagTranslations: {
          zh: ['标签1']
        }
      });
    });
  });
});
