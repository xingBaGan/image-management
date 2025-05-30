import React, { useEffect, useState } from 'react';
import { MoreVertical, Folder, FolderOpen } from 'lucide-react';
import { Category, FilterType } from '../types/index.ts';
import { Draggable, DroppableStateSnapshot } from 'react-beautiful-dnd';
import { useLocale } from '../contexts/LanguageContext';
import CategoryDropdownMenu from './CategoryDropdownMenu.tsx';
import { StrictModeDroppable } from './StrictModeDroppable.tsx';

// Helper function to check if text should be truncated
const shouldTruncateText = (text: string): boolean => {
  if (!text) return false;
  // Check if text contains Chinese characters
  const hasChinese = /[\u4e00-\u9fff]/.test(text);
  return hasChinese ? text.length >= 5 : text.length >= 10;
};

interface CategoryItemProps {
  category: Category;
  index: number;
  selectedCategory: FilterType | string;
  editingCategory: string | null;
  editingName: string;
  showDropdown: string | null;
  onSelectCategory: (id: FilterType) => void;
  onRenameCategory: (id: string, newName: string) => void;
  handleDeleteRequest: (categoryId: string) => void;
  onAddChild?: (parentId: string, addingName: string) => void;
  setEditingCategory: (categoryId: string | null) => void;
  setEditingName: (name: string) => void;
  setShowDropdown: (categoryId: string | null) => void;
  categories: Category[];
  countChildren: (categoryId: string) => number;
  isParentOfSelected: (categoryId: string) => boolean;
  isAddingCategory: boolean;
  setIsAddingCategory: (isAddingCategory: boolean) => void;
  addingFatherId: string | null;
  setAddingFatherId: (categoryId: string | null) => void;
  draggingId: string | null;
  snapshot: DroppableStateSnapshot;
  level: number;
}

const CategoryItem: React.FC<CategoryItemProps> = ({
  category,
  index,
  selectedCategory,
  editingCategory,
  editingName,
  showDropdown,
  onSelectCategory,
  onRenameCategory,
  handleDeleteRequest,
  onAddChild,
  setEditingCategory,
  setEditingName,
  setShowDropdown,
  categories,
  countChildren,
  isParentOfSelected,
  isAddingCategory,
  setIsAddingCategory,
  addingFatherId,
  setAddingFatherId,  
  draggingId,
  snapshot,
  level
}) => {
  const { t } = useLocale();
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = category?.children && category?.children?.length > 0;
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleRenameCategory = (id: string) => {
    if (editingName.trim()) {
      onRenameCategory(id, editingName.trim());
      setEditingCategory(null);
      setEditingName('');
    }
  };

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  useEffect(() => {
    if (!selectedCategory.includes('category')) {
      return;
    }
    if (selectedCategory === category.id) {
      setIsExpanded(true);
    }
    if (isParentOfSelected(selectedCategory)) {
      setIsExpanded(true);
    }
  }, [selectedCategory, isParentOfSelected]);

  useEffect(() => {
    if (draggingId === category.id && snapshot.isDraggingOver) {
      setIsExpanded(false);
    }
  }, [draggingId, snapshot]);

  return (
    <Draggable
      key={category.id}
      draggableId={category.id}
      index={index}
    >
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className="relative"
          style={{
            ...provided.draggableProps.style,
            transform: snapshot.isDragging ? provided.draggableProps.style?.transform : 'none',
            zIndex: snapshot.isDragging ? 999 : 'auto'
          }}
        >
          <div className={`
            flex items-center py-2 pl-1 
            ${selectedCategory === category.id ? 'bg-gray-100 dark:bg-gray-700' : ''} 
            rounded-lg
            ${snapshot.isDragging ? 'opacity-50 shadow-lg ring-2 ring-blue-500 dark:ring-blue-400' : 'opacity-100'}
            transition-all duration-200
            w-full
            ${snapshot.isDragging ? 'bg-gray-100 dark:bg-gray-700' : ''}
            hover:bg-gray-100 dark:hover:bg-gray-700
          `}>
            <div
              {...provided.dragHandleProps}
              className="p-[0.1rem] rounded cursor-grab hover:bg-gray-200 dark:hover:bg-gray-600 active:cursor-grabbing"
              style={{
                cursor: snapshot.isDragging ? 'grabbing' : 'grab'
              }}
              onClick={toggleExpand}
            >
              {isExpanded ? <FolderOpen size={14} className="text-gray-400" /> : <Folder size={14} className="text-gray-400" />}
            </div>

            {editingCategory === category.id ? (
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Enter') {
                    handleRenameCategory(category.id);
                    setEditingName('');
                  } else if (e.key === 'Escape') {
                    setEditingCategory(null);
                    setEditingName('');
                  }
                }}
                className="flex-1 px-2 py-1 w-full text-sm bg-transparent rounded border dark:text-white edit-input"
                autoFocus
                placeholder={t('categoryName')}
                title={t('categoryName')}
                aria-label={t('categoryName')}
              />
            ) : (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectCategory(category.id as FilterType);
                  }}
                  className={`flex-1 text-left text-gray-700 dark:text-white hover:text-gray-900 dark:hover:text-white ${category.isImportFromFolder ? 'text-blue-400 dark:text-blue-400' : ''}`}
                >
                  {category.name && shouldTruncateText(category.name) ? (
                    <div className="relative group">
                      <p className="text-gray-900 truncate dark:text-white max-w-44 w-[70px]">{category.name}</p>
                      <div className="hidden absolute z-10 px-2 py-1 h-auto text-xs text-white break-words bg-gray-800 rounded group-hover:inline-block max-w-48">
                        {category.name}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-900 dark:text-white">{category.name}</p>
                  )}
                </button>
                <span className={`mr-2 text-xs ${category.isImportFromFolder ? 'text-blue-400 dark:text-blue-400' : ''}`}>
                  {(countChildren(category.id) + category.count) || 0}
                </span>
              </>
            )}

            <div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDropdown(showDropdown === category.id ? null : category.id);
                }}
                className="p-1 text-gray-400 hover:opacity-100 hover:text-gray-600 dark:hover:text-gray-300 dropdown-button"
                title={t('moreActions')}
                aria-label={t('moreActions')}
              >
                <MoreVertical size={14} />
              </button>

              {showDropdown === category.id && (
                <CategoryDropdownMenu
                  categoryId={category.id}
                  categoryName={category.name}
                  onRename={onRenameCategory}
                  onDelete={handleDeleteRequest}
                  onAddChild={() => {
                    setIsAddingCategory(true);
                    setAddingFatherId(category.id);
                    setIsExpanded(true);
                  }}
                  setEditingCategory={setEditingCategory}
                  setEditingName={setEditingName}
                  setShowDropdown={setShowDropdown}
                />
              )}
            </div>
          </div>
          {isAddingCategory && addingFatherId === category.id && (
            <div className="pl-2 ml-1 border-l border-gray-200 dark:border-gray-600">
              <input
                type="text"
                placeholder={t('categoryName')}
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Enter') {
                    onAddChild && onAddChild(addingFatherId, newCategoryName);
                    setNewCategoryName('');
                  } else if (e.key === 'Escape') {
                    setIsAddingCategory(false);
                    setAddingFatherId(null);
                    setNewCategoryName('');
                  }
                }}
                className="px-2 py-1 w-full text-sm bg-transparent rounded border dark:text-white edit-input"
                autoFocus
                title={t('categoryName')}
                aria-label={t('categoryName')}
              />
            </div>
          )}

          {isExpanded && hasChildren && (
            <div className="pl-2 ml-1 border-l border-gray-200 dark:border-gray-600">
              {category.children?.sort((a: Category['id'], b: Category['id']) => {
                const categoryA = categories.find((category: Category) => category.id === a);
                const categoryB = categories.find((category: Category) => category.id === b);
                return (categoryA?.order || '').localeCompare(categoryB?.order || '');
              }).map((childId: Category['id'], childIndex: number) => {
                const child = categories.find((category: Category) => category.id === childId);
                return child && (
                  <StrictModeDroppable droppableId={childId} type={`level${level + 1}`} key={childId}>
                    {(provided, snapshot) => (
                      <div 
                        ref={provided.innerRef} 
                        {...provided.droppableProps}
                        className={`relative ${snapshot.isDraggingOver ? 'pt-1 pb-1' : ''}`}
                      >
                        {snapshot.isDraggingOver && (
                          <div className="absolute inset-0 rounded-lg border-2 border-gray-300 border-dashed dark:border-gray-500" />
                        )}
                        <CategoryItem
                          key={childId}
                          category={child}
                          categories={categories}
                          index={childIndex}
                          selectedCategory={selectedCategory}
                          editingCategory={editingCategory}
                          editingName={editingName}
                          showDropdown={showDropdown}
                          onSelectCategory={onSelectCategory}
                          onRenameCategory={onRenameCategory}
                          handleDeleteRequest={handleDeleteRequest}
                          onAddChild={onAddChild}
                          setEditingCategory={setEditingCategory}
                          setEditingName={setEditingName}
                          setShowDropdown={setShowDropdown}
                          countChildren={countChildren}
                          isParentOfSelected={isParentOfSelected}
                          addingFatherId={addingFatherId}
                          setAddingFatherId={setAddingFatherId}
                          draggingId={draggingId}
                          isAddingCategory={isAddingCategory}
                          setIsAddingCategory={setIsAddingCategory}
                          snapshot={snapshot}
                          level={level + 1}
                        />
                      </div>
                    )}
                  </StrictModeDroppable>
                )
              })}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
};

export default CategoryItem; 