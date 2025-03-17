// src/dao/DAOFactory.ts
import { ImageDAO } from './ImageDAO.cjs';
import { CategoryDAO } from './CategoryDAO.cjs';
import FileSystemImageDAO from './impl/FileSystemImageDAO.cjs';
import FileSystemCategoryDAO from './impl/FileSystemCategoryDAO.cjs';
import DBImageDAO from './impl/dbImageDao.cjs';
import DBCategoryDAO from './impl/dbCategoryDao.cjs';
import { isReadFromDB } from '../utils/index.cjs'
export class DAOFactory {
  private static imageDAO: ImageDAO;
  private static categoryDAO: CategoryDAO;

  static getImageDAO(): ImageDAO {
    const _isReadFromDB = isReadFromDB();
    if (!_isReadFromDB && !this.imageDAO) {
      this.imageDAO = new FileSystemImageDAO();
    } else if (_isReadFromDB && !this.imageDAO) {
      this.imageDAO = new DBImageDAO();
    }
    return this.imageDAO;
  }

  static getCategoryDAO(): CategoryDAO {
    const _isReadFromDB = isReadFromDB();
    if (!_isReadFromDB && !this.categoryDAO) {
      this.categoryDAO = new FileSystemCategoryDAO();
    } else if (_isReadFromDB && !this.categoryDAO) {
      this.categoryDAO = new DBCategoryDAO();
    }
    return this.categoryDAO;
  }
}