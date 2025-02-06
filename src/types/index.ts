export type ViewMode = 'grid' | 'list';


export interface Category {
  id: string;
  name: string;
  images: string[];
  count: number;
}

export interface MediaInfo  {
  id: string;
  name: string;
  path: string;
  size: number;
  type: string;
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

export interface LocalImageData extends MediaInfo {
  url?: string;
  favorite?: boolean;
  tags: string[];
  categories?: string[];
  colors: (string | ColorInfo)[];
}

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

interface ElectronAPI {
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
  processDirectory: (dirPath: string) => Promise<LocalImageData[]>;
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
}


export interface Filter {
  id: string;
  type: 'colors' | 'ratio' | 'rating' | 'formats';
  label: string;
  options?: string[];
  isMultiple?: boolean;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

export type { ElectronAPI };

export {};