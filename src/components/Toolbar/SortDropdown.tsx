import React, { useState } from 'react';
import { SortAsc, SortDesc } from 'lucide-react';
import { SortType } from '../../types/index.ts';
import { useLocale } from '../../contexts/LanguageContext';

interface SortDropdownProps {
  sortBy: SortType;
  sortDirection: 'asc' | 'desc';
  onSortChange: (sort: SortType) => void;
  sortButtonRef: React.RefObject<HTMLElement>;
}

const SortDropdown: React.FC<SortDropdownProps> = ({
  sortBy,
  sortDirection,
  onSortChange,
  sortButtonRef
}) => {
  const { t } = useLocale();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const getSortLabel = () => {
    switch (sortBy) {
      case SortType.Date:
        return t('sort.date');
      case SortType.Name:
        return t('sort.name');
      case SortType.Size:
        return t('sort.size');
      default:
        return t('sort.date');
    }
  };

  return (
    <div 
      className="relative group"
      onMouseEnter={() => setIsDropdownOpen(true)}
      onMouseLeave={() => setIsDropdownOpen(false)}
    >
      <button 
        ref={sortButtonRef as React.RefObject<HTMLButtonElement>}
        className="flex items-center px-3 py-2 space-x-2 rounded-lg sort-button dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
        title={`${t('sortBy')} (Ctrl+S)`}
        onClick={() => setIsDropdownOpen(prev => !prev)}
      >
        {sortDirection === 'asc' ? <SortAsc size={20} /> : <SortDesc size={20} />}
        <span>{t('sortBy')}{getSortLabel()}</span>
      </button>

      {isDropdownOpen && (
        <div className="absolute left-0 top-[calc(100%-5px)] z-50 py-1 mt-1 w-48 bg-white rounded-lg border shadow-lg dark:text-white dark:bg-gray-800 dark:border-gray-700">
          <button
            onClick={() => onSortChange(SortType.Name)}
            className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:text-red-300 dark:hover:bg-gray-700 ${
              sortBy === SortType.Name ? 'text-blue-600 dark:text-blue-300' : ''
            }`}
          >
            {t('sort.name')}
          </button>

          <button
            onClick={() => onSortChange(SortType.Date)}
            className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:text-red-300 dark:hover:bg-gray-700 ${
              sortBy === SortType.Date ? 'text-blue-600 dark:text-blue-300' : ''
            }`}
          >
            {t('sort.date')}
          </button>
          <button
            onClick={() => onSortChange(SortType.Size)}
            className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:text-red-300 dark:hover:bg-gray-700 ${
              sortBy === SortType.Size ? 'text-blue-600 dark:text-blue-300' : ''
            }`}
          >
            {t('sort.size')}
          </button>
        </div>
      )}
    </div>
  );
};

export default SortDropdown; 