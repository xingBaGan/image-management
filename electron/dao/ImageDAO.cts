// src/dao/ImageDAO.ts
import { Image, QueryOptions } from './type';

export interface ImageDAO {
  // 基础CRUD
  create(image: Image): Promise<Image>;
  update(image: Image): Promise<Image>;
  delete(id: string): Promise<boolean>;
  get(id: string): Promise<Image | null>;
  
  // 批量操作
  bulkCreate(images: Image[]): Promise<Image[]>;
  bulkUpdate(images: Image[]): Promise<Image[]>;
  bulkDelete(ids: string[]): Promise<boolean>;
  
  // 查询操作
  query(options?: QueryOptions): Promise<Image[]>;
  findByCategory(categoryId: string): Promise<Image[]>;
  findByTags(tags: string[]): Promise<Image[]>;
  findByPath(path: string): Promise<Image | null>;
  
  // 特殊操作
  updateTags(id: string, tags: string[]): Promise<Image>;
  updateCategories(id: string, categories: string[]): Promise<Image>;
  toggleFavorite(id: string): Promise<Image>;
  updateMetadata(id: string, metadata: Partial<Image>): Promise<Image>;
}