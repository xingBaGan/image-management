import React, { useState, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Toolbar from './components/Toolbar';
import ImageGrid from './components/ImageGrid';
import { Image, Category, ViewMode, SortBy } from './types';
import { Trash2, FolderPlus, Tags } from 'lucide-react';
import { readDirectory, readFileMetadata } from './services/fileSystem';
import path from 'path';

// Mock data for demonstration
const mockCategories: Category[] = [
  { id: 'home', name: 'Home', count: 24 },
  { id: 'work', name: 'Work', count: 15 },
  { id: 'vacation', name: 'Vacation', count: 32 },
];

const mockImages: Image[] = [
  {
    id: '1',
    path: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131',
    name: 'Cute cat',
    size: 1024000,
    dimensions: { width: 1920, height: 1080 },
    created: new Date('2024-01-01'),
    modified: new Date('2024-01-01'),
    tags: ['animals', 'cats'],
    favorite: true,
  },
  {
    id: '2',
    path: 'https://images.unsplash.com/photo-1579353977828-2a4eab540b9a',
    name: 'Sunset view',
    size: 2048000,
    dimensions: { width: 2560, height: 1440 },
    created: new Date('2024-01-02'),
    modified: new Date('2024-01-02'),
    tags: ['nature', 'sunset'],
    favorite: false,
  },
  {
    id: '3',
    path: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d',
    name: 'Workspace',
    size: 1536000,
    dimensions: { width: 1920, height: 1280 },
    created: new Date('2024-01-03'),
    modified: new Date('2024-01-03'),
    tags: ['work', 'desk'],
    favorite: false,
  },
  {
    id: '4',
    path: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929',
    name: 'Food photography',
    size: 3072000,
    dimensions: { width: 3840, height: 2160 },
    created: new Date('2024-01-04'),
    modified: new Date('2024-01-04'),
    tags: ['food', 'photography'],
    favorite: true,
  },
];

function App() {
  const [selectedCategory, setSelectedCategory] = useState<string>('photos');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [images, setImages] = useState<Image[]>(mockImages);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());

  const sortedImages = useMemo(() => {
    return [...images].sort((a, b) => {
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

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        categories={mockCategories}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Toolbar
          viewMode={viewMode}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onViewModeChange={setViewMode}
          onSortChange={handleSort}
          onSearch={handleSearch}
          selectedCount={selectedImages.size}
          bulkActions={selectedImages.size > 0 ? bulkActions : []}
        />
        <div className="flex-1 overflow-y-auto">
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