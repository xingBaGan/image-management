import { useEffect } from 'react';
import { getGridItemAppendButtonsProps } from '../plugins';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { FolderContentChangeType, LocalImageData, Category } from '../types';
import { useLocale } from '../contexts/LanguageContext';
import { toast } from 'react-toastify';
import ImageServerStartedToast from '../components/ImageServerStatus';


/**
 * Hook to manage dialog and modal state
 */
export const useAppDialogs = (
  state: ReturnType<typeof import('./useAppState').useAppState>,
  eventHandlers: ReturnType<typeof import('./useAppEventHandlers').useAppEventHandlers>
) => {
  const { t } = useLocale();
  
  const {
    selectedImages,
    setSelectedImages,
    mediaList, 
    searchButtonRef,
    sortButtonRef,
    filterButtonRef,
    filteredAndSortedImages,
    setViewMode,
    setViewingMedia,
    randomInspiration,
    setRandomInspiration,
    setSortDirection,
    tasksStatus,
    messageBox,
    showBindInFolderConfirm, 
    setShowBindInFolderConfirm
  } = state;

  const {
    handleFavorite,
    handleOpenInEditor,
    handleBulkDelete,
    loadImages
  } = eventHandlers.imageOperations;

  const { messageBoxClose } = eventHandlers;

  // Use keyboard shortcuts
  useKeyboardShortcuts({
    selectedImages,
    setSelectedImages,
    handleBulkDelete,
    handleFavorite,
    handleOpenInEditor,
    images: mediaList,
    filteredImages: filteredAndSortedImages,
    searchButtonRef,
    sortButtonRef,
    filterButtonRef,
    setViewMode,
    setViewingMedia,
    setRandomInspiration,
    randomInspiration,
    setSortDirection
  });

  // Get grid item buttons
  const gridItemAppendButtonsProps = getGridItemAppendButtonsProps();

  // Monitor folder changes
  useEffect(() => {
    if (state.shouldListenFolders.length > 0) {
      const handleFolderChange = async (data: { 
        type: FolderContentChangeType, 
        newImages: LocalImageData[], 
        category: Category 
      }) => {
        if (data.type === FolderContentChangeType.Add) {
          state.setMediaList(prev => [...prev.filter(it => !data.newImages.some(newImg => newImg.id === it.id)), ...data.newImages]);
          state.setCategories(prev => [...prev.filter(it => it.id !== data.category.id), {
            ...data.category,
            count: data.category.images.length,
          }]);
        } else {
          state.setMediaList(prev => prev.filter(it => !data.newImages.some(newImg => newImg.id === it.id)));
          state.setCategories(prev => [...prev.filter(it => it.id !== data.category.id), {
            ...data.category,
            count: data.category.images.length,
          }]);
        }
      };

      window.electron?.updateFolderWatchers(state.shouldListenFolders.filter(it => it !== undefined) as string[]);
      window.electron?.onFolderContentChanged(handleFolderChange);

      return () => {
        window.electron?.removeFolderContentChangedListener(handleFolderChange);
      };
    }
  }, [state.shouldListenFolders, state.setMediaList, state.setCategories]);

  // Initialize data and listen for updates
  useEffect(() => {
    const checkAndPromptInstall = async () => {
      try {
        const checkResult = await window.electron.checkEnvironment();
        if (checkResult.needsInstall) {
          state.setShowInstallConfirm({
            isOpen: true,
            checkResult
          });
          return;
        }
        state.setMessageBox({
          isOpen: true,
          message: t('environmentCheckComplete'),
          type: 'success'
        });
      } catch (error) {
        console.error('Environment check failed:', error);
        state.setMessageBox({
          isOpen: true,
          message: t('environmentCheckFailed'),
          type: 'error'
        });
      }
    };

    const initializeData = async () => {
      try {
        // First check the environment
        await checkAndPromptInstall();
        
        // Original initialization logic
        const result = await loadImages();
        if (result) {
          state.setMediaList(result.images);
          state.setCategories(result.categories || []);
        }
      } catch (error) {
        console.error(t('loadImagesFailed', { error: String(error) }));
      }
    };

    initializeData();

    window.electron.onRemoteImagesDownloaded(() => { });
    window.electron.onQueueUpdate((status: any) => {
      if (status.type === 'tag' || status.type === 'color') {
        state.setQueueProgress(prev => ({
          ...prev,
          [status.type]: status.progress
        }));

        if (status.progress.percentage === 100) {
          setTimeout(() => {
            state.setQueueProgress(prev => ({
              ...prev,
              [status.type]: { total: 0, completed: 0, percentage: 0, running: 0 }
            }));
            window.electron.resetQueueProgress(status.type);
          }, 1000);
        }
      }
    });

    window.electron.onImageServerStarted((status: any) => {
      toast.info(()=><ImageServerStartedToast status={status} />, {
        className: 'server-started-toast pl-2 w-[400px] border border-purple-600/40',
        ariaLabel: 'image-server-started',
        autoClose: false
      });
    });

    return () => {
      window.electron.removeRemoteImagesDownloadedListener(() => { });
      window.electron.removeQueueUpdateListener(()=>{})
      window.electron.removeImageServerStartedListener(()=>{})
    };
  }, []);

  return {
    showBindInFolderConfirm,
    setShowBindInFolderConfirm,
    messageBox,
    messageBoxClose,
    gridItemAppendButtonsProps,
    tasksStatus
  };
}; 