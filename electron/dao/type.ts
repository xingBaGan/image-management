// src/dao/types.ts
export interface Image {
  _id?: string;          // PouchDB 主键
  _rev?: string;         // PouchDB 版本号
  id: string;            // 业务ID
  path: string;
  name: string;
  extension: string;
  size: number;
  dateCreated: string;
  dateModified: string;
  tags: string[];
  favorite: boolean;
  categories: string[];
  type: 'video' | 'image';
  width: number;
  height: number;
  ratio?: string;
  duration?: number;
  thumbnail?: string;
  isBindInFolder: boolean;
}

export interface Category {
  _id?: string;          // PouchDB 主键
  _rev?: string;         // PouchDB 版本号
  id: string;            // 业务ID
  name: string;
  images: string[];
  count: number;
  folderPath?: string;
  isImportFromFolder?: boolean;
}

export interface QueryOptions {
  limit?: number;
  skip?: number;
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
}

export type MediaType = 'image' | 'video';

export interface MediaInfo {
  id: string;
  name: string;
  path: string;
  size: number;
  type: MediaType;
  dateCreated: string;
  dateModified: string;
  url?: string;
  width?: number;
  height?: number;
  extension: string;
  rating?: number;
  ratio?: string;
}

export interface ColorInfo {
  color: string;
  percentage: number;
}


export interface BaseMediaData extends MediaInfo {
  url?: string;
  favorite?: boolean;
  tags: string[];
  categories?: string[];
  colors: (string | ColorInfo)[];
  isBindInFolder?: boolean | Category;
}

export interface ImageData extends BaseMediaData {
  type: 'image';
}

export interface VideoData extends BaseMediaData {
  type: 'video';
  duration?: number;
  thumbnail?: string;
}

export type LocalImageData = ImageData | VideoData;