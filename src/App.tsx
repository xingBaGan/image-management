import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Toolbar from './components/Toolbar/index';
import MediaGrid from './components/MediaGrid';
import ImageInfoSidebar from './components/ImageInfoSidebar';
import { Category, ViewMode, LocalImageData, ImportStatus, FilterOptions, ColorInfo, ImportFile, FilterType, SortType, SortDirection } from './types';
import { Trash2, FolderPlus, Tags } from 'lucide-react';

import { addTagsToImages } from './services/tagService';
import { processMedia, isSimilarColor } from './utils';
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
import { motion } from 'framer-motion';
const isDev = import.meta.env.DEV;
if (isDev) {
  scan({ enabled: true, log: true, showToolbar: true });
}
function App() {
  // 使用 settings hook 获取设置
  const { settings } = useSettings();
  const { t } = useLocale();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<FilterType>(FilterType.Photos);
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

  // 添加 refs 用于快捷键操作
  const searchButtonRef = useRef<HTMLElement>(null);
  const sortButtonRef = useRef<HTMLElement>(null);
  const filterButtonRef = useRef<HTMLElement>(null);

  // 使用 category hook
  const {
    categories,
    setCategories,
    handleAddCategory: handleAddCategoryBase,
    handleRenameCategory,
    handleDeleteCategory,
    handleReorderCategories,
    handleAddToCategory: handleAddToCategoryBase,
  } = useCategoryOperations();

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
  } = useImageOperations();

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

  const handleAddTags = async () => {
    if (selectedCategory === FilterType.Videos) {
      setMessageBox({
        isOpen: true,
        message: '视频文件暂不支持批量打标签',
        type: 'warning'
      });
      return;
    }
    // 获取选中的图片
    let selectedImagesList = mediaList.filter(img => selectedImages.has(img.id));
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
  };

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
    }
  ];
  const messageBoxClose = () => {
    setMessageBox(prev => ({ ...prev, isOpen: false }));
  };

  const handleImportImages = async () => {
    await handleImportImagesBase(categories);
  };

  const handleAddImages = async (newImages: LocalImageData[]) => {
    await handleAddImagesBase(newImages, categories);
  };

  // 在组件加载时读取已保存的图片数据
  useEffect(() => {
    const initializeData = async () => {
      try {
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

    window.electron.onRemoteImagesDownloaded(()=>{});
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
              [status.type]: { total: 0, completed: 0, percentage: 0, running: 0}
            }));
            window.electron.resetQueueProgress(status.type);
          }, 1000);
        }
      }
    });

    return () => {
      window.electron.removeRemoteImagesDownloadedListener(()=>{});
    };
  }, []);

  const updateTagsByMediaId = (mediaId: string, newTags: string[]) => {
    updateTagsByMediaIdBase(mediaId, newTags, categories);
  };

  const handleRateChange = (mediaId: string, rate: number) => {
    const updatedImage = handleRateChangeBase(mediaId, rate, categories);
    if (updatedImage) {
      setSelectedImageForInfo(updatedImage);
    }
  };

  const handleDeleteConfirm = (categoryId: string) => {
    handleDeleteCategory(categoryId);
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
      const clipboardText = e.clipboardData?.getData('text');
      
      if (!clipboardText) return;

      // 检查是否为 URL
      const isUrl = /^(http|https):\/\/[^ "]+$/.test(clipboardText);
      // 检查是否为本地文件路径
      const isFilePath = /^([a-zA-Z]:\\|\\\\|\/)[^\n"]+\.(jpg|jpeg|png|gif|mp4|mov|avi|webm)$/i.test(clipboardText);

      if (isUrl || isFilePath) {
        try {
          setImportState(ImportStatus.Importing);
          let newImages: LocalImageData[];
          
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
          } else {
            // 处理本地文件路径
            newImages = await window.electron.processDirectoryFiles(clipboardText);
          }

          const updatedImages = await processMedia(
            newImages.map(img => ({
              ...img,
              lastModified: new Date(img.dateModified).getTime(),
              webkitRelativePath: '',
              arrayBuffer: async () => new ArrayBuffer(0),
              text: async () => '',
              stream: () => new ReadableStream(),
              slice: () => new Blob(),
              type: img.type || 'image/jpeg'
            })) as unknown as ImportFile[],
            mediaList,
            categories,
            setImportState
          );
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
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [mediaList, categories, t]);

  const handleOpenInEditor = useCallback((path: string) => {
    window.electron.openInEditor(path);
  }, []);

  const filteredAndSortedImages = useMemo(() => {
    // 首先根据 filter 和 selectedCategory 过滤图片
    let filtered = mediaList.filter(img => img.type !== 'video') as LocalImageData[];

    // 添加标签过滤逻辑
    if (searchTags.length > 0) {
      filtered = filtered.filter(img =>
        searchTags.every(tag =>
          img.tags?.some((imgTag: string) =>
            imgTag.toLowerCase().includes(tag.toLowerCase())
          )
        )
      );
    }

    if (selectedCategory === FilterType.Videos) {
      filtered = mediaList.filter(img => img.type === 'video') as LocalImageData[];
    } else if (filter === FilterType.Favorites) {
      filtered = filtered.filter(img => img.favorite);
    } else if (filter === FilterType.Recent) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      filtered = mediaList.filter(img => new Date(img.dateModified) >= sevenDaysAgo);
    } else if (selectedCategory !== FilterType.Photos) {
      const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);
      if (selectedCategoryData) {
        filtered = mediaList.filter(img =>
          img.categories?.includes(selectedCategory) ||
          selectedCategoryData.images?.includes(img.id)
        );
      }
    }

    filtered = filtered.filter(img => {
      if (filterColors.length > 0) {
        // 使用颜色相似度比较
        return filterColors.some(filterColor => 
          (img.colors || []).some((c: string | ColorInfo) => {
            const imgColor = typeof c === 'string' ? c : c.color;
            return isSimilarColor(imgColor, filterColor, multiFilter.precision);
          })
        );
      }

      if (multiFilter.ratio.length > 0) {
        return multiFilter.ratio.some(ratio => img.ratio === ratio);
      }
      if (typeof multiFilter.rating === 'number') {
        return img.rating === multiFilter.rating;
      }
      if (multiFilter.formats.length > 0) {
        const ext = img?.extension?.toLowerCase();
        return multiFilter.formats.some(format => ext?.endsWith(format.toLowerCase()));
      }
      return true;
    });

    // 然后对过滤后的结果进行排序
    return [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case SortType.Name:
          comparison = a.name.localeCompare(b.name);
          break;
        case SortType.Date:
          comparison = new Date(b.dateModified).getTime() - new Date(a.dateModified).getTime();
          break;
        case SortType.Size:
          comparison = b.size - a.size;
          break;
      }

      return sortDirection === 'asc' ? -comparison : comparison;
    });
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
  return (
        <div className="flex h-screen backdrop-blur-md dark:bg-gray-900 bg-white/20"
          style={{
            backgroundImage: `url('${settings.backgroundUrl}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}>
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
                onDeleteCategory={handleDeleteCategory}
                onUpdateCategories={handleReorderCategories}
                setShowDeleteConfirm={setShowDeleteConfirm}
              />
            )}
            <div className="flex overflow-hidden relative flex-col flex-1">
              <Toolbar
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
              />
              <div className="flex overflow-y-auto flex-1">
                <div className={`flex-1 ${isZenMode ? 'mr-0' : 'mr-60'}`}>
                  <MediaGrid
                    images={filteredAndSortedImages}
                    onFavorite={handleFavorite}
                    viewMode={viewMode}
                    selectedImages={selectedImages}
                    onSelectImage={handleImageSelect}
                    updateTagsByMediaId={updateTagsByMediaId}
                    addImages={handleAddImages}
                    existingImages={mediaList}
                    categories={categories}
                    setImportState={setImportState}
                    importState={importState}
                    onOpenInEditor={handleOpenInEditor}
                    gridItemAppendButtonsProps={gridItemAppendButtonsProps}
                  />
                </div>
                <div className="fixed right-0 bottom-0 top-16">
                  {!isZenMode && <ImageInfoSidebar
                    image={selectedImageForInfo}
                    onTagsUpdate={updateTagsByMediaId}
                    onRateChange={handleRateChange}
                    totalImages={filteredAndSortedImages.length}
                    totalVideos={filteredAndSortedImages.length}
                    type={selectedCategory === 'videos' ? 'video' : 'image'}
                    setFilterColors={setFilterColors}
                    setSelectedImages={setSelectedImages}
                  />}
                </div>
              </div>
            </div>
          </div>
          {showDeleteConfirm && (
            <DeleteConfirmDialog
              onCancel={() => setShowDeleteConfirm(null)}
              onConfirm={() => handleDeleteConfirm(showDeleteConfirm)}
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
          {queueProgress.tag.total > 0 && (
            <ProgressBar 
              type="tag"
              progress={queueProgress.tag.percentage}
              total={queueProgress.tag.total}
              completed={queueProgress.tag.completed}
            />
          )}
          {queueProgress.color.total > 0 && (
            <motion.div
              initial={{ y: 0 }}
              animate={{ y: queueProgress.tag.total > 0 ? -80 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <ProgressBar 
                type="color"
                progress={queueProgress.color.percentage}
                total={queueProgress.color.total}
                completed={queueProgress.color.completed}
              />
            </motion.div>
          )}
        </div>
  );
}

export default App;