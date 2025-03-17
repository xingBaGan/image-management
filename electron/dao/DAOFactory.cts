// src/dao/DAOFactory.ts
import { ImageDAO } from './ImageDAO.cjs';
import { CategoryDAO } from './CategoryDAO.cjs';
import FileSystemImageDAO from './impl/FileSystemImageDAO.cjs';
import FileSystemCategoryDAO from './impl/FileSystemCategoryDAO.cjs';

export class DAOFactory {
  private static imageDAO: ImageDAO;
  private static categoryDAO: CategoryDAO;

  static getImageDAO(): ImageDAO {
    if (!this.imageDAO) {
      this.imageDAO = new FileSystemImageDAO();
    }
    return this.imageDAO;
  }

  static getCategoryDAO(): CategoryDAO {
    if (!this.categoryDAO) {
      this.categoryDAO = new FileSystemCategoryDAO();
    }
    return this.categoryDAO;
  }
}