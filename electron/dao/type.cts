export interface Image {
  _id?: string;          // PouchDB 主键
  rev?: string;         // PouchDB 版本号
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
  rating: number;
  colors: string[];
}

export interface Category {
  _id?: string;          // PouchDB 主键
  rev?: string;         // PouchDB 版本号
  id: string;            // 业务ID
  name: string;
  images: string[];
  count: number;
  folderPath?: string;
  isImportFromFolder?: boolean;
  order?: number;
  children?: Category[];
  father?: Category | null; // 新增父分类属性
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
  colors: ColorInfo[];
  isBindInFolder?: boolean;
  isDirty?: boolean;
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

export enum FilterType {
  Recent = 'recent',
  Favorites = 'favorites',
  All = 'all',
  Photos = 'photos',
  Videos = 'videos',
}

export enum SortDirection {
  Asc = 'asc',
  Desc = 'desc',
}

export enum SortType {
  Name = 'name',
  Date = 'date',
  Size = 'size',
}

export interface FilterOptions {
  colors: string[];
  ratio: string[];
  rating: number | null;
  formats: string[];
  precision: number;
}

export interface Filter {
  id: string;
  type: 'colors' | 'ratio' | 'rating' | 'formats';
  label: string;
  options?: string[];
}

export interface ImportFile extends Omit<File, 'arrayBuffer' | 'text' | 'stream' | 'slice'> {
  dateCreated: string;
  dateModified: string;
  thumbnail?: string;
  arrayBuffer: () => Promise<ArrayBuffer>;
  text: () => Promise<string>;
  stream: () => ReadableStream;
  slice: (start?: number, end?: number, contentType?: string) => Blob;
}