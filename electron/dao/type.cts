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

export interface FetchDataResult {
  images: LocalImageData[];
  limit: number;
  hasMore: boolean;
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
  order?: string;
  children?: Category['id'][];
  father?: Category['id'] | null; // 新增父分类属性
  level?: number;
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

export interface Sampler {
  name: string;
  parameters: {
    scheduler: string;
    cfg_scale: number;
    seed: number;
    steps: number;
  };
}

export interface Model {
  name: string;
  hash: string;
  model_id: string;
  metadata: Record<string, unknown>;
}
export interface ImageMetadata {
  generator: string;
  positive_prompts: string[];
  negative_prompts: string[];
  model: Model|string;
  samplers: Sampler;
}

export interface ImageData extends BaseMediaData {
  type: 'image';
  metadata?: ImageMetadata;
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