import React, { useState, useMemo, useEffect, useCallback, useRef, Dispatch, SetStateAction } from 'react';
import { TitleBar } from './components/TitleBar';
import { MainContent } from './components/MainContent';
import Sidebar from './components/Sidebar';
import {
  Category,
  ViewMode,
  LocalImageData,
  ImportStatus,
  FilterOptions,
  ImportFile,
  FilterType,
  SortType,
  SortDirection,
  FolderContentChangeType,
  TaskStatus,
  InstallStatus
} from './types/index.ts';
import { Trash2, FolderPlus, Tags, Tag } from 'lucide-react';
import { addTagsToImages } from './services/tagService';
import { processMedia, addImagesToCategory, isArrayOfString } from './utils';
import Settings from './components/Settings';
import DeleteConfirmDialog from './components/DeleteConfirmDialog';
import MessageBox from './components/MessageBox';
import { useSettings } from './contexts/SettingsContext';
import './App.css';
import { useLocale } from './contexts/LanguageContext';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useCategoryOperations } from './hooks/useCategoryOperations';
import { useImageOperations } from './hooks/useImageOperations';
import { getGridItemAppendButtonsProps } from './plugins';
import { scan } from "react-scan";
import ProgressBar from './components/ProgressBar';
import DeleteImagesConfirmDialog from './components/DeleteImagesConfirmDialog';
import { filterAndSortImages } from './services/imageOperations';
import useBatchTag from './hooks/useBatchTag';
import BatchTagDialog from './components/BatchTagDialog.tsx';
import ConfirmTagDialog from './components/ConfirmTagDialog.tsx';
import { ToastContainer } from 'react-toastify';
import { toast } from 'react-toastify';
import InstallConfirmDialog from './components/InstallConfirmDialog';
const isDev = import.meta.env.DEV;
if (isDev) {
  scan({ enabled: true, log: true, showToolbar: true });
}

function App() {
  // 使用 settings hook 获取设置
  const { settings } = useSettings();
  const { t } = useLocale();
  const [isMaximized, setIsMaximized] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<FilterType | string>(FilterType.Photos);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [viewingMedia, setViewingMedia] = useState<LocalImageData | null>(null);
  const [sortBy, setSortBy] = useState<SortType>(SortType.Date);
  const [sortDirection, setSortDirection] = useState<SortDirection>(SortDirection.Desc);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [isZenMode, setIsZenMode] = useState<boolean>(false);
  const [filter, setFilter] = useState<FilterType>(FilterType.All);
  const [searchTags, setSearchTags] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [selectedImageForInfo, setSelectedImageForInfo] = useState<LocalImageData | null>(null);
  const [installStatus, setInstallStatus] = useState<InstallStatus>(InstallStatus.Installed);
  const [multiFilter, setMultiFilter] = useState<FilterOptions>({
    colors: [],
    ratio: [],
    rating: null,
    formats: [],
    precision: 0.85
  });
  const [filterColors, setFilterColors] = useState<string[]>([]);
  const [messageBox, setMessageBox] = useState<{
    isOpen: boolean;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
  }>({
    isOpen: false,
    message: '',
    type: 'info'
  });
  const [queueProgress, setQueueProgress] = useState<{
    tag: { total: number; completed: number; percentage: number; running: number };
    color: { total: number; completed: number; percentage: number; running: number };
  }>({
    tag: { total: 0, completed: 0, percentage: 0, running: 0 },
    color: { total: 0, completed: 0, percentage: 0, running: 0 }
  });
  const [tasksStatus, setTasksStatus] = useState<{
    tag: TaskStatus;
    color: TaskStatus;
  }>({
    tag: TaskStatus.Initialized,
    color: TaskStatus.Initialized
  });
  const [showInstallConfirm, setShowInstallConfirm] = useState<{
    isOpen: boolean;
    checkResult: any;
  } | null>(null);

  // 添加最大化状态监听
  useEffect(() => {
    const handleMaximize = () => setIsMaximized(true);
    const handleUnmaximize = () => setIsMaximized(false);

    window.electron?.onMaximize(handleMaximize);
    window.electron?.onUnmaximize(handleUnmaximize);

    return () => {
      window.electron?.removeMaximize(handleMaximize);
      window.electron?.removeUnmaximize(handleUnmaximize);
    };
  }, []);

  // 添加 refs 用于快捷键操作
  const searchButtonRef = useRef<HTMLElement>(null);
  const sortButtonRef = useRef<HTMLElement>(null);
  const filterButtonRef = useRef<HTMLElement>(null);

  // 使用 image operations hook
  const {
    images: mediaList,
    setImages: setMediaList,
    importState,
    setImportState,
    handleFavorite: handleFavoriteBase,
    handleImportImages: handleImportImagesBase,
    handleAddImages: handleAddImagesBase,
    handleBulkDelete: handleBulkDeleteBase,
    updateTagsByMediaId: updateTagsByMediaIdBase,
    handleRateChange: handleRateChangeBase,
    loadImages,
    showBindInFolderConfirm,
    setShowBindInFolderConfirm,
    executeDelete,
    handleBatchTagImages: handleBatchTagImagesBase,
  } = useImageOperations();

  const handleBatchTagImages = async (imageIds: string[], tagNames: string[]) => {
    await handleBatchTagImagesBase(imageIds, tagNames, categories);
    setSelectedImages(new Set());
  };

  const selectedImagesList = useMemo(() =>
    mediaList.filter(img => selectedImages.has(img.id)),
    [mediaList, selectedImages]);

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
    handleBatchTagImages: handleBatchTagImages,
  });
  // 使用 category hook
  const {
    categories,
    setCategories,
    handleAddCategory: handleAddCategoryBase,
    handleRenameCategory,
    handleDeleteCategory,
    handleReorderCategories,
    handleAddToCategory: handleAddToCategoryBase,
    handleImportFolder,
  } = useCategoryOperations({
    setImages: setMediaList,
    images: mediaList,
    setSelectedCategory,
  });
  const [filteredAndSortedImages, setFilteredAndSortedImages] = useState<LocalImageData[]>([]);

  const shouldListenFolders = useMemo(() => {
    return categories.filter(cate => cate?.folderPath).map(it => it.folderPath);
  }, [categories])

  // 包装函数以提供正确的参数
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

  useEffect(() => {
    setSelectedImages(new Set());
    setSelectedImageForInfo(null);
  }, [selectedCategory]);

  useEffect(() => {
    setSelectedImageForInfo(viewingMedia);
  }, [viewingMedia]);

  useEffect(() => {
    if (selectedCategory === FilterType.Favorites) {
      setFilter(FilterType.Favorites);
    } else if (selectedCategory === FilterType.Recent) {
      setFilter(FilterType.Recent);
    } else {
      setFilter(FilterType.All);
    }
  }, [selectedCategory]);

  const handleFavorite = async (id: string) => {
    await handleFavoriteBase(id, categories);
  };

  const handleSearch = (tags: string[]) => {
    setSearchTags(tags);
  };

  const handleSort = (newSortBy: SortType) => {
    if (newSortBy === sortBy) {
      setSortDirection(prev => prev === SortDirection.Asc ? SortDirection.Desc : SortDirection.Asc);
    } else {
      setSortBy(newSortBy);
      setSortDirection(SortDirection.Desc);
    }
  };

  const handleImageSelect = (id: string, isShiftKey: boolean) => {
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

      // 更新选中图片的信息显示
      if (newSelection.size > 0) {
        // 获取第一个选中的图片ID
        const firstSelectedId = Array.from(newSelection)[0];
        const selectedImage = mediaList.find(img => img.id === firstSelectedId);
        setSelectedImageForInfo(selectedImage || null);
      } else {
        setSelectedImageForInfo(null);
      }

      return newSelection;
    });
  };

  const handleBulkDelete = async () => {
    const newCategories = await handleBulkDeleteBase(selectedImages, categories);
    if (newCategories) {
      setCategories(newCategories);
      setSelectedImages(new Set());
    }
  };

  const handleAddTags = useCallback(async () => {
    if (selectedCategory === FilterType.Videos) {
      setMessageBox({
        isOpen: true,
        message: '视频文件暂不支持批量打标签',
        type: 'warning'
      });
      return;
    }
    // 获取选中的图片
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
  }, [selectedImagesList, mediaList, categories, settings.modelName, setImportState, setSelectedImages]);

  const bulkActions = [
    {
      icon: <Trash2 size={20} />,
      label: t('delete'),
      onClick: handleBulkDelete
    },
    {
      icon: <FolderPlus size={20} />,
      label: t('addToCategory'),
      onClick: () => { },
      categories: categories,
      onSelectCategories: handleAddToCategory
    },
    {
      icon: <Tags size={20} />,
      label: t('addTags'),
      onClick: handleAddTags
    },
    {
      icon: <Tag size={20} />,
      label: t('batchTag'),
      onClick: openTagPopup
    }
  ];
  const messageBoxClose = () => {
    setMessageBox(prev => ({ ...prev, isOpen: false }));
  };

  const currentSelectedCategory = useMemo(() => {
    return categories.find(cat => cat.id === selectedCategory);
  }, [categories, selectedCategory]);

  const handleImportImages = async () => {
    await handleImportImagesBase(categories, currentSelectedCategory);
  };

  const handleAddImages = async (newImages: LocalImageData[]) => {
    try {
      await handleAddImagesBase(newImages, categories, currentSelectedCategory);
      // 可能需要手动触发重新渲染
      setMediaList(prev => [...prev]); // 强制更新
    } catch (error) {
      console.error('Failed to add images:', error);
      setMessageBox({
        isOpen: true,
        message: t('importFailed', { error: String(error) }),
        type: 'error'
      });
    }
  };

  // 在组件加载时读取已保存的图片数据
  useEffect(() => {
    const checkAndPromptInstall = async () => {
      try {
        const checkResult = await window.electron.checkEnvironment();
        if (checkResult.needsInstall) {
          setShowInstallConfirm({
            isOpen: true,
            checkResult
          });
          return;
        }
        setMessageBox({
          isOpen: true,
          message: t('environmentCheckComplete'),
          type: 'success'
        });
      } catch (error) {
        console.error('Environment check failed:', error);
        setMessageBox({
          isOpen: true,
          message: t('environmentCheckFailed'),
          type: 'error'
        });
      }
    };

    const initializeData = async () => {
      try {
        // 首先检查环境
        await checkAndPromptInstall();
        
        // 原有的初始化逻辑
        const result = await loadImages();
        if (result) {
          setMediaList(result.images);
          setCategories(result.categories || []);
        }
      } catch (error) {
        console.error(t('loadImagesFailed', { error: String(error) }));
      }
    };

    initializeData();

    window.electron.onRemoteImagesDownloaded(() => { });
    window.electron.onQueueUpdate((status: any) => {
      if (status.type === 'tag' || status.type === 'color') {
        setQueueProgress(prev => ({
          ...prev,
          [status.type]: status.progress
        }));

        if (status.progress.percentage === 100) {
          setTimeout(() => {
            setQueueProgress(prev => ({
              ...prev,
              [status.type]: { total: 0, completed: 0, percentage: 0, running: 0 }
            }));
            window.electron.resetQueueProgress(status.type);
          }, 1000);
        }
      }
    });

    return () => {
      window.electron.removeRemoteImagesDownloadedListener(() => { });
      window.electron.removeQueueUpdateListener(()=>{})
    };
  }, []);

  const updateTagsByMediaId = (mediaId: string, newTags: string[]) => {
    updateTagsByMediaIdBase(mediaId, newTags, categories);
  };

  const handleRateChange = async (mediaId: string, rate: number) => {
    const updatedImage = await handleRateChangeBase(mediaId, rate, categories);
    if (updatedImage) {
      setSelectedImageForInfo(updatedImage);
    }
  };

  const handleDeleteConfirm = (categoryId: string, images: LocalImageData[]) => {
    handleDeleteCategory(categoryId, images);
    setShowDeleteConfirm(null);
  };

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
      if (clipboardText && !/^\[.*\]/.test(clipboardText)) {
        const parsedTags = JSON.parse(clipboardText);
        if (isArrayOfString(parsedTags)) {
          return;
        }
      }
      // if (!clipboardText) return;

      // 检查是否为 URL
      const isUrl = /^(http|https):\/\/[^ "]+$/.test(clipboardText);
      // 检查是否为本地文件路径
      const isFilePath = /^([a-zA-Z]:\\|\\\\|\/)[^\n"]+\.(jpg|jpeg|png|gif|mp4|mov|avi|webm)$/i.test(clipboardText);

      let newImages: LocalImageData[] = [];
      let _category: Category | null = null;
      try {
        setImportState(ImportStatus.Importing);

        if (isUrl) {
          // 使用主进程下载图片
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
          // 处理本地文件路径
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
        })) as unknown as ImportFile[]
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
        console.error(t('pasteImageFailed', { error: String(error) }));
      } finally {
        setImportState(ImportStatus.Imported);
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [mediaList, categories, t, currentSelectedCategory]);

  const handleOpenInEditor = useCallback((path: string) => {
    window.electron.openInEditor(path);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (await window.electron.isReadFromDB()) {
        setImportState(ImportStatus.Loading);
      }
      filterAndSortImages(mediaList, {
        filter,
        selectedCategory,
        categories,
        searchTags,
        filterColors,
        multiFilter,
        sortBy,
        sortDirection
      }).then(images => {
        setFilteredAndSortedImages(images);
      }).finally(async () => {
        if (await window.electron.isReadFromDB()) {
          setImportState(ImportStatus.Imported);
        }
      });
    };
    fetchData();
  }, [
    mediaList,
    sortBy,
    sortDirection,
    filter,
    selectedCategory,
    categories,
    searchTags,
    multiFilter,
    filterColors
  ]);

  // 使用快捷键 hook
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
  });
  const gridItemAppendButtonsProps = useMemo(() => {
    return getGridItemAppendButtonsProps();
  }, []);

  // 将 handleFolderChange 移到 useEffect 内部
  useEffect(() => {
    if (shouldListenFolders.length > 0) {
      const handleFolderChange = async (data: { type: FolderContentChangeType, newImages: LocalImageData[], category: Category }) => {
        if (data.type === FolderContentChangeType.Add) {
          setMediaList(prev => [...prev.filter(it => !data.newImages.some(newImg => newImg.id === it.id)), ...data.newImages]);
          setCategories(prev => [...prev.filter(it => it.id !== data.category.id), {
            ...data.category,
            count: data.category.images.length,
          }]);
        } else {
          setMediaList(prev => prev.filter(it => !data.newImages.some(newImg => newImg.id === it.id)));
          setCategories(prev => [...prev.filter(it => it.id !== data.category.id), {
            ...data.category,
            count: data.category.images.length,
          }]);
        }
      };

      window.electron?.updateFolderWatchers(shouldListenFolders.filter(it => it !== undefined) as string[]);
      window.electron?.onFolderContentChanged(handleFolderChange);

      return () => {
        window.electron?.removeFolderContentChangedListener(handleFolderChange);
      };
    }
  }, [shouldListenFolders]); // 只依赖 shouldListenFolders

  const handleCancelTagging = async (setShouldShow: Dispatch<SetStateAction<boolean>>) => {
    // 实现取消打标的逻辑，例如清空队列，重置进度等
    setShouldShow(false);
    setQueueProgress({
      tag: { total: 0, completed: 0, percentage: 0, running: 0 },
      color: { total: 0, completed: 0, percentage: 0, running: 0 }
    });
    await window.electron.cancelTagging();
  };

  const handleCancelColor = async (setShouldShow: Dispatch<SetStateAction<boolean>>) => {
    // 实现取消配色的逻辑，例如清空队列，重置进度等
    setShouldShow(false);
    setQueueProgress({
      tag: { total: 0, completed: 0, percentage: 0, running: 0 },
      color: { total: 0, completed: 0, percentage: 0, running: 0 }
    });
    await window.electron.cancelColor();
  };

  useEffect(() => {
    const s1 = tasksStatus.tag === TaskStatus.Canceled && tasksStatus.color !== TaskStatus.Running;
    const s2 = tasksStatus.color === TaskStatus.Canceled && tasksStatus.tag !== TaskStatus.Running;
    if (s1 || s2) {
      setImportState(ImportStatus.Imported);
      setSelectedImages(new Set());
      toast.error(t('canceled'));
    }
  }, [tasksStatus]);

  // 处理安装确认
  const handleInstallConfirm = async () => {
    try {
      setInstallStatus(InstallStatus.Installing);
      setShowInstallConfirm(null);
      await window.electron.installEnvironment();
    } catch (error) {
      console.error('Installation failed:', error);
      setMessageBox({
        isOpen: true,
        message: t('installationFailed', { error: String(error) }),
        type: 'error'
      });
    } finally {
      setInstallStatus(InstallStatus.Installed);
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

  return (
    <div className="flex flex-col h-screen backdrop-blur-md dark:bg-gray-900"
      style={{
        backgroundImage: `url('${settings.backgroundUrl}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
      <TitleBar
        isMaximized={isMaximized}
        onMinimize={() => window.electron?.minimize()}
        onMaximize={() => window.electron?.maximize()}
        onClose={() => window.electron?.close()}
      />

      <div className="flex w-full h-full bg-white bg-opacity-25 backdrop-blur-sm">
        {!isZenMode && (
          <Sidebar
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            categories={categories}
            filter={filter}
            onFilterChange={setFilter}
            onAddCategory={handleAddCategory}
            onRenameCategory={handleRenameCategory}
            onUpdateCategories={handleReorderCategories}
            setShowDeleteConfirm={setShowDeleteConfirm}
            onImportFolder={handleImportFolder}
            setImportState={setImportState}
          />
        )}

        <MainContent
          installStatus={installStatus}
          viewMode={viewMode}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onViewModeChange={setViewMode}
          onSortChange={handleSort}
          onSearch={handleSearch}
          selectedCount={selectedImages.size}
          bulkActions={selectedImages.size > 0 ? bulkActions : []}
          onToggleSidebar={() => setIsZenMode(!isZenMode)}
          onImport={handleImportImages}
          isSidebarOpen={isZenMode}
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
          images={filteredAndSortedImages}
          onFavorite={handleFavorite}
          onSelectImage={handleImageSelect}
          updateTagsByMediaId={updateTagsByMediaId}
          addImages={handleAddImages}
          existingImages={mediaList}
          categories={categories}
          setImportState={setImportState}
          importState={importState}
          onOpenInEditor={handleOpenInEditor}
          gridItemAppendButtonsProps={gridItemAppendButtonsProps}
          onRateChange={handleRateChange}
          setSelectedImages={setSelectedImages}
          currentSelectedCategory={currentSelectedCategory || selectedCategory}
          searchTags={searchTags}
          setSearchTags={setSearchTags}
        />
      </div>

      {/* Dialogs */}
      {showDeleteConfirm && (
        <DeleteConfirmDialog
          onCancel={() => setShowDeleteConfirm(null)}
          onConfirm={() => handleDeleteConfirm(showDeleteConfirm, mediaList)}
          currentSelectedCategory={categories?.find(it => it.id === showDeleteConfirm) || null}
        />
      )}

      {showBindInFolderConfirm && (
        <DeleteImagesConfirmDialog
          onCancel={() => setShowBindInFolderConfirm(null)}
          selectedImages={Array.from(showBindInFolderConfirm.selectedImages)}
          onConfirm={async () => {
            const newCategories = await executeDelete(
              showBindInFolderConfirm.selectedImages,
              showBindInFolderConfirm.categories
            );
            if (newCategories) {
              setCategories(newCategories);
              setSelectedImages(new Set());
            }
            setShowBindInFolderConfirm(null);
          }}
        />
      )}

      <MessageBox
        isOpen={messageBox.isOpen}
        onClose={messageBoxClose}
        message={messageBox.message}
        type={messageBox.type}
      />

      <Settings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        setMessageBox={setMessageBox}
        messageBox={messageBox}
      />

      <BatchTagDialog
        isOpen={isTagPopupOpen}
        onClose={() => {
          closeTagPopup();
        }}
        onConfirm={(tags) => {
          setBatchTagNames(tags);
          openConfirmDialog();
        }}
        numImages={selectedImages.size}
      />

      <ConfirmTagDialog
        isOpen={isConfirmDialogOpen}
        onClose={closeConfirmDialog}
        onConfirm={handleBatchTag}
        tagNames={batchTagNames}
        numImages={selectedImages.size}
      />

      {/* Progress Bars */}
      {queueProgress.tag.total > 0 && (
        <ProgressBar
          type="tag"
          progress={queueProgress.tag.percentage}
          total={queueProgress.tag.total}
          completed={queueProgress.tag.completed}
          offset={queueProgress.color.total > 0 ? 80 : 0}
          onCancel={handleCancelTagging}
          setTasksStatus={setTasksStatus}
        />
      )}

      {queueProgress.color.total > 0 && (
        <ProgressBar
          type="color"
          progress={queueProgress.color.percentage}
          total={queueProgress.color.total}
          completed={queueProgress.color.completed}
          offset={0}
          onCancel={handleCancelColor}
          setTasksStatus={setTasksStatus}
        />
      )}

      {showInstallConfirm && (
        <InstallConfirmDialog
          isOpen={showInstallConfirm.isOpen}
          onCancel={() => setShowInstallConfirm(null)}
          onConfirm={handleInstallConfirm}
          checkResult={showInstallConfirm.checkResult}
        />
      )}

      <ToastContainer />
    </div>
  );
}

export default App;