import React, { useState, useMemo, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Toolbar from './components/Toolbar';
import MediaGrid from './components/MediaGrid';
import ImageInfoSidebar from './components/ImageInfoSidebar';
import { Category, ViewMode, LocalImageData, ImportStatus,  } from './types';
import { SortType, FilterType, SortDirection} from './types';
import { Trash2, FolderPlus, Tags } from 'lucide-react';
import { addTagsToImages } from './services/tagService';
import { processMedia } from './utils';
import Settings from './components/Settings';
import DeleteConfirmDialog from './components/DeleteConfirmDialog';
import MessageBox from './components/MessageBox';
import { useSettings } from './contexts/SettingsContext';
import './App.css';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  const { settings } = useSettings();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<FilterType>(FilterType.Photos);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortType>(SortType.Date);
  const [sortDirection, setSortDirection] = useState<SortDirection>(SortDirection.Desc);
  const [images, setImages] = useState<LocalImageData[]>([]);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [isZenMode, setIsZenMode] = useState<boolean>(false);
  const [filter, setFilter] = useState<FilterType>(FilterType.All);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTags, setSearchTags] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [importState, setImportState] = useState<ImportStatus>(ImportStatus.Imported);
  const [selectedImageForInfo, setSelectedImageForInfo] = useState<LocalImageData | null>(null);
  const [messageBox, setMessageBox] = useState<{
    isOpen: boolean;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
  }>({
    isOpen: false,
    message: '',
    type: 'info'
  });

  useEffect(() => {
    setSelectedImages(new Set());
    setSelectedImageForInfo(null);
  }, [selectedCategory]);

  useEffect(() => {
    if (selectedCategory === FilterType.Favorites) {
      setFilter(FilterType.Favorites);
    } else if (selectedCategory === FilterType.Recent) {
      setFilter(FilterType.Recent);
    } else {
      setFilter(FilterType.All);
    }
  }, [selectedCategory]);

  const filteredAndSortedImages = useMemo(() => {
    // 首先根据 filter 和 selectedCategory 过滤图片
    let filtered = images.filter(img => img.type !== 'video');

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
      filtered = images.filter(img => img.type === 'video');
    } else if (filter === FilterType.Favorites) {
      filtered = filtered.filter(img => img.favorite);
    } else if (filter === FilterType.Recent) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      filtered = images.filter(img => new Date(img.dateModified) >= sevenDaysAgo);
    } else if (selectedCategory !== FilterType.Photos) {
      // 如果选中的不是 'photos'（所有图片），且不是特殊过滤器（favorites/recent）
      // 查找选中分类下的所有图片
      const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);
      if (selectedCategoryData) {
        filtered = images.filter(img =>
          // 检查图片是否属于当前选中的分类
          img.categories?.includes(selectedCategory) ||
          // 或者检查图片 ID 是否在分类的 images 数组中
          selectedCategoryData.images?.includes(img.id)
        );
      }
    }

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
  }, [images, sortBy, sortDirection, filter, selectedCategory, categories, searchTags]);

  const handleFavorite = async (id: string) => {
    try {
      const updatedImages = images.map((img) =>
        img.id === id ? { ...img, favorite: !img.favorite } : img
      );

      // 保存更新后的图片数据到 JSON 文件，同时保存categories
      await window.electron.saveImagesToJson(
        updatedImages.map(img => ({
          ...img,
          dateCreated: img.dateCreated,
          dateModified: img.dateModified
        })),
        categories
      );

      setImages(updatedImages);
    } catch (error) {
      console.error('更新收藏状态失败:', error);
    }
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
        const selectedImage = images.find(img => img.id === firstSelectedId);
        setSelectedImageForInfo(selectedImage || null);
      } else {
        setSelectedImageForInfo(null);
      }

      return newSelection;
    });
  };

  const handleBulkDelete = async () => {
    try {
      // 过滤掉被选中的图片
      const updatedImages = images.filter(img => !selectedImages.has(img.id));

      const newCategories = categories.map(category => {
        const newImages = category.images?.filter(id => !selectedImages.has(id)) || [];
        return {
          ...category,
          images: newImages,
          count: newImages.length
        };
      });
      // 保存更新后的图片数据到 JSON 文件，同时保存categories
      await window.electron.saveImagesToJson(
        updatedImages.map(img => ({
          ...img,
          dateCreated: img.dateCreated,
          dateModified: img.dateModified
        })),
        newCategories
      );
      // 更新状态
      setImages(updatedImages);
      setCategories(newCategories);
      setSelectedImages(new Set());
    } catch (error) {
      console.error('删除图片失败:', error);
    }
  };

  const handleAddToCategory = async (selectedCategories: string[]) => {
    try {
      // 更新图片的分类信息
      const updatedImages = images.map(img => {
        if (selectedImages.has(img.id)) {
          return {
            ...img,
            categories: Array.from(new Set([...(img.categories || []), ...selectedCategories]))
          };
        }
        return img;
      });

      // 更新分类中的图片信息
      const updatedCategories = categories.map(category => {
        if (selectedCategories.includes(category.id)) {
          // 获取当前分类下所有图片 ID
          const existingImages = category.images || [];
          // 添加新选中的图片 ID
          const newImages = Array.from(selectedImages);
          // 合并并去重
          const allImages = Array.from(new Set([...existingImages, ...newImages]));

          return {
            ...category,
            images: allImages,
            count: allImages.length
          };
        }
        return category;
      });

      // 将 ImageInfo 转换为 LocalImageData
      const localImageDataList: LocalImageData[] = updatedImages.map(img => {
        const { dateCreated, dateModified, ...rest } = img;
        return {
          ...rest,
          dateCreated: dateCreated,
          dateModified: dateModified
        };
      });

      // 保存更新后的图片数据和分类数据
      await window.electron.saveImagesToJson(localImageDataList, updatedCategories);

      setImages(updatedImages);
      setCategories(updatedCategories);
      setSelectedImages(new Set());
    } catch (error) {
      console.error('添加分类失败:', error);
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
    let selectedImagesList = images.filter(img => selectedImages.has(img.id));
    const { updatedImages, success } = await addTagsToImages(
      selectedImagesList,
      images,
      categories,
      settings.modelName,
      setImportState,
    );

    if (success) {
      setImages(updatedImages);
      setSelectedImages(new Set());
    }
  };

  const bulkActions = [
    {
      icon: <Trash2 size={20} />,
      label: 'Delete',
      onClick: handleBulkDelete
    },
    {
      icon: <FolderPlus size={20} />,
      label: 'Add to Category',
      onClick: () => { },
      categories: categories,
      onSelectCategories: handleAddToCategory
    },
    {
      icon: <Tags size={20} />,
      label: 'Add Tags',
      onClick: handleAddTags
    }
  ];
  const messageBoxClose = () => {
    setMessageBox(prev => ({ ...prev, isOpen: false }));
  };

  const handleImportImages = async () => {
    try {
      const newImages = await window.electron.showOpenDialog();
      if (newImages.length > 0) {
        setImportState(ImportStatus.Importing);
        const updatedImages = await processMedia(newImages as any, images, categories, setImportState);
        setImages([...images, ...updatedImages]);
        setImportState(ImportStatus.Imported);
      }
    } catch (error) {
      console.error('导入图片失败:', error);
    }
  };

  const handleAddImages = async (newImages: LocalImageData[]) => {
    const newImagesData = newImages.filter(img => !images.some(existingImg => existingImg.id === img.id));
    await window.electron.saveImagesToJson(
      [...images, ...newImagesData],
      categories
    );
    setImages([...images, ...newImagesData]);
  };
  // 在组件加载时读取已保存的图片数据
  useEffect(() => {
    const loadImages = async () => {
      try {
        const result = await window.electron.loadImagesFromJson('images.json');
        // 转换数据格式
        const convertedImages = result.images.map(img => ({
          ...img,
          dateCreated: img.dateCreated,
          dateModified: img.dateModified
        }));
        setImages(convertedImages);
        setCategories(result.categories || []);
      } catch (error) {
        console.error('加载图片数据失败:', error);
      }
    };

    loadImages();
  }, []);

  const handleAddCategory = async (newCategory: Category) => {
    // 确保新分类包含 images 数组
    const categoryWithImages = {
      ...newCategory,
      images: [],
      count: 0
    };

    const updatedCategories = [...categories, categoryWithImages];
    setCategories(updatedCategories);

    try {
      await window.electron.saveImagesToJson(
        images.map(img => ({
          ...img,
          dateCreated: img.dateCreated,
          dateModified: img.dateModified
        })),
        updatedCategories
      );
    } catch (error) {
      console.error('保存分类失败:', error);
    }
  };

  const handleRenameCategory = async (categoryId: string, newName: string) => {
    try {
      // 更新内存中的分类数据
      const updatedCategories = categories.map(category =>
        category.id === categoryId
          ? { ...category, name: newName }
          : category
      );
      setCategories(updatedCategories);

      // 使用 saveCategories 保存更新后的分类
      await window.electron.saveCategories(updatedCategories);
    } catch (error) {
      console.error('重命名分类失败:', error);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      // 从内存中移除分类
      const updatedCategories = categories.filter(category => category.id !== categoryId);
      setCategories(updatedCategories);

      // 保存更新后的分类到文件系统
      await window.electron.saveCategories(updatedCategories);
    } catch (error) {
      console.error('删除分类失败:', error);
    }
  };

  const updateTagsByMediaId = (mediaId: string, newTags: string[]) => {
    const updatedImages = images.map(img =>
      img.id === mediaId ? { ...img, tags: newTags } : img
    );
    window.electron.saveImagesToJson(updatedImages, categories);
    setImages(updatedImages);
  };

  const handleRateChange = (mediaId: string, rate: number) => {
    const updatedImages = images.map(img =>
      img.id === mediaId ? { ...img, rate } : img
    );
    window.electron.saveImagesToJson(updatedImages, categories);
    setImages(updatedImages);
    setSelectedImageForInfo(updatedImages.find(img => img.id === mediaId) || null);
  };

  const handleReorderCategories = (newCategories: Category[]) => {
    window.electron.saveCategories(newCategories);
    setCategories(newCategories);
  };

  const handleDeleteConfirm = (categoryId: string) => {
    handleDeleteCategory(categoryId);
    setShowDeleteConfirm(null);
  };

  return (
    <ThemeProvider>
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
                  existingImages={images}
                  categories={categories}
                  setImportState={setImportState}
                  importState={importState}
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
      </div>
    </ThemeProvider>
  );
}

export default App;