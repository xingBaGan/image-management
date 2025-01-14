import React, { useState, useMemo, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Toolbar from './components/Toolbar';
import ImageGrid from './components/ImageGrid';
import { Category, ViewMode, SortBy, ImageInfo, FilterType } from './types';
import { Trash2, FolderPlus, Tags } from 'lucide-react';

function App() {
  const [selectedCategory, setSelectedCategory] = useState<string>('photos');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [images, setImages] = useState<ImageInfo[]>([]);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    // console.log('selectedCategory', selectedCategory);
    if (selectedCategory === 'favorites') {
      setFilter('favorites');
    } else if (selectedCategory === 'recent') {
      setFilter('recent');
    } else {
      setFilter('all');
    }
  }, [selectedCategory]);

  const filteredAndSortedImages = useMemo(() => {
    // 首先根据 filter 过滤图片
    let filtered = images;
    
    if (filter === 'favorites') {
      filtered = images.filter(img => img.favorite);
    } else if (filter === 'recent') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      filtered = images.filter(img => new Date(img.modified) >= sevenDaysAgo);
    }

    // 然后对过滤后的结果进行排序
    return [...filtered].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = new Date(b.modified).getTime() - new Date(a.modified).getTime();
          break;
        case 'size':
          comparison = b.size - a.size;
          break;
      }

      return sortDirection === 'asc' ? -comparison : comparison;
    });
  }, [images, sortBy, sortDirection, filter]);

  const handleFavorite = async (id: string) => {
    try {
      const updatedImages = images.map((img) =>
        img.id === id ? { ...img, favorite: !img.favorite } : img
      );
      
      // 保存更新后的图片数据到 JSON 文件，同时保存categories
      await window.electron.saveImagesToJson(
        updatedImages.map(img => ({
          ...img,
          dateCreated: img.created,
          dateModified: img.modified
        })),
        categories
      );
      
      setImages(updatedImages);
    } catch (error) {
      console.error('更新收藏状态失败:', error);
    }
  };

  const handleSearch = (query: string) => {
    console.log('Searching for:', query);
  };

  const handleSort = (newSortBy: SortBy) => {
    if (newSortBy === sortBy) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortDirection('desc');
    }
  };

  const handleImageSelect = (id: string, isShiftKey: boolean) => {
    setSelectedImages(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
      return newSelection;
    });
  };

  const handleBulkDelete = async () => {
    try {
      // 过滤掉被选中的图片
      const updatedImages = images.filter(img => !selectedImages.has(img.id));
      
      // 保存更新后的图片数据到 JSON 文件，同时保存categories
      await window.electron.saveImagesToJson(
        updatedImages.map(img => ({
          ...img,
          dateCreated: img.created,
          dateModified: img.modified
        })),
        categories
      );
      
      // 更新状态
      setImages(updatedImages);
      setSelectedImages(new Set());
    } catch (error) {
      console.error('删除图片失败:', error);
    }
  };

  const handleAddToCategory = (categoryId: string) => {
    // Implement category assignment logic
    console.log('Adding to category:', categoryId, 'Images:', Array.from(selectedImages));
    setSelectedImages(new Set());
  };

  const handleAddTags = () => {
    // Implement tag addition logic
    console.log('Adding tags to images:', Array.from(selectedImages));
    setSelectedImages(new Set());
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
      onClick: () => handleAddToCategory(selectedCategory)
    },
    {
      icon: <Tags size={20} />,
      label: 'Add Tags',
      onClick: handleAddTags
    }
  ];

  const getFileName = (filePath: string) => {
    // 简单的文件名提取函数
    return filePath.split(/[/\\]/).pop() || '';
  };

  const handleImport = async () => {
    try {
      const fileMetadata = await window.electron.showOpenDialog();
      
      if (fileMetadata.length === 0) return;
      
      const newImages: ImageInfo[] = fileMetadata.map(file => ({
        id: crypto.randomUUID(),
        name: getFileName(file.path),
        path: file.path,
        size: file.size,
        dateCreated: file.dateCreated,
        dateModified: file.dateModified,
        tags: [],
        favorite: false
      }));
      
      const updatedImages = [...images, ...newImages];
      await window.electron.saveImagesToJson(updatedImages, categories);
      setImages(updatedImages);
      
    } catch (error) {
      console.error('导入图片失败:', error);
    }
  };

  // 在组件加载时读取已保存的图片数据
  useEffect(() => {
    const loadImages = async () => {
      try {
        const result = await window.electron.loadImagesFromJson('images.json');
        // 转换数据格式
        const convertedImages = result.images.map(img => ({
          ...img,
          created: img.dateCreated,
          modified: img.dateModified
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
    const updatedCategories = [...categories, newCategory];
    setCategories(updatedCategories);
    
    try {
      // 保存更新后的categories到JSON文件
      await window.electron.saveImagesToJson(
        images.map(img => ({
          ...img,
          dateCreated: img.created,
          dateModified: img.modified
        })),
        updatedCategories
      );
    } catch (error) {
      console.error('保存分类失败:', error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {isSidebarOpen && (
        <Sidebar
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          categories={categories}
          filter={filter}
          onFilterChange={setFilter}
          onAddCategory={handleAddCategory}
        />
      )}
      <div className="flex overflow-hidden flex-col flex-1">
        <Toolbar
          viewMode={viewMode}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onViewModeChange={setViewMode}
          onSortChange={handleSort}
          onSearch={handleSearch}
          selectedCount={selectedImages.size}
          bulkActions={selectedImages.size > 0 ? bulkActions : []}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onImport={handleImport}
          isSidebarOpen={isSidebarOpen}
        />
        <div className="overflow-y-auto flex-1">
          <ImageGrid 
            images={filteredAndSortedImages}
            onFavorite={handleFavorite} 
            viewMode={viewMode}
            selectedImages={selectedImages}
            onSelectImage={handleImageSelect}
          />
        </div>
      </div>
    </div>
  );
}

export default App;