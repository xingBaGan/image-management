import React from 'react';
import { Clock, Image as ImageIcon, Heart, Video, Plus } from 'lucide-react';
import { Category, FilterType } from '../types';

interface SidebarProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  categories: Category[];
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  onAddCategory?: (category: Category) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  selectedCategory,
  onSelectCategory,
  categories,
  onAddCategory,
}) => {
  const fixedCategories = [
    { id: 'recent', name: 'Recent', icon: <Clock size={20} /> },
    { id: 'photos', name: 'Photos', icon: <ImageIcon size={20} /> },
    { id: 'favorites', name: 'Favorites', icon: <Heart size={20} /> },
    { id: 'videos', name: 'Videos', icon: <Video size={20} /> },
  ];

  const handleAddCategory = () => {
    if (onAddCategory) {
      const newCategory = {
        id: `category-${Date.now()}`,
        name: "新分类",
        count: 0
      };
      onAddCategory(newCategory);
    }
  };

  return (
    <div className="flex flex-col p-4 w-64 h-screen bg-white dark:bg-gray-800">
      <div className="space-y-2">
        {fixedCategories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${
              selectedCategory === category.id
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {category.icon}
            <span>{category.name}</span>
          </button>
        ))}
      </div>

      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-600 dark:text-gray-300">Categories</h3>
        </div>
        <div className="space-y-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className={`w-full flex items-center justify-between px-4 py-2 rounded-lg transition-colors ${
                selectedCategory === category.id
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <span>{category.name}</span>
              <span className="text-sm text-gray-500">{category.count}</span>
            </button>
          ))}
        </div>
      </div>

      <button 
        onClick={handleAddCategory}
        className="flex justify-center items-center px-4 py-2 mt-auto space-x-2 w-full text-white bg-blue-500 rounded-lg transition-colors hover:bg-blue-600"
      >
        <Plus size={20} />
        <span>New Category</span>
      </button>
    </div>
  );
};

export default Sidebar;