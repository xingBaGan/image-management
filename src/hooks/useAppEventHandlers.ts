import { useCallback, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useLocale } from '../contexts/LanguageContext';
import { useCategoryOperations } from './useCategoryOperations';
import { useImageOperations } from './useImageOperations';
import useBatchTag from './useBatchTag';
import { addTagsToImages } from '../services/tagService';
import { processMedia, addImagesToCategory, isArrayOfString } from '../utils';
import {
  Category,
  LocalImageData,
  ImportStatus,
  SortType,
  SortDirection,
  FilterType,
  DeleteType,
  ImportFile,
  InstallStatus,
  TaskStatus
} from '../types';
import { toast } from 'react-toastify';

export const useAppEventHandlers = (state: ReturnType<typeof import('./useAppState').useAppState>) => {
  const { settings } = useSettings();
  const { t } = useLocale();
  
  const {
    selectedCategory,
    setSelectedCategory,
    mediaList,
    setMediaList,
    selectedImages,
    setSelectedImages,
    setSelectedImageForInfo,
    sortBy,
    setSortBy,
    setSortDirection,
    setImportState,
    setMessageBox,
    selectedImagesList,
    randomInspiration,
    setRandomInspiration,
    categories,
    setCategories,
    tasksStatus
  } = state;

  // Use image operations hook
  const {
    handleFavorite: handleFavoriteBase,
    handleImportImages: handleImportImagesBase,
    handleAddImages: handleAddImagesBase,
    handleBulkDelete: handleBulkDeleteBase,
    updateTagsByMediaId: updateTagsByMediaIdBase,
    handleRateChange: handleRateChangeBase,
    loadImages,
    executeDelete: executeDeleteBase,
    handleBatchTagImages: handleBatchTagImagesBase,
  } = useImageOperations(state);

  // Use category hook
  const {
    handleAddCategory: handleAddCategoryBase,
    handleRenameCategory,
    handleDeleteCategory,
    handleReorderCategories,
    handleAddToCategory: handleAddToCategoryBase,
    handleImportFolder,
    handleSelectSubfolder
  } = useCategoryOperations({
    setImages: setMediaList,
    images: mediaList,
    setSelectedCategory,
    categories,
    setCategories
  });

  // Current selected category
  const currentSelectedCategory = categories.find(cat => cat.id === selectedCategory);

  // Wrapped functions to provide correct parameters
  const handleAddCategory = async (category: Category) => {
    await handleAddCategoryBase(category, mediaList);
  };

  const handleAddToCategory = async (selectedCategoryIds: string[]) => {
    const updatedImages = await handleAddToCategoryBase(selectedImages, selectedCategoryIds, mediaList);
    if (updatedImages) {
      setMediaList(updatedImages);
      setSelectedImages(new Set());
    }
  };

  // Handle image selection
  const handleImageSelect = useCallback((id: string, isShiftKey: boolean) => {
    setSelectedImages(prev => {
      const newSelection = new Set<string>();

      if (!id) {
        setSelectedImageForInfo(null);
        return newSelection;
      }

      if (isShiftKey) {
        prev.forEach(imageId => newSelection.add(imageId));
        if (newSelection.has(id)) {
          newSelection.delete(id);
        } else {
          newSelection.add(id);
        }
      } else {
        if (prev.has(id) && prev.size === 1) {
          newSelection.clear();
        } else {
          newSelection.add(id);
        }
      }

      // Update selected image info display
      if (newSelection.size > 0) {
        // Get the first selected image ID
        const firstSelectedId = Array.from(newSelection)[0];
        const selectedImage = mediaList.find(img => img.id === firstSelectedId);
        setSelectedImageForInfo(selectedImage || null);
      } else {
        setSelectedImageForInfo(null);
      }

      return newSelection;
    });
  }, [mediaList, setSelectedImages, setSelectedImageForInfo]);

  // Handle batch tagging
  const handleBatchTagImages = async (imageIds: string[], tagNames: string[]) => {
    await handleBatchTagImagesBase(imageIds, tagNames, categories);
    setSelectedImages(new Set());
  };

  // Setup batch tagging
  const {
    isTagPopupOpen,
    isConfirmDialogOpen,
    batchTagNames,
    setBatchTagNames,
    openTagPopup,
    closeTagPopup,
    openConfirmDialog,
    closeConfirmDialog,
    handleBatchTag,
  } = useBatchTag({
    selectedImages: selectedImagesList,
    t,
    handleBatchTagImages,
  });

  // Wrapped favorite function
  const handleFavorite = async (id: string) => {
    await handleFavoriteBase(id, categories);
  };

  // Sorting function
  const handleSort = useCallback((newSortBy: SortType) => {
    if (newSortBy === sortBy) {
      setSortDirection(prev => prev === SortDirection.Asc ? SortDirection.Desc : SortDirection.Asc);
    } else {
      setSortBy(newSortBy);
      setSortDirection(SortDirection.Desc);
    }
  }, [sortBy, setSortBy, setSortDirection]);

  // Search function
  const handleSearch = useCallback((tags: string[]) => {
    state.setSearchTags(tags);
  }, [state]);

  // Bulk operations
  const handleBulkDelete = async () => {
    const newCategories = await handleBulkDeleteBase(selectedImages, categories);
    if (newCategories) {
      setCategories(newCategories);
      setSelectedImages(new Set());
    }
  };
  
  const handleBulkDeleteFromCategory = async () => {
    const newCategories = await handleBulkDeleteBase(
      selectedImages, 
      categories, 
      currentSelectedCategory, 
      DeleteType.DeleteFromCategory
    );
    if (newCategories) {
      setCategories(newCategories);
      setSelectedImages(new Set());
    }
  };

  // Add tags 
  const handleAddTags = useCallback(async () => {
    if (selectedCategory === FilterType.Videos) {
      setMessageBox({
        isOpen: true,
        message: '视频文件暂不支持批量打标签',
        type: 'warning'
      });
      return;
    }
    
    try {
     const { updatedImages, success } = await addTagsToImages(
       selectedImagesList,
       mediaList,
       categories,
       settings.modelName,
       setImportState,
     );

     if (success) {
       setMediaList(updatedImages);
       setSelectedImages(new Set());
     }
    } catch (error) {
     setImportState(ImportStatus.Imported);
     setSelectedImages(new Set());
     console.error('添加标签失败', error);
    }
  }, [selectedImagesList, mediaList, categories, settings.modelName, setImportState, setSelectedImages, selectedCategory, setMessageBox]);

  // Import images
  const handleImportImages = async () => {
    await handleImportImagesBase(categories, currentSelectedCategory);
  };

  // Add images 
  const handleAddImages = async (newImages: LocalImageData[]) => {
    try {
      await handleAddImagesBase(newImages, categories, currentSelectedCategory);
      // Force re-render
      setMediaList(prev => [...prev]);
    } catch (error) {
      console.error('Failed to add images:', error);
      setMessageBox({
        isOpen: true,
        message: t('importFailed', { error: String(error) }),
        type: 'error'
      });
    }
  };

  // Update tags 
  const updateTagsByMediaId = (mediaId: string, newTags: string[]) => {
    updateTagsByMediaIdBase(mediaId, newTags, categories);
  };

  // Rate change
  const handleRateChange = async (mediaId: string, rate: number) => {
    const updatedImage = await handleRateChangeBase(mediaId, rate, categories);
    if (updatedImage) {
      setSelectedImageForInfo(updatedImage);
    }
  };

  // Open in editor
  const handleOpenInEditor = useCallback((path: string) => {
    window.electron.openInEditor(path);
  }, []);

  // Delete confirmation
  const handleDeleteConfirm = (categoryId: string, images: LocalImageData[]) => {
    handleDeleteCategory(categoryId, images);
    state.setShowDeleteConfirm(null);
  };

  // Execute delete with the proper wrapping
  const executeDelete = async (selectedImages: Set<string>, categories: Category[]) => {
    const result = await executeDeleteBase(selectedImages, categories);
    return result;
  };

  // Random inspiration 
  const randomInspirationIndex = () => {
    if (randomInspiration === 0) {
      setRandomInspiration(1);
    } else if (randomInspiration < 10) {
      setRandomInspiration(prev => prev + 1);
    } else {
      setRandomInspiration(0);
    }
  };

  // Get random button state
  const getRandomButtonState = () => {
    if (randomInspiration === 0) {
      return {
        isActive: false,
        tooltip: t('randomOrder')
      };
    } else {
      return {
        isActive: true,
        tooltip: t('randomOrderTooltip', { progress: randomInspiration })
      };
    }
  };

  // Message box close
  const messageBoxClose = () => {
    setMessageBox(prev => ({ ...prev, isOpen: false }));
  };

  // Cancel operations
  const handleCancelTagging = async (setShouldShow: React.Dispatch<React.SetStateAction<boolean>>) => {
    setShouldShow(false);
    state.setQueueProgress({
      tag: { total: 0, completed: 0, percentage: 0, running: 0 },
      color: { total: 0, completed: 0, percentage: 0, running: 0 }
    });
    await window.electron.cancelTagging();
  };

  const handleCancelColor = async (setShouldShow: React.Dispatch<React.SetStateAction<boolean>>) => {
    setShouldShow(false);
    state.setQueueProgress({
      tag: { total: 0, completed: 0, percentage: 0, running: 0 },
      color: { total: 0, completed: 0, percentage: 0, running: 0 }
    });
    await window.electron.cancelColor();
  };

  // Handle paste
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.getAttribute('contenteditable') === 'true') {
        return;
      }

      e.preventDefault();
      const clipboardText = e.clipboardData?.getData('text') || '';
      if (clipboardText && /^\[.*\]/.test(clipboardText)) {
        const parsedTags = JSON.parse(clipboardText);
        if (isArrayOfString(parsedTags)) {
          return;
        }
      }

      // Check if it's a URL
      const isUrl = /^(http|https):\/\/[^ "]+$/.test(clipboardText);
      // Check if it's a local file path
      const isFilePath = /^([a-zA-Z]:\\|\\\\|\/)[^\n"]+\.(jpg|jpeg|png|gif|mp4|mov|avi|webm)$/i.test(clipboardText);

      let newImages: LocalImageData[] = [];
      let _category: Category | null = null;
      try {
        setImportState(ImportStatus.Importing);

        if (isUrl) {
          // Use the main process to download the image
          const result = await window.electron.downloadUrlImage(clipboardText);
          if (!result.success) {
            throw new Error(result.error);
          }
          const ext = result.type?.split('/').pop() || 'jpg';
          newImages = [{
            id: Date.now().toString(),
            path: result.localPath || '',
            name: result.fileName || '',
            extension: ext,
            size: result.size || 0,
            dateCreated: new Date().toISOString(),
            dateModified: new Date().toISOString(),
            tags: [],
            favorite: false,
            categories: [],
            type: 'image',
            colors: []
          }];
        } else if (isFilePath) {
          // Process local file path
          [newImages, _category] = await window.electron.processDirectoryFiles(clipboardText, currentSelectedCategory);
        } else if (e.clipboardData?.types.includes('Files') && e.clipboardData?.files.length > 0) {
          let filePaths = [];
          for (const file of e.clipboardData?.files) {
            if (file.type.startsWith('image/')) {
              filePaths.push(file.path);
            }
          }
          [newImages, _category] = await window.electron.processDirectoryFiles(filePaths, currentSelectedCategory);
        }
        const newImagesWithMetadata = newImages.map(img => ({
          ...img,
          lastModified: new Date(img.dateModified).getTime(),
          webkitRelativePath: '',
          arrayBuffer: async () => new ArrayBuffer(0),
          text: async () => '',
          stream: () => new ReadableStream(),
          slice: () => new Blob(),
          type: img.type || 'image/jpeg'
        })) as unknown as ImportFile[];
        
        let updatedImages = await processMedia(
          newImagesWithMetadata,
          mediaList,
          categories,
          setImportState,
          currentSelectedCategory
        );
        updatedImages = await addImagesToCategory(updatedImages, categories, currentSelectedCategory);
        setMediaList([...mediaList, ...updatedImages]);
        setMessageBox({
          isOpen: true,
          message: t('importSuccess'),
          type: 'success'
        });
      } catch (error: any) {
        console.error(t('pasteImageFailed', { error: String(error) }));
        setMessageBox({
          isOpen: true,
          message: t('importFailed', { error: error.message || t('error') }),
          type: 'error'
        });
      } finally {
        setImportState(ImportStatus.Imported);
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [mediaList, categories, t, currentSelectedCategory, setImportState, setMessageBox, setMediaList]);

  // Listen for cancel effects
  useEffect(() => {
    const s1 = tasksStatus.tag === TaskStatus.Canceled && tasksStatus.color !== TaskStatus.Running;
    const s2 = tasksStatus.color === TaskStatus.Canceled && tasksStatus.tag !== TaskStatus.Running;
    if (s1 || s2) {
      setImportState(ImportStatus.Imported);
      setSelectedImages(new Set());
      toast.error(t('canceled'));
    }
  }, [tasksStatus, setImportState, setSelectedImages, t]);

  // Install environment
  const handleInstallConfirm = async () => {
    try {
      state.setInstallStatus(InstallStatus.Installing);
      state.setShowInstallConfirm(null);
      await window.electron.installEnvironment();
    } catch (error) {
      console.error('Installation failed:', error);
      setMessageBox({
        isOpen: true,
        message: t('installationFailed', { error: String(error) }),
        type: 'error'
      });
    } finally {
      state.setInstallStatus(InstallStatus.Installed);
      const installResult = await window.electron.checkEnvironment();
      if (!installResult.needsInstall) {
        setMessageBox({
          isOpen: true,
          message: t('installationComplete'),
          type: 'success'
        });
      } else {
        setMessageBox({
          isOpen: true,
          message: t('restartAgainAndInstall'),
          type: 'error'
        });
      }
    }
  };

  return {
    // Category operations
    categoryOperations: {
      handleAddCategory,
      handleRenameCategory,
      handleDeleteCategory,
      handleReorderCategories,
      handleAddToCategory,
      handleImportFolder,
      handleSelectSubfolder,
      setCategories
    },
    
    // Image operations
    imageOperations: {
      handleFavorite,
      handleImportImages,
      handleAddImages,
      handleBulkDelete,
      updateTagsByMediaId,
      handleRateChange,
      handleOpenInEditor,
      handleSort,
      handleSearch,
      handleImageSelect,
      executeDelete,
      handleBatchTagImages,
      loadImages
    },
    
    // Batch operations
    handleBulkDelete,
    handleBulkDeleteFromCategory,
    handleAddTags,
    
    // Batch tag dialog
    isTagPopupOpen,
    isConfirmDialogOpen,
    batchTagNames,
    setBatchTagNames,
    openTagPopup,
    closeTagPopup,
    openConfirmDialog,
    closeConfirmDialog,
    handleBatchTag,
    
    // UI operations
    randomInspirationIndex,
    getRandomButtonState,
    
    // Dialog operations
    messageBoxClose,
    handleDeleteConfirm,
    handleInstallConfirm,
    
    // Cancellation handlers
    handleCancelTagging,
    handleCancelColor,
    
    // Locale helper
    t
  };
}; 