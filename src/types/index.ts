
export type ViewMode = 'grid' | 'list';


export interface Category {
  id: string;
  name: string;
  images: string[];
  count: number;
}

export interface ImageInfo  {
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
}

export interface LocalImageData extends ImageInfo {
  url?: string;
  favorite?: boolean;
  tags: string[];
  categories?: string[];
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
}

export interface ImportFile extends File {
  dateCreated: string;
  dateModified: string;
}

interface ElectronAPI {
  readDirectory: (path: string) => Promise<string[]>;
  readFileMetadata: (path: string) => Promise<{
    size: number;
    dateCreated: Date;
    dateModified: Date;
  }>;
  showOpenDialog: () => Promise<LocalImageData[]>;
  saveImagesToJson: (images: LocalImageData[], categories: Category[]) => Promise<boolean>;
  loadImagesFromJson: (jsonPath: string) => Promise<{ 
    images: LocalImageData[];
    categories: Category[];
  }>;
  openImageJson: () => Promise<{ 
    success: boolean;
    error?: string;
  }>;
  saveCategories: (categories: Category[]) => Promise<{ success: boolean }>;
  saveImageToLocal: (imageBuffer: Uint8Array, fileName: string, ext: string) => Promise<string>;
  loadSettings: () => Promise<Settings>;
  saveSettings: (settings: Settings) => Promise<boolean>;
  isRemoteComfyUI: () => Promise<boolean>;
  readFile: (filePath: string) => Promise<Buffer>;
  tagImage: (imagePath: string, modelName: string) => Promise<string[]>;
  processDirectoryToFiles: (dirPath: string) => Promise<File[]>;
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

declare global {
  interface Window {
    electron: ElectronAPI
  }
}

export {};