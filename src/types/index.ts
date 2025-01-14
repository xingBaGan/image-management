export interface ImageData {
  id: string;
  path: string;
  name: string;
  size: number;
  dimensions?: {
    width: number;
    height: number;
  };
  dateCreated: string;
  dateModified: string;
  tags: string[];
  favorite: boolean;
}

export type Image = ImageData;

export interface Category {
  id: string;
  name: string;
  icon?: string;
  count: number;
}

export type ViewMode = 'grid' | 'list';
export type SortBy = 'name' | 'date' | 'size';

export interface BulkAction {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

export interface ImageInfo {
  id: number;
  name: string;
  path: string;
  size: number;
  created: string;
  modified: string;
  tags: string[];
}

declare global {
  interface Window {
    electron: {
      readDirectory: (path: string) => Promise<string[]>;
      readFileMetadata: (path: string) => Promise<{
        size: number;
        created: Date;
        modified: Date;
      }>;
      showOpenDialog: () => Promise<{
        path: string;
        size: number;
        dateCreated: string;
        dateModified: string;
      }[]>;
      saveImagesToJson: (images: ImageData[]) => Promise<boolean>;
      loadImagesFromJson: (jsonPath: string) => Promise<{ images: ImageInfo[] }>;
    };
  }
}

export {};