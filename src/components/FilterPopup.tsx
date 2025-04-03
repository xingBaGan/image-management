import React from 'react';
import { X, Image, FileJson, Star, Palette } from 'lucide-react';
import { Filter, FilterOptions } from '../types/index.ts';
import { useLocale } from '../contexts/LanguageContext';

interface FilterPopupProps {
  isOpen: boolean;
  filters: Filter[];
  filterColors: string[];
  setFilterColors: (colors: string[]) => void;
  filterOptions: FilterOptions;
  onFilterChange: (type: keyof FilterOptions, value: string | number) => void;
}

const FilterPopup: React.FC<FilterPopupProps> = ({
  isOpen,
  filters,
  filterColors,
  setFilterColors,
  filterOptions,
  onFilterChange,
}) => {
  const { t } = useLocale();

  if (!isOpen) return null;

  const getFilterIcon = (type: Filter['type']) => {
    switch (type) {
      case 'colors':
        return <Palette className="w-4 h-4" />;
      case 'ratio':
        return <Image className="w-4 h-4" />;
      case 'rating':
        return <Star className="w-4 h-4" />;
      case 'formats':
        return <FileJson className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="absolute left-0 top-[calc(100%+8px)] z-50 p-4 w-80 bg-white rounded-lg border shadow-lg dark:text-white dark:bg-gray-800 ">
      <div className="space-y-4">
        {filters.map(filter => {
          if (filter.type === 'colors') {
            return (
              <div key={filter.id} className="space-y-2">
                <div className="flex items-center space-x-2">
                  {getFilterIcon(filter.type)}
                  <span className="text-sm font-medium dark:text-white">{filter.label}</span>
                </div>
                <div className='flex flex-wrap gap-2'>
                  {filterColors.map(color => (
                    <div
                      key={color}
                      className="flex relative gap-1 items-center px-3 py-1 text-sm text-white rounded-full border group"
                      style={{ backgroundColor: color }}
                    >
                      {color}
                      <button
                        onClick={() => {
                          const newColors = filterColors.filter(c => c !== color);
                          setFilterColors(newColors);
                        }}
                        className="p-0.5 rounded-full hover:bg-white/20 transition-colors"
                        title={t('removeColor')}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {t('colorPrecision')}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {Math.round(filterOptions.precision * 100)}%
                    </span>
                  </div>
                  {filterColors.length > 0 && (
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.01"
                      value={filterOptions.precision}
                      onChange={(e) => onFilterChange('precision', parseFloat(e.target.value))}
                      className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-500"
                      title={t('colorPrecision')}
                    />
                  )}
                </div>
              </div>
            )
          }
          return (
            <div key={filter.id} className="space-y-2">
              <div className="flex items-center space-x-2">
                {getFilterIcon(filter.type)}
                <span className="text-sm font-medium dark:text-white">{filter.label}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {filter.options?.map(option => (
                  <button
                    key={option}
                    onClick={() => onFilterChange(filter.type as keyof FilterOptions, option)}
                    className={`px-3 py-1 text-sm rounded-full border ${filter.type === 'rating'
                        ? filterOptions.rating === parseInt(option)
                          ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-300'
                          : 'border-gray-300 dark:border-gray-600'
                        : (filterOptions[filter.type as keyof FilterOptions] as string[]).includes(option)
                          ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-300'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    title={filter.type === 'rating' ? t('rateImage') : undefined}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FilterPopup; 