// src/dao/DAOFactory.ts
import { ImageDAO } from './ImageDAO.cjs';
import { CategoryDAO } from './CategoryDAO.cjs';
import FileSystemImageDAO from './impl/FileSystemImageDAO.cjs';
import FileSystemCategoryDAO from './impl/FileSystemCategoryDAO.cjs';
import DBImageDAO from './impl/dbImageDao.cjs';
import DBCategoryDAO from './impl/dbCategoryDao.cjs';
import { isReadFromDB } from '../services/checkImageCount.cjs'
import { logger } from '../services/logService.cjs';
export class DAOFactory {
  private static imageDAO: ImageDAO;
  private static categoryDAO: CategoryDAO;
  private static lastReadMethod: 'file' | 'db';

  static getImageDAO(): ImageDAO {
    const _isReadFromDB = isReadFromDB();
    let readMethod = _isReadFromDB ? 'db' : 'file';
    if (!_isReadFromDB && !this.imageDAO) {
      logger.info('read from file system');
      this.imageDAO = new FileSystemImageDAO();
      this.lastReadMethod = 'file';
    } else if (_isReadFromDB && !this.imageDAO) {
      logger.info('read from db');
      this.imageDAO = new DBImageDAO();
      this.lastReadMethod = 'db';
    }
    // 切换了读取方式
    if (readMethod === 'file' && this.lastReadMethod === 'db') {
      this.imageDAO = new FileSystemImageDAO();
      this.lastReadMethod = 'file';
    } else if (readMethod === 'db' && this.lastReadMethod === 'file') {
      this.imageDAO = new DBImageDAO();
      this.lastReadMethod = 'db';
    }
    return this.imageDAO;
  }

  static getCategoryDAO(): CategoryDAO {
    const _isReadFromDB = isReadFromDB();
    let readMethod = _isReadFromDB ? 'db' : 'file';
    if (!_isReadFromDB && !this.categoryDAO) {
      this.categoryDAO = new FileSystemCategoryDAO();
      this.lastReadMethod = 'file';
    } else if (_isReadFromDB && !this.categoryDAO) {
      this.categoryDAO = new DBCategoryDAO();
      this.lastReadMethod = 'db';
    }
    // 切换了读取方式
    if (readMethod === 'file' && this.lastReadMethod === 'db') {
      this.categoryDAO = new FileSystemCategoryDAO();
      this.lastReadMethod = 'file';
    } else if (readMethod === 'db' && this.lastReadMethod === 'file') {
      this.categoryDAO = new DBCategoryDAO();
      this.lastReadMethod = 'db';
    }
    return this.categoryDAO;
  }
}