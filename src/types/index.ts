export type ViewMode = 'grid' | 'list';

export interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
}

export interface PluginAPI {
    on: (channel: string, callback: (...args: any[]) => void) => void;
    removeListener: (channel: string, callback: (...args: any[]) => void) => void;
    getPlugins: () => Promise<Plugin[]>;
    initializePlugin: (pluginId: string) => Promise<void>;
    setupPlugin: (plugin: Plugin) => void;
}

export interface Category {
  id: string;
  name: string;
  images: string[];
  count: number;
}

export type MediaType = 'image' | 'video';

export interface MediaInfo  {
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

// 基础媒体类型
export interface BaseMediaData extends MediaInfo {
  url?: string;
  favorite?: boolean;
  tags: string[];
  categories?: string[];
  colors: (string | ColorInfo)[];
}

// 图片特定类型
export interface ImageData extends BaseMediaData {
  type: 'image';
}

// 视频特定类型
export interface VideoData extends BaseMediaData {
  type: 'video';
  duration?: number;
  thumbnail?: string;
}

// 统一类型
export type LocalImageData = ImageData | VideoData;

export type BulkAction = {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

export interface Settings {
  ComfyUI_URL: string;
  autoTagging: boolean;
  backgroundUrl: string;
  modelName: string;
  autoColor: boolean;
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

export enum ImportStatus {
  Importing = 'importing',
  Tagging = 'tagging',
  Imported = 'imported',
  Failed = 'failed',
}

export interface ElectronAPI {
  readDirectory: (path: string) => Promise<string[]>;
  readFileMetadata: (path: string) => Promise<{
    size: number;
    dateCreated: Date;
    dateModified: Date;
  }>;
  showOpenDialog: () => Promise<any[]>;
  saveImagesToJson: (images: LocalImageData[], categories: Category[]) => Promise<void>;
  loadImagesFromJson: (path: string) => Promise<{ images: LocalImageData[]; categories: Category[] }>;
  openImageJson: () => Promise<{ 
    success: boolean;
    error?: string;
  }>;
  saveCategories: (categories: Category[]) => Promise<void>;
  saveImageToLocal: (buffer: Uint8Array, fileName: string, ext: string) => Promise<string>;
  loadSettings: () => Promise<Settings>;
  saveSettings: (settings: Settings) => Promise<boolean>;
  isRemoteComfyUI: () => Promise<boolean>;
  readFile: (filePath: string) => Promise<Buffer>;
  tagImage: (imagePath: string, modelName: string) => Promise<string[]>;
  processDirectoryFiles: (dirPath: string) => Promise<LocalImageData[]>;
  openInEditor: (filePath: string) => Promise<{ success: boolean; error?: string }>;
  downloadUrlImage: (url: string) => Promise<{
    success: boolean;
    localPath?: string;
    fileName?: string;
    size?: number;
    type?: string;
    error?: string;
  }>;
  showInFolder: (filePath: string) => Promise<{ success: boolean; error?: string }>;
  getMainColor: (imagePath: string) => Promise<string[]>;
  onRemoteImagesDownloaded: (callback: (result: { success: boolean; error?: string }) => void) => void;
  removeRemoteImagesDownloadedListener: (callback: (result: { success: boolean; error?: string }) => void) => void;
}


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

// 添加类型守卫函数
export function isVideoMedia(media: LocalImageData): media is VideoData {
  return media.type === 'video';
}

export function isImageMedia(media: LocalImageData): media is ImageData {
  return media.type === 'image';
}