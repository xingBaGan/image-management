import { useState, useMemo } from 'react';
import {
  ViewMode,
  FilterType,
  SortType,
  SortDirection,
  LocalImageData,
  FilterOptions,
  ImportStatus,
  InstallStatus,
  TaskStatus,
  Category
} from '../types';

/**
 * Hook to manage the main application state
 */
export const useAppState = () => {
  // Settings and UI state
  const [isMaximized, setIsMaximized] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isZenMode, setIsZenMode] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [randomInspiration, setRandomInspiration] = useState<number>(0);
  
  // Image viewing and selection state
  const [viewingMedia, setViewingMedia] = useState<LocalImageData | null>(null);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [selectedImageForInfo, setSelectedImageForInfo] = useState<LocalImageData | null>(null);
  
  // Category and filtering state
  const [selectedCategory, setSelectedCategory] = useState<FilterType | string>(FilterType.Photos);
  const [filter, setFilter] = useState<FilterType>(FilterType.All);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Sorting state
  const [sortBy, setSortBy] = useState<SortType>(SortType.Date);
  const [sortDirection, setSortDirection] = useState<SortDirection>(SortDirection.Desc);
  
  // Media list state
  const [mediaList, setMediaList] = useState<LocalImageData[]>([]);
  const [filteredAndSortedImages, setFilteredAndSortedImages] = useState<LocalImageData[]>([]);
  
  // Search and filter state
  const [searchTags, setSearchTags] = useState<string[]>([]);
  const [filterColors, setFilterColors] = useState<string[]>([]);
  const [multiFilter, setMultiFilter] = useState<FilterOptions>({
    colors: [],
    ratio: [],
    rating: null,
    formats: [],
    precision: 0.85
  });
  
  // Import and installation state
  const [importState, setImportState] = useState<ImportStatus>(ImportStatus.Imported);
  const [installStatus, setInstallStatus] = useState<InstallStatus>(InstallStatus.Installed);

  // Progress tracking
  const [queueProgress, setQueueProgress] = useState<{
    tag: { total: number; completed: number; percentage: number; running: number };
    color: { total: number; completed: number; percentage: number; running: number };
  }>({
    tag: { total: 0, completed: 0, percentage: 0, running: 0 },
    color: { total: 0, completed: 0, percentage: 0, running: 0 }
  });
  
  // Task status
  const [tasksStatus, setTasksStatus] = useState<{
    tag: TaskStatus;
    color: TaskStatus;
  }>({
    tag: TaskStatus.Initialized,
    color: TaskStatus.Initialized
  });
  
  // Dialog state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showBindInFolderConfirm, setShowBindInFolderConfirm] = useState<{
    selectedImages: Set<string>;
    categories: Category[];
  } | null>(null);
  const [showInstallConfirm, setShowInstallConfirm] = useState<{
    isOpen: boolean;
    checkResult: any;
  } | null>(null);
  const [messageBox, setMessageBox] = useState<{
    isOpen: boolean;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
  }>({
    isOpen: false,
    message: '',
    type: 'info'
  });

  // Refs for keyboard shortcuts
  const searchButtonRef = { current: null as HTMLElement | null };
  const sortButtonRef = { current: null as HTMLElement | null };
  const filterButtonRef = { current: null as HTMLElement | null };

  // Folders that should be watched for changes
  const shouldListenFolders = useMemo(() => {
    return categories.filter(cate => cate?.folderPath).map(it => it.folderPath);
  }, [categories]);

  // The selected images as a list (derived state)
  const selectedImagesList = useMemo(() =>
    mediaList.filter(img => selectedImages.has(img.id)),
    [mediaList, selectedImages]
  );

  return {
    // UI state
    isMaximized,
    setIsMaximized,
    isSettingsOpen,
    setIsSettingsOpen,
    isZenMode, 
    setIsZenMode,
    viewMode,
    setViewMode,
    randomInspiration,
    setRandomInspiration,
    
    // Media and selection state
    viewingMedia,
    setViewingMedia,
    selectedImages,
    setSelectedImages,
    selectedImageForInfo,
    setSelectedImageForInfo,
    mediaList,
    setMediaList,
    filteredAndSortedImages,
    setFilteredAndSortedImages,
    
    // Category and filtering
    selectedCategory,
    setSelectedCategory,
    filter,
    setFilter,
    categories,
    setCategories,
    
    // Sorting
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    
    // Search and filters
    searchTags,
    setSearchTags,
    filterColors,
    setFilterColors,
    multiFilter,
    setMultiFilter,
    
    // Import and installation
    importState,
    setImportState,
    installStatus,
    setInstallStatus,
    
    // Progress tracking
    queueProgress,
    setQueueProgress,
    tasksStatus,
    setTasksStatus,
    
    // Dialog state
    showDeleteConfirm,
    setShowDeleteConfirm,
    showBindInFolderConfirm,
    setShowBindInFolderConfirm,
    showInstallConfirm,
    setShowInstallConfirm,
    messageBox,
    setMessageBox,
    
    // Refs
    searchButtonRef,
    sortButtonRef,
    filterButtonRef,
    
    // Derived state
    shouldListenFolders,
    selectedImagesList
  };
}; 