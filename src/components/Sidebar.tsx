import React from 'react';
import { Clock, Image as ImageIcon, Heart, Video, Plus, Edit, Trash } from 'lucide-react';
import { Category, FilterType } from '../types';

interface SidebarProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  categories: Category[];
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  onAddCategory?: (category: Category) => void;
  onDeleteCategory?: (categoryId: string) => void;
  onRenameCategory?: (categoryId: string, newName: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  selectedCategory,
  onSelectCategory,
  categories,
  onAddCategory,
  onDeleteCategory,
  onRenameCategory,
}) => {
  const [editingCategoryId, setEditingCategoryId] = React.useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState<string | null>(null);
  const [showSuccess, setShowSuccess] = React.useState<string | null>(null);
  const [successType, setSuccessType] = React.useState<'rename' | 'delete' | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

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

  const handleRename = (categoryId: string, newName: string) => {
    if (onRenameCategory && newName.trim()) {
      onRenameCategory(categoryId, newName.trim());
      setEditingCategoryId(null);
      setSuccessType('rename');
      setShowSuccess(categoryId);
      setTimeout(() => {
        setShowSuccess(null);
        setSuccessType(null);
      }, 3000);
    }
  };

  const handleDelete = (categoryId: string) => {
    if (onDeleteCategory) {
      onDeleteCategory(categoryId);
      setShowDeleteConfirm(null);
      setShowSuccess(categoryId);
      setSuccessType('delete');
      setTimeout(() => {
        setShowSuccess(null);
        setSuccessType(null);
      }, 3000);
    }
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setEditingCategoryId(null);
      }
    };

    if (editingCategoryId) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editingCategoryId]);

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
        {successType && (
        <div className="absolute top-[-20px] right-8 z-10 p-2 mt-8 w-40 text-white bg-green-500 rounded-lg shadow-lg animate-fade-in-out">
          {successType === 'rename' ? '分类修改成功' : '分类删除成功'}
        </div>
        )}
          {categories.map((category) => (
            <div key={category.id} className="relative">
              <button
                onClick={() => onSelectCategory(category.id)}
                className={`w-full flex items-center justify-between px-4 py-2 rounded-lg transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {editingCategoryId === category.id ? (
                  <input
                    ref={inputRef}
                    autoFocus
                    defaultValue={category.name}
                    title="编辑分类名称"
                    placeholder="输入分类名称"
                    onBlur={(e) => handleRename(category.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (e.currentTarget.value.trim()) {
                          handleRename(category.id, e.currentTarget.value);
                        }
                      } else if (e.key === 'Escape') {
                        setEditingCategoryId(null);
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="px-2 w-full bg-transparent outline-none"
                  />
                ) : (
                  <>
                    <span>{category.name}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">{category.count}</span>
                      <button
                        title="编辑分类"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCategoryId(category.id);
                        }}
                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        <Edit size={20} />
                      </button>
                      <button
                        title="删除分类"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteConfirm(category.id);
                        }}
                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        <Trash size={20} />
                      </button>
                    </div>
                  </>
                )}
              </button>

              {/* 删除确认弹窗 */}
              {showDeleteConfirm === category.id && (
                <div className="absolute top-0 right-0 z-10 p-4 mt-8 bg-white rounded-lg shadow-lg dark:bg-gray-700">
                  <p className="mb-3 text-gray-700 dark:text-gray-200">确定要删除 "{category.name}" 分类吗？</p>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setShowDeleteConfirm(null)}
                      className="px-3 py-1 text-gray-600 bg-gray-200 rounded hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="px-3 py-1 text-white bg-red-500 rounded hover:bg-red-600"
                    >
                      删除
                    </button>
                  </div>
                </div>
              )}
            </div>
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