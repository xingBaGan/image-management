import React, { useCallback } from 'react';
import { Category } from '../../types/index.ts';
import { BulkAction } from './BulkActions.tsx';

interface CategoryDropdownMenuProps {
  action: BulkAction;
  index: number;
  selectedCategories: string[];
  setSelectedCategories: (categories: string[] | ((prev: string[]) => string[])) => void;
  t: (key: string) => string;
}

const CategoryDropdownMenu: React.FC<CategoryDropdownMenuProps> = ({
  action,
  index,
  selectedCategories,
  setSelectedCategories,
  t,
}) => {

  const isParentOfSelected = (categoryId: string): boolean => {
    return selectedCategories.some(selectedId => {
      let current = action.categories?.find(cat => cat.id === selectedId);
      while (current?.father) {
        if (current.father === categoryId) return true;
        current = action.categories?.find(cat => cat.id === current!.father);
      }
      return false;
    });
  };

  const collectChildren = useCallback((categoryId: string): string[] => {
    const children: string[] = [];
    const current = action.categories?.find(cat => cat.id === categoryId);
    if (!current?.children) return children;
    for (const childId of current.children) {
      // 收集儿子
      children.push(childId);
      const child = action.categories?.find(cat => cat.id === childId);
      if (child?.children) {
        children.push(...collectChildren(childId));
      }
    }
    return children;
  }, [action.categories]);
  const isChildrenOfSelected = useCallback((categoryId: string, selectedCategories: string[]): boolean => {
    if (!categoryId || !selectedCategories.length) return false;
    const allChildrenId = [];
    for (const selectedId of selectedCategories) {
      allChildrenId.push(...collectChildren(selectedId));
    }
    return allChildrenId.includes(categoryId);
  }, [action.categories, selectedCategories]);

  const renderCategory = (category: Category, level: number = 0) => {
    const childCategories = action.categories?.filter((cat: Category) => cat.father === category.id) || [];
    const isDisabled = isParentOfSelected(category.id) || isChildrenOfSelected(category.id, selectedCategories);
    return (
      <div key={category.id}>
        <label className="flex items-center px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
          <div style={{ paddingLeft: `${level * 16}px` }} className="flex items-center w-full">
            <input
              type="checkbox"
              className="mr-2"
              disabled={isDisabled}
              checked={selectedCategories.includes(category.id)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedCategories((prev: string[]) => [...prev, category.id]);
                } else {
                  setSelectedCategories((prev: string[]) => prev.filter(id => id !== category.id));
                }
              }}
            />
            <span>{category.name}</span>
          </div>
        </label>
        {childCategories.map(child => renderCategory(child, level + 1))}
      </div>
    );
  };

  const rootCategories = action.categories?.filter((category: Category) => !category.father) || [];

  return (
    <div
      id={`category-dropdown-${index}`}
      className="hidden absolute left-0 top-full z-50 mt-1 w-64 bg-white rounded-lg border shadow-lg dark:bg-gray-800"
    >
      <div className="overflow-y-auto max-h-80">
        {rootCategories.map(category => renderCategory(category))}
      </div>
      <div className="px-4 py-2 border-t">
        <button
          className="px-3 py-1 w-full text-white bg-blue-500 rounded-lg hover:bg-blue-600"
          onClick={() => {
            if (action.onSelectCategories) {
              action.onSelectCategories(selectedCategories);
              setSelectedCategories([]);
              const dropdown = document.getElementById(`category-dropdown-${index}`);
              if (dropdown) {
                dropdown.classList.add('hidden');
              }
            }
          }}
        >
          {t('confirm')}
        </button>
      </div>
    </div>
  );
};

export default CategoryDropdownMenu;
