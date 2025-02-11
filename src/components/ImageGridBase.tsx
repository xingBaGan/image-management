import { Category, LocalImageData, ViewMode, ImportStatus, AppendButtonsProps } from '../types';

export interface ImageGridBaseProps {
  images: LocalImageData[];
  onFavorite: (id: string) => void;
  viewMode: ViewMode;
  selectedImages: Set<string>;
  onSelectImage: (id: string, isShiftKey: boolean) => void;
  updateTagsByMediaId: (mediaId: string, newTags: string[]) => void;
  addImages: (newImages: LocalImageData[]) => void;
  existingImages: LocalImageData[];
  categories: Category[];
  setImportState: (importState: ImportStatus) => void;
  importState: ImportStatus;
  setViewingMedia?: (media: LocalImageData | null) => void;
  onOpenInEditor: (path: string) => void;
  showInFolder?: (path: string) => void;
  gridItemAppendButtonsProps: AppendButtonsProps[];
}

export interface MediaItemProps {
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onDoubleClick: (e: React.MouseEvent) => void;
  onFavorite: (id: string) => void;
  viewMode: ViewMode;
}

export const handleContextMenu = (e: React.MouseEvent) => {
  e.preventDefault();
};

export const breakpointColumns = {
  default: 4,
  1536: 3,
  1280: 3,
  1024: 2,
  768: 2,
  640: 1,
}; 