import React, { useState, useEffect, useCallback } from 'react';
import {
  Image,
  FolderPlus,
  Clock,
  Heart,
  Video,
  FolderInput,
} from 'lucide-react';
import { Category, FilterType, ImportStatus } from '../types/index.ts';
import { DragDropContext, DraggableRubric, DropResult } from 'react-beautiful-dnd';
import { StrictModeDroppable } from './StrictModeDroppable';
import { useLocale } from '../contexts/LanguageContext';
import ThemeToggle from './ThemeToggle.tsx';
import LanguageToggle from './LanguageToggle.tsx';
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
const getMaxOrder = (categories: Category[], level: number): number => {
  if (!categories || categories.length === 0) return 0;
  return Math.max(...categories.map(cat => parseInt(cat.order?.split('-')[level - 1] || '0'))) + 1;
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
  const [addingFatherId, setAddingFatherId] = useState<string | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [showDropdown, setShowDropdown] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

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
      const order = getMaxOrder(categories, 1);
      onAddCategory({
        id: `category-${Date.now()}`,
        name: newCategoryName.trim(),
        images: [],
        count: 0,
        isImportFromFolder: false,
        order: order.toString(),
        level: 1
      });
      setNewCategoryName('');
      setIsAddingCategory(false);
    }
  };

  const handleAddSubcategory = (parentId: string, addingName: string) => {
    const parentCategory = categories.find(cat => cat.id === parentId);
    if (parentCategory) {
      const level = parentCategory.level ? parentCategory.level + 1 : 1;
      const currentLevelCategories = categories.filter(cat => cat.level === (level || 0) && cat.father === parentCategory.id)
      const order = getMaxOrder(currentLevelCategories, level);
      const newSubcategory: Category = {
        id: `category-${Date.now()}`,
        name: addingName,
        images: [],
        count: 0,
        isImportFromFolder: false,
        father: parentCategory.id,
        children: [],
        order: parentCategory.order + '-' + order.toString(),
        level,
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
      setIsAddingCategory(false);
      setAddingFatherId(null);
    }
  };

  const handleRenameCategory = (id: string) => {
    if (editingName.trim()) {
      onRenameCategory(id, editingName.trim());
      setEditingCategory(null);
      setEditingName('');
    }
  };

  const reorder = (list: any[], startIndex: number, endIndex: number): any[] => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    console.log('result', list, '---->', result, 'startIndex', startIndex, 'endIndex', endIndex);
    return result;
  };

  const updateChildrenOrder = (children: Category[], level: number, newOrder: string) => {
    if (children.length === 0) return;
    children.forEach((category, index) => {
      let orders = category.order?.split('-') || [];
      orders[level - 1] = newOrder;
      category.order = orders.join('-');
      if (category.children) {
        const children = categories.filter(cat => category.children?.includes(cat.id));
        updateChildrenOrder(children,level, newOrder);
      }
    });
  }
  const reAssignOrder = (categories: Category[], level: number, parentId?: string) => {
    if (categories.length === 0) return;
    let tempCategories = categories.filter(cat => cat.level === level && cat.father === parentId);
    tempCategories.forEach((category, index) => {
      let orders = category.order?.split('-') || [];
      orders[level - 1] = index.toString();
      category.order = orders.join('-');
      if (category.children) {
        const children = categories.filter(cat => category.children?.includes(cat.id));
        updateChildrenOrder(children, level, index.toString());
      }
    });
  }



  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !onUpdateCategories) return;

    const { source, destination } = result;
    console.log('result', result);
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }
    if (result.type === 'level1') {
      let reorderedCategories = categories;
      reorderedCategories = reorder(reorderedCategories, source.index, destination.index);
      reAssignOrder(reorderedCategories, 1);
      reorderedCategories = reorderedCategories.map((category) => ({
        ...category,
      }));
      onUpdateCategories(reorderedCategories);
    } else {
      const currentCategory = categories.find(cat => cat.id === result.source.droppableId);
      const parentCategory = categories.find(cat => cat.id === currentCategory?.father);
      if (parentCategory) {
        const children = parentCategory.children;
        const level = parentCategory.level ? parentCategory.level + 1 : 1;
        const childrenCategories = categories.filter(cat => children?.includes(cat.id));
        const restCategories = categories.filter(cat => !children?.includes(cat.id));
        if (childrenCategories) {
          let reorderedChildren = reorder(childrenCategories, source.index, destination.index);
          reAssignOrder(categories, level, parentCategory.id);
          onUpdateCategories([...restCategories, ...reorderedChildren]);
        }
      }
    }
  };

  const handleDeleteRequest = (categoryId: string) => {
    setShowDeleteConfirm(categoryId);
    setShowDropdown(null);
  };

  const handleDragStart = ({ draggableId }: DraggableRubric) => {
    setDraggingId(draggableId);
  }

  const collectChildren = useCallback((categoryId: string): string[] => {
    const children: string[] = [];
    const current = categories?.find(cat => cat.id === categoryId);
    if (!current?.children) return children;
    for (const childId of current.children) {
      // 收集儿子
      children.push(childId);
      const child = categories?.find(cat => cat.id === childId);
      if (child?.children) {
        children.push(...collectChildren(childId));
      }
    }
    return children;
  }, [categories]);

  const countChildren = useCallback((categoryId: string): number => {
    const children = collectChildren(categoryId);
    return children.reduce((acc, curr) => {
      const child = categories?.find(cat => cat.id === curr);
      if (child) {
        return acc + child.count;
      }
      return acc;
    }, 0);
  }, [collectChildren, categories]);

  const isParentOfSelected = (categoryId: string): boolean => {
    return [selectedCategory].some(selectedId => {
      let current = categories?.find(cat => cat.id === selectedId);
      while (current?.father) {
        if (current.father === categoryId) return true;
        current = categories?.find(cat => cat.id === current!.father);
      }
      return false;
    });
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
              className={`text-base flex w-full items-center py-1 px-2 rounded-lg text-gray-700 dark:text-white hover:bg-gray-100 hover:bg-opacity-80 dark:hover:bg-gray-700 dark:hover:bg-opacity-80 ${selectedCategory === id ? 'bg-gray-100 dark:bg-gray-700' : ''
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
          <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
            <StrictModeDroppable droppableId="root" type="root">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`space-y-1 ${snapshot.isDraggingOver ? 'bg-gray-100 dark:bg-gray-700 bg-opacity-50' : ''}`}
                >
                  {categories.map((category, index) => !category.father && (
                    <StrictModeDroppable droppableId={category.id} type={`level${1}`} key={category.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`relative ${snapshot.isDraggingOver ? 'pt-1 pb-1' : ''}`}
                        >
                          {snapshot.isDraggingOver && (
                            <div className="absolute inset-0 bg-gray-100 bg-opacity-50 rounded-lg border-2 border-gray-300 border-dashed dark:border-gray-500 dark:bg-gray-700" />
                          )}
                          <CategoryItem
                            key={category.id}
                            category={category}
                            index={index}
                            categories={categories}
                            isAddingCategory={isAddingCategory}
                            setIsAddingCategory={setIsAddingCategory}
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
                            countChildren={countChildren}
                            isParentOfSelected={isParentOfSelected}
                            addingFatherId={addingFatherId}
                            setAddingFatherId={setAddingFatherId}
                            draggingId={draggingId}
                            snapshot={snapshot}
                            level={1}
                          />
                        </div>
                      )}
                    </StrictModeDroppable>
                  ))}
                </div>
              )}
            </StrictModeDroppable>
          </DragDropContext>
          {isAddingCategory && addingFatherId === null && (
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
        </div>
      </div>
    </div>
  );
};

export default Sidebar;