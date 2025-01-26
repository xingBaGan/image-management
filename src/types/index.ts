export interface BaseImageData {
  id: string;
  name: string;
  path: string;
  size: number;
  type: string;
  dateCreated: string;
  dateModified: string;
  favorite?: boolean;
  tags: string[];
  categories?: string[];
}

export interface ImageInfo extends BaseImageData {
  url?: string;
}

export interface LocalImageData extends BaseImageData {
  url?: string;
  width?: number;
  height?: number;
}

export type ViewMode = 'grid' | 'list';

export type SortBy = 'name' | 'date' | 'size';

export type FilterType = 'all' | 'favorites' | 'recent' | 'videos';

export interface AppState {
  filter: FilterType;
}

export type BulkAction = {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

export interface Category {
  id: string;
  name: string;
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
  loadSettings: () => Promise<{ ComfyUI_URL: string, autoTagging: boolean }>;
  saveSettings: (settings: { ComfyUI_URL: string, autoTagging: boolean }) => Promise<boolean>;
  isRemoteComfyUI: () => Promise<boolean>;
  readFile: (filePath: string) => Promise<Buffer>;
  tagImage: (imagePath: string, modelName: string) => Promise<string[]>;
  processDirectoryToFiles: (dirPath: string) => Promise<File[]>;
}

declare global {
  interface Window {
    electron: ElectronAPI
  }
}

export {};