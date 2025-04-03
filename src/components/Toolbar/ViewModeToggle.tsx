import React from 'react';
import { Grid, List } from 'lucide-react';
import { ViewMode } from '../../types/index.ts';
import { useLocale } from '../../contexts/LanguageContext';

interface ViewModeToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

const ViewModeToggle: React.FC<ViewModeToggleProps> = ({ viewMode, onViewModeChange }) => {
  const { t } = useLocale();

  return (
    <div className="flex items-center pl-4 space-x-2 border-l ">
      <button
        onClick={() => onViewModeChange('grid')}
        className={`p-2 rounded-lg ${
          viewMode === 'grid'
            ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
        title={t('gridView')}
      >
        <Grid size={20} />
      </button>
      <button
        onClick={() => onViewModeChange('list')}
        className={`p-2 rounded-lg ${
          viewMode === 'list'
            ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
        title={t('listView')}
      >
        <List size={20} />
      </button>
    </div>
  );
};

export default ViewModeToggle; 