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

export type BaseImage = {
  id: string;
  name: string;
  path: string;
  size: number;
  tags: string[];
  favorite: boolean;
  categories: string[];
  type: 'image' | 'video';
  duration?: number;
  thumbnail?: string;
  rate?: number;
  width?: number;
  height?: number;
}

export type Image = LocalImageData;

export interface Category {
  id: string;
  name: string;
  count?: number;
  icon?: React.ReactNode;
  images: string[];
}

export type ViewMode = 'grid' | 'list';
export type SortBy = 'name' | 'date' | 'size';

export type BulkAction = {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

interface ElectronAPI {
  readDirectory: (path: string) => Promise<string[]>;
  readFileMetadata: (path: string) => Promise<{
    size: number;
    dateCreated: Date;
    dateModified: Date;
  }>;
  showOpenDialog: () => Promise<ImageInfo[]>;
  saveImagesToJson: (images: LocalImageData[], categories: Category[]) => Promise<boolean>;
  loadImagesFromJson: (jsonPath: string) => Promise<{ 
    images: ImageInfo[];
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
}

declare global {
  interface Window {
    electron: ElectronAPI
  }
}

export type FilterType = 'all' | 'favorites' | 'recent' | 'videos';

export interface AppState {
  filter: FilterType;
}

export {};