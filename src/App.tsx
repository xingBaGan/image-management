import React, { useState, useMemo, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Toolbar from './components/Toolbar';
import ImageGrid from './components/ImageGrid';
import { Image, Category, ViewMode, SortBy, ImageData, ImageInfo } from './types';
import { Trash2, FolderPlus, Tags, Menu, Upload } from 'lucide-react';
import { readDirectory, readFileMetadata } from './services/fileSystem';
import path from 'path';

// Mock data for demonstration
const mockCategories: Category[] = [
  { id: 'home', name: 'Home', count: 24 },
  { id: 'work', name: 'Work', count: 15 },
  { id: 'vacation', name: 'Vacation', count: 32 },
];

function App() {
  const [selectedCategory, setSelectedCategory] = useState<string>('photos');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [images, setImages] = useState<ImageInfo[]>([]);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  const sortedImages = useMemo(() => {
    return [...images].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = new Date(b.dateModified).getTime() - new Date(a.dateModified).getTime();
          break;
        case 'size':
          comparison = b.size - a.size;
          break;
      }

      return sortDirection === 'asc' ? -comparison : comparison;
    });
  }, [images, sortBy, sortDirection]);

  const handleFavorite = (id: string) => {
    setImages((prev) =>
      prev.map((img) =>
        img.id === id ? { ...img, favorite: !img.favorite } : img
      )
    );
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

  const handleBulkDelete = () => {
    setImages(prev => prev.filter(img => !selectedImages.has(img.id)));
    setSelectedImages(new Set());
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

  const loadLocalImages = async (directory: string) => {
    try {
      const files = await readDirectory(directory);
      const imageFiles = files.filter(file => 
        file.match(/\.(jpg|jpeg|png|gif)$/i)
      );
      
      const imagesData = await Promise.all(
        imageFiles.map(async file => {
          const metadata = await readFileMetadata(file);
          return {
            id: file,
            path: `file://${file}`,
            name: path.basename(file),
            size: metadata.size,
            dimensions: metadata.dimensions,
            created: new Date(metadata.created),
            modified: new Date(metadata.modified),
            tags: [],
            favorite: false
          };
        })
      );
      
      setImages(imagesData);
    } catch (error) {
      console.error('Error loading local images:', error);
    }
  };

  const handleImport = async () => {
    try {
      const fileMetadata = await window.electron.showOpenDialog();
      
      if (fileMetadata.length === 0) return;
      
      const newImages: ImageData[] = fileMetadata.map(file => ({
        id: crypto.randomUUID(),
        name: file.path.split('/').pop() || '',
        path: file.path,
        size: file.size,
        dateCreated: file.dateCreated,
        dateModified: file.dateModified,
        tags: [],
        favorite: false
      }));
      
      const updatedImages = [...images, ...newImages];
      await window.electron.saveImagesToJson(updatedImages);
      setImages(updatedImages);
      
    } catch (error) {
      console.error('导入图片失败:', error);
    }
  };

  // 在组件加载时读取已保存的图片数据
  useEffect(() => {
    const loadImages = async () => {
      try {
        const result = await window.electron.loadImagesFromJson('./src/data/mockImages.json');
        setImages(result.images);
      } catch (error) {
        console.error('加载图片数据失败:', error);
      }
    };

    loadImages();
  }, []);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {isSidebarOpen && (
        <Sidebar
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          categories={mockCategories}
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
            images={sortedImages} 
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