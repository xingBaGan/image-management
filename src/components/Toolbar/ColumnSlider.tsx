import React from 'react';
import { Grid3X3 } from 'lucide-react';
import { useLocale } from '../../contexts/LanguageContext';

interface ColumnSliderProps {
  columnCount: number;
  setColumnCount: (count: number) => void;
  min?: number;
  max?: number;
}

const ColumnSlider: React.FC<ColumnSliderProps> = ({
  columnCount,
  setColumnCount,
  min = 3,
  max = 5
}) => {
  const { t } = useLocale();

  return (
    <div className="flex items-center pl-2 space-x-2 border-l">
      <div className="flex items-center px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
        <Grid3X3 size={18} className="mr-2" />
        <span className="text-sm whitespace-nowrap">{t('columns')}</span>
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="range"
          min={min}
          max={max}
          value={columnCount}
          onChange={(e) => setColumnCount(parseInt(e.target.value))}
          className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
          aria-label={t('adjustColumnCount')}
        />
        <span className="text-sm font-medium">{columnCount}</span>
      </div>
    </div>
  );
};

export default ColumnSlider; 