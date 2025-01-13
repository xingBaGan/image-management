export interface Image {
  id: string;
  path: string;
  name: string;
  size: number;
  dimensions: {
    width: number;
    height: number;
  };
  created: Date;
  modified: Date;
  tags: string[];
  favorite: boolean;
}

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