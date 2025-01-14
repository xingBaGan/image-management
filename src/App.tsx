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
  const [searchTags, setSearchTags] = useState<string[]>([]);

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
    // 首先根据 filter 和 selectedCategory 过滤图片
    let filtered = images.filter(img => img.type !== 'video');
    
    // 添加标签过滤逻辑
    if (searchTags.length > 0) {
      filtered = filtered.filter(img => 
        searchTags.every(tag => 
          img.tags?.some(imgTag => 
            imgTag.toLowerCase().includes(tag.toLowerCase())
          )
        )
      );
    }
    
    if (selectedCategory === 'videos') {
      filtered = images.filter(img => img.type === 'video');
    } else if (filter === 'favorites') {
      filtered = filtered.filter(img => img.favorite);
    } else if (filter === 'recent') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      filtered = images.filter(img => new Date(img.modified) >= sevenDaysAgo);
    } else if (selectedCategory !== 'photos') {
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

  const handleSearch = (tags: string[]) => {
    setSearchTags(tags);
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
            count: allImages.length // 直接更新 count
          };
        }
        return category;
      });

      // 保存更新后的图片数据和分类数据
      await window.electron.saveImagesToJson(
        updatedImages.map(img => ({
          ...img,
          dateCreated: img.created,
          dateModified: img.modified
        })),
        updatedCategories
      );

      setImages(updatedImages);
      setCategories(updatedCategories);
      setSelectedImages(new Set());
    } catch (error) {
      console.error('添加分类失败:', error);
    }
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
      onClick: () => {},
      categories: categories,
      onSelectCategories: handleAddToCategory
    },
    {
      icon: <Tags size={20} />,
      label: 'Add Tags',
      onClick: handleAddTags
    }
  ];

  const getFileName = (filePath: string) => {
    // 解码文件路径并提取最后一个部分作为文件名
    const encodedFileName = filePath.split(/[/\\]/).pop() || '';
    const decodedFileName = decodeURIComponent(encodedFileName);
    
    // 移除文件扩展名
    let fileNameWithoutExt = decodedFileName.replace(/\.[^/.]+$/, '');
    fileNameWithoutExt = fileNameWithoutExt.split('\\').pop() || '';
    return fileNameWithoutExt;
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
        created: file.dateCreated,
        modified: file.dateModified,
        tags: [],
        favorite: false,
        categories: []
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
          dateCreated: img.created,
          dateModified: img.modified
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
          onRenameCategory={handleRenameCategory}
          onDeleteCategory={handleDeleteCategory}
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