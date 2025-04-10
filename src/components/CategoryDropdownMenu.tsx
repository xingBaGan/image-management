import React from 'react';
import { Edit2, Trash2, FolderPlus } from 'lucide-react';
import { useLocale } from '../contexts/LanguageContext';

interface CategoryDropdownMenuProps {
  categoryId: string;
  categoryName: string;
  onRename: (categoryId: string, newName: string) => void;
  onDelete: (categoryId: string) => void;
  onAddChild?: (parentId: string) => void;
  setEditingCategory: (categoryId: string | null) => void;
  setEditingName: (name: string) => void;
  setShowDropdown: (categoryId: string | null) => void;
}

const CategoryDropdownMenu: React.FC<CategoryDropdownMenuProps> = ({
  categoryId,
  categoryName,
  onRename,
  onDelete,
  onAddChild,
  setEditingCategory,
  setEditingName,
  setShowDropdown,
}) => {
  const { t } = useLocale();

  return (
    <div className="absolute right-[-5] z-10 mt-2 w-48 bg-white rounded-md ring-1 ring-black ring-opacity-5 shadow-lg dark:bg-gray-700 dropdown-content">
      <div className="py-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setEditingCategory(categoryId);
            setEditingName(categoryName);
            setShowDropdown(null);
          }}
          className="flex items-center px-4 py-2 w-full text-sm text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600"
        >
          <Edit2 size={14} className="mr-2" />
          {t('rename')}
        </button>
        {onAddChild && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddChild(categoryId);
              setShowDropdown(null);
            }}
            className="flex items-center px-4 py-2 w-full text-sm text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600"
          >
            <FolderPlus size={14} className="mr-2" />
            {t('addSubcategory')}
          </button>
        )}
        <button
          onClick={() => onDelete(categoryId)}
          className="flex items-center px-4 py-2 w-full text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-600"
        >
          <Trash2 size={14} className="mr-2" />
          {t('delete')}
        </button>
      </div>
    </div>
  );
};

export default CategoryDropdownMenu; 