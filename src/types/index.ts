export interface ImageData {
  id: string;
  name: string;
  path: string;
  size: number;
  dateCreated: string;
  dateModified: string;
  tags: string[];
  favorite: boolean;
}

export type Image = ImageData;

export interface Category {
  id: string;
  name: string;
  count?: number;
  icon?: React.ReactNode;
}

export type ViewMode = 'grid' | 'list';
export type SortBy = 'name' | 'date' | 'size';

export interface BulkAction {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

export interface ImageInfo extends ImageData {
  created: string;
  modified: string;
}

interface ElectronAPI {
  readDirectory: (path: string) => Promise<string[]>;
  readFileMetadata: (path: string) => Promise<{
    size: number;
    created: Date;
    modified: Date;
  }>;
  showOpenDialog: () => Promise<{
    path: string;
    originalPath: string;
    size: number;
    dateCreated: string;
    dateModified: string;
  }[]>;
  saveImagesToJson: (images: ImageData[], categories: Category[]) => Promise<boolean>;
  loadImagesFromJson: (jsonPath: string) => Promise<{ 
    images: ImageInfo[];
    categories: Category[];
  }>;
  openImageJson: () => Promise<{ 
    success: boolean;
    error?: string;
  }>;
}

declare global {
  interface Window {
    electron: ElectronAPI
  }
}

export type FilterType = 'all' | 'favorites' | 'recent';

export interface AppState {
  filter: FilterType;
}

export {};