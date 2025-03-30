import React from 'react';
import MediaGrid from './MediaGrid';
import ImageInfoSidebar from './ImageInfoSidebar';
import Toolbar from './Toolbar';
import { 
  ViewMode, 
  LocalImageData, 
  ImportStatus, 
  FilterOptions,
  Category,
  SortType,
  SortDirection,
  FilterType,
  AppendButtonsProps,
  InstallStatus
} from '../types/index.ts';

interface MainContentProps {
  viewMode: ViewMode;
  sortBy: SortType;
  sortDirection: SortDirection;
  onViewModeChange: (mode: ViewMode) => void;
  onSortChange: (sortBy: SortType) => void;
  onSearch: (tags: string[]) => void;
  selectedCount: number;
  bulkActions: Array<{
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    categories?: Category[];
    onSelectCategories?: (categories: string[]) => void;
  }>;
  onToggleSidebar: () => void;
  onImport: () => void;
  isSidebarOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  isSettingsOpen: boolean;
  filterColors: string[];
  setFilterColors: (colors: string[]) => void;
  searchButtonRef: React.RefObject<HTMLElement>;
  sortButtonRef: React.RefObject<HTMLElement>;
  filterButtonRef: React.RefObject<HTMLElement>;
  selectedImages: Set<string>;
  multiFilter: FilterOptions;
  setMultiFilter: (filters: FilterOptions | ((prev: FilterOptions) => FilterOptions)) => void;
  
  // MediaGrid props
  images: LocalImageData[];
  onFavorite: (id: string) => void;
  onSelectImage: (id: string, isShiftKey: boolean) => void;
  updateTagsByMediaId: (mediaId: string, newTags: string[]) => void;
  addImages: (images: LocalImageData[]) => void;
  existingImages: LocalImageData[];
  categories: Category[];
  setImportState: (state: ImportStatus) => void;
  importState: ImportStatus;
  onOpenInEditor: (path: string) => void;
  gridItemAppendButtonsProps: AppendButtonsProps[];
  
  // 添加 onRateChange handler
  onRateChange: (mediaId: string, rate: number) => void;
  
  // 添加 setSelectedImages
  setSelectedImages: (images: Set<string>) => void;
  currentSelectedCategory?: Category| string;
  installStatus: InstallStatus;
  searchTags: string[];
  setSearchTags: React.Dispatch<React.SetStateAction<string[]>>;
}

export const MainContent: React.FC<MainContentProps> = ({
  viewMode,
  sortBy,
  sortDirection,
  onViewModeChange,
  onSortChange,
  onSearch,
  selectedCount,
  bulkActions,
  onToggleSidebar,
  onImport,
  isSidebarOpen,
  setIsSettingsOpen,
  isSettingsOpen,
  filterColors,
  setFilterColors,
  searchButtonRef,
  sortButtonRef,
  filterButtonRef,
  selectedImages,
  multiFilter,
  setMultiFilter,
  images,
  onFavorite,
  onSelectImage,
  updateTagsByMediaId,
  addImages,
  existingImages,
  categories,
  setImportState,
  importState,
  onOpenInEditor,
  gridItemAppendButtonsProps,
  onRateChange,
  setSelectedImages,
  currentSelectedCategory,
  installStatus,
  searchTags,
  setSearchTags
}) => {
  // 获取当前选中的图片
  const selectedImage = React.useMemo(() => 
    images?.find(img => selectedImages.has(img.id)) || null
  , [images, selectedImages]);

  return (
    <div className="flex overflow-hidden relative flex-col flex-1">
      <Toolbar 
        viewMode={viewMode}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onViewModeChange={onViewModeChange}
        onSortChange={onSortChange}
        onSearch={onSearch}
        selectedCount={selectedCount}
        bulkActions={bulkActions}
        onToggleSidebar={onToggleSidebar}
        onImport={onImport}
        isSidebarOpen={isSidebarOpen}
        setIsSettingsOpen={setIsSettingsOpen}
        isSettingsOpen={isSettingsOpen}
        filterColors={filterColors}
        setFilterColors={setFilterColors}
        searchButtonRef={searchButtonRef}
        sortButtonRef={sortButtonRef}
        filterButtonRef={filterButtonRef}
        selectedImages={selectedImages}
        multiFilter={multiFilter}
        setMultiFilter={setMultiFilter}
        searchTags={searchTags}
        setSearchTags={setSearchTags}
      />
      <div className="flex overflow-y-auto flex-1">
        <div className={`flex-1 ${isSidebarOpen ? 'mr-0' : 'mr-60'}`}>
          <MediaGrid
            images={images}
            onFavorite={onFavorite}
            viewMode={viewMode}
            selectedImages={selectedImages}
            onSelectImage={onSelectImage}
            updateTagsByMediaId={updateTagsByMediaId}
            addImages={addImages}
            existingImages={existingImages}
            categories={categories}
            setImportState={setImportState}
            importState={importState}
            onOpenInEditor={onOpenInEditor}
            gridItemAppendButtonsProps={gridItemAppendButtonsProps}
            currentSelectedCategory={currentSelectedCategory}
            installStatus={installStatus}
          />
        </div>
        <div className="fixed right-0 bottom-0 top-16">
          {!isSidebarOpen && (
            <ImageInfoSidebar
              image={selectedImage as LocalImageData}
              onTagsUpdate={updateTagsByMediaId}
              onRateChange={onRateChange}
              totalImages={images.length}
              totalVideos={images.filter(img => img.type === 'video').length}
              type={currentSelectedCategory === FilterType.Videos ? 'video' : 'image'}
              setFilterColors={setFilterColors}
              setSelectedImages={setSelectedImages}
            />
          )}
        </div>
      </div>
    </div>
  );
}; 