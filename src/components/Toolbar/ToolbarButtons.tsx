import React, { useEffect } from 'react';
import { FileJson, Settings as SettingsIcon, FilterIcon, Keyboard } from 'lucide-react';
import { useLocale } from '../../contexts/LanguageContext';
import { FilterOptions } from '../../types/index.ts';

interface ToolbarButtonsProps {
  onOpenConfig: () => Promise<void>;
  setIsSettingsOpen: (isOpen: boolean) => void;
  setIsShortcutsHelpOpen: (isOpen: boolean) => void;
  isFilterOpen: boolean;
  setIsFilterOpen: (isOpen: boolean) => void;
  filterOptions: FilterOptions;
  filterButtonRef: React.RefObject<HTMLElement>;
  filterRef: React.RefObject<HTMLDivElement>;
  filterColors: string[];
}

const ToolbarButtons: React.FC<ToolbarButtonsProps> = ({
  onOpenConfig,
  setIsSettingsOpen,
  setIsShortcutsHelpOpen,
  isFilterOpen,
  setIsFilterOpen,
  filterOptions,
  filterButtonRef,
  filterRef,
  filterColors,
}) => {
  const { t } = useLocale();
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterRef.current && 
        !filterRef.current.contains(event.target as Node) &&
        !(filterButtonRef.current && filterButtonRef.current.contains(event.target as Node))
      ) {
        setIsFilterOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setIsFilterOpen, filterButtonRef]);

  const getFilterCount = () => {
    return filterColors.length +
      filterOptions?.ratio.length +
      filterOptions?.formats.length +
      (filterOptions?.rating !== null ? 1 : 0);
  };

  return (
    <div ref={filterRef} className="flex items-center space-x-2">
      <button
        onClick={onOpenConfig}
        className="p-2 text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-blue-500"
        title={t('openConfig')}
        aria-label={t('openConfig')}
      >
        <FileJson className="w-4 h-4" />
      </button>
      
      <button
        onClick={() => setIsSettingsOpen(true)}
        className="p-2 text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-blue-500"
        title={t('settings')}
      >
        <SettingsIcon size={20} />
      </button>

      <div className="relative">
        <button
          ref={filterButtonRef as React.RefObject<HTMLButtonElement>}
          className={`p-2 rounded-lg ${
            isFilterOpen || getFilterCount() > 0
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-500'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-blue-500'
          }`}
          title={`${t('filter')} (Ctrl+R)`}
          onClick={() => setIsFilterOpen(!isFilterOpen)}
        >
          <div className="relative">
            <FilterIcon size={20} />
            {getFilterCount() > 0 && (
              <div className="absolute -top-2 -right-2 flex items-center justify-center w-4 h-4 text-[10px] text-white bg-red-500 rounded-full">
                {getFilterCount()}
              </div>
            )}
          </div>
        </button>
      </div>

      <button 
        onClick={() => setIsShortcutsHelpOpen(true)}
        className="p-2 text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-blue-500"
        title={t('shortcuts.show')}
      >
        <Keyboard size={20} />
      </button>
    </div>
  );
};

export default ToolbarButtons; 