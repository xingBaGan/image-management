import React, { useState, useEffect, useRef } from 'react';
import { 
  Image, 
  FolderPlus, 
  Clock, 
  Heart, 
  Video,
  FolderInput, 
  MoreVertical,
  Edit2,
  GripVertical,
  Trash2
} from 'lucide-react';
import { Category, FilterType, ImportStatus, LocalImageData } from '../types/index.ts';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import { StrictModeDroppable } from './StrictModeDroppable';
import { useLocale } from '../contexts/LanguageContext';
import ThemeToggle from './ThemeToggle.tsx';
import LanguageToggle from './LanguageToggle.tsx';
import CategoryDropdownMenu from './CategoryDropdownMenu.tsx';
import CategoryItem from './CategoryItem.tsx';

interface SidebarProps {
  selectedCategory: FilterType | string;
  onSelectCategory: (id: FilterType) => void;
  categories: Category[];
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  onAddCategory: (category: Category) => void;
  onRenameCategory: (id: string, newName: string) => void;
  onUpdateCategories?: (categories: Category[]) => void;
  setShowDeleteConfirm: (id: string | null) => void;
  onImportFolder?: () => Promise<void>;
  setImportState: (state: ImportStatus) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  selectedCategory,
  onSelectCategory,
  categories,
  onAddCategory,
  onRenameCategory,
  setImportState,
  onUpdateCategories,
  setShowDeleteConfirm,
  onImportFolder,
}) => {
  const { t } = useLocale();
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [showDropdown, setShowDropdown] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-button') && !target.closest('.dropdown-content')) {
        setShowDropdown(null);
      }
      if (!target.closest('.edit-input') && editingCategory) {
        if (editingName.trim()) {
          handleRenameCategory(editingCategory);
        } else {
          setEditingCategory(null);
          setEditingName('');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editingCategory, editingName]);

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      onAddCategory({
        id: `category-${Date.now()}`,
        name: newCategoryName.trim(),
        images: [],
        count: 0,
        isImportFromFolder: false
      });
      setNewCategoryName('');
      setIsAddingCategory(false);
    }
  };

  const handleAddSubcategory = (parentId: string) => {
    const parentCategory = categories.find(cat => cat.id === parentId);
    if (parentCategory) {
      const newSubcategory: Category = {
        id: `category-${Date.now()}`,
        name: '',
        images: [],
        count: 0,
        isImportFromFolder: false,
        father: parentCategory.id,
        children: [],
      };
      
      // Create a deep copy of the categories array
      const updatedCategories = JSON.parse(JSON.stringify(categories));
      
      // Find the parent category and add the new subcategory to its children
      const updateCategoryChildren = (categories: Category[]): Category[] => {
        for (const cat of categories) {
          // 如果catId是父分类，则将新分类添加到父分类的children中
          if (cat.id === parentId) {
            cat.children = [...(cat.children || []), newSubcategory.id];
          }
        }
        return categories;
      };
      
      const result = updateCategoryChildren(updatedCategories);
      
      // Update the categories in the parent component
      if (onUpdateCategories) {
        onUpdateCategories([...result, newSubcategory]);
      }
      
      // Set the editing state for the new subcategory
      setEditingCategory(newSubcategory.id);
      setEditingName(newSubcategory.name);
    }
  };

  const handleRenameCategory = (id: string) => {
    if (editingName.trim()) {
      onRenameCategory(id, editingName.trim());
      setEditingCategory(null);
      setEditingName('');
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !onUpdateCategories) return;

    const { source, destination } = result;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    let reorderedCategories = Array.from(categories);
    const [removed] = reorderedCategories.splice(source.index, 1);
    reorderedCategories.splice(destination.index, 0, removed);
    reorderedCategories = reorderedCategories.map((category, index) => ({
      ...category,
      order: index
    }));
    onUpdateCategories(reorderedCategories);
  };

  const handleDeleteRequest = (categoryId: string) => {
    setShowDeleteConfirm(categoryId);
    setShowDropdown(null);
  };

  return (
    <div className="z-10 w-48 h-full bg-gray-200 bg-opacity-10 border-r border-gray-200 shadow-lg backdrop-blur-lg dark:bg-gray-800 dark:bg-opacity-60">
      <div className='flex justify-between items-center px-1 h-14'>
        <LanguageToggle />
        <ThemeToggle />
      </div>
      <div className="p-2">
        <div className="space-y-2">
          {[
            { id: 'photos', icon: Image, label: t('photos') },
            { id: 'videos', icon: Video, label: t('videos') },
            { id: 'recent', icon: Clock, label: t('recent') },
            { id: 'favorites', icon: Heart, label: t('favorites') }
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => onSelectCategory(id as FilterType)}
              className={`text-base flex w-full items-center py-1 px-2 rounded-lg text-gray-700 dark:text-white hover:bg-gray-100 hover:bg-opacity-80 dark:hover:bg-gray-700 dark:hover:bg-opacity-80 ${
                selectedCategory === id ? 'bg-gray-100 dark:bg-gray-700' : ''
              }`}
            >
              <Icon size={16} className="mr-2" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="pl-1 text-sm font-medium text-gray-500 dark:text-blue-300">{t('categories')}</h3>
            <div className="flex gap-1">
              <button
                onClick={async () => {
                  setImportState(ImportStatus.Importing);
                  await onImportFolder?.();
                  setImportState(ImportStatus.Imported);
                }}
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-white dark:hover:text-blue-300"
                title={t('importFolder')}
              >
                <FolderInput size={16} />
              </button>
              <button
                onClick={() => setIsAddingCategory(true)}
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-white dark:hover:text-blue-300"
                title={t('addCategory')}
              >
                <FolderPlus size={16} />
              </button>
            </div>
          </div>

          {isAddingCategory && (
            <div className="flex items-center mb-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddCategory();
                  } else if (e.key === 'Escape') {
                    setIsAddingCategory(false);
                    setNewCategoryName('');
                  }
                }}
                placeholder={t('categoryName')}
                className="flex-1 px-2 py-1 text-sm rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                autoFocus
              />
            </div>
          )}

          <DragDropContext onDragEnd={handleDragEnd}>
            <StrictModeDroppable droppableId="categories">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="overflow-y-auto space-y-1"
                  style={{
                    maxHeight: 'calc(100vh - 280px)',
                    overflowY: 'auto',
                  }}
                >
                  {categories.map((category, index) => !category.father && (
                    <CategoryItem
                      key={category.id}
                      category={category}
                      index={index}
                      categories={categories}
                      selectedCategory={selectedCategory}
                      editingCategory={editingCategory}
                      editingName={editingName}
                      showDropdown={showDropdown}
                      onSelectCategory={onSelectCategory}
                      onRenameCategory={onRenameCategory}
                      handleDeleteRequest={handleDeleteRequest}
                      onAddChild={handleAddSubcategory}
                      setEditingCategory={setEditingCategory}
                      setEditingName={setEditingName}
                      setShowDropdown={setShowDropdown}
                    />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </StrictModeDroppable>
          </DragDropContext>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;