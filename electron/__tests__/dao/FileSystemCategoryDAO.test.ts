import FileSystemCategoryDAO from '../../dao/impl/FileSystemCategoryDAO.cts';
import { loadImagesData, saveImagesAndCategories } from '../../services/FileService.cjs';
import { Category } from '../../dao/type';

jest.mock('../../services/FileService.cjs');

describe('FileSystemCategoryDAO', () => {
  let dao: FileSystemCategoryDAO;
  let mockCategory: Category;

  beforeEach(() => {
    dao = new FileSystemCategoryDAO();
    mockCategory = {
      "id": "1",
      "name": "风景",
      "images": [
        "26ba9d87",
        "2bbb1c86"
      ],
      "count": 2
    };

    // Reset mocks
    (loadImagesData as jest.Mock).mockReset();
    (saveImagesAndCategories as jest.Mock).mockReset();
  });

  
}); 