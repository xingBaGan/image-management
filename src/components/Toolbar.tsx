import React, { useState, useRef, useEffect } from 'react';
import { Search, Grid, List, SortAsc, SortDesc, X, Menu, Import, FileJson, Settings as SettingsIcon, Filter as FilterIcon, Star, Image, Palette, XCircle } from 'lucide-react';
import { ViewMode, SortType, Category, FilterOptions, Filter } from '../types';
import ThemeToggle from './ThemeToggle';
import LanguageToggle from './LanguageToggle';
import { useLanguage } from '../contexts/LanguageContext';

interface ToolbarProps {
  viewMode: ViewMode;
  sortBy: SortType;
  sortDirection: 'asc' | 'desc';
  onViewModeChange: (mode: ViewMode) => void;
  onSortChange: (sort: SortType) => void;
  onSearch: (tags: string[]) => void;
  onFilter: (filters: FilterOptions) => void;
  selectedCount: number;
  bulkActions: BulkAction[];
  onToggleSidebar: () => void;
  onImport: () => void;
  isSidebarOpen: boolean;
  setIsSettingsOpen: (isOpen: boolean) => void;
  isSettingsOpen: boolean;
  filterColors: string[];
  setFilterColors: (colors: string[]) => void;
}

interface SearchTag {
  id: string;
  text: string;
}

interface BulkAction {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  categories?: Category[];
  onSelectCategories?: (categories: string[]) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  viewMode,
  sortBy,
  sortDirection,
  onViewModeChange,
  onSortChange,
  onSearch,
  onFilter,
  selectedCount,
  bulkActions,
  onToggleSidebar,
  onImport,
  isSidebarOpen,
  setIsSettingsOpen,
  filterColors,
  setFilterColors,
}) => {
  const { t } = useLanguage();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    colors: filterColors,
    ratio: [],
    rating: null,
    formats: []
  });

  const [inputValue, setInputValue] = useState('');
  const [tags, setTags] = useState<SearchTag[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const filters: Filter[] = [
    {
      id: 'colors',
      type: 'colors',
      label: t('colors'),
      options: [],
      isMultiple: false
    },
    {
      id: 'ratio',
      type: 'ratio',
      label: t('ratio'),
      options: ['4:3', '16:9', '1:1', '3:4', '9:16'],
      isMultiple: true
    },
    {
      id: 'rating',
      type: 'rating',
      label: t('rating'),
      options: ['1', '2', '3', '4', '5'],
      isMultiple: false
    },
    {
      id: 'formats',
      type: 'formats',
      label: t('formats'),
      options: ['PNG', 'JPG', 'GIF', 'WEBP'],
      isMultiple: true
    }
  ];

  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        if (tags.length === 0) {
          setIsSearchOpen(false);
        }
      }
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [tags]);

  const handleSearchClick = () => {
    setIsSearchOpen(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      const newTag = {
        id: Date.now().toString(),
        text: inputValue.trim()
      };
      const newTags = [...tags, newTag];
      setTags(newTags);
      setInputValue('');
      onSearch(newTags.map(tag => tag.text));
    }
  };

  const removeTag = (tagId: string) => {
    const newTags = tags.filter(tag => tag.id !== tagId);
    setTags(newTags);
    onSearch(newTags.map(tag => tag.text));
  };

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

  const handleFilterChange = (type: keyof FilterOptions, value: string) => {
    setFilterOptions(prev => {
      const newOptions = { ...prev };
      if (type === 'rating') {
        if (newOptions.rating === parseInt(value)) {
          newOptions.rating = null; // 取消选择
        } else {
          newOptions.rating = parseInt(value);
        }
      } else {
        const arr = newOptions[type] as string[];
        const index = arr.indexOf(value);
        if (index === -1) {
          arr.push(value);
        } else {
          arr.splice(index, 1);
        }
      }
      onFilter(newOptions);
      return newOptions;
    });
  };

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

  const filterPopup = () => {
    if (!isFilterOpen) return null;
    return (
      <div className="absolute left-0 top-[calc(100%+8px)] z-50 p-4 w-80 bg-white rounded-lg border shadow-lg dark:bg-gray-800 dark:border-gray-700">
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
                      onClick={() => handleFilterChange(filter.type as keyof FilterOptions, option)}
                      className={`px-3 py-1 text-sm rounded-full border ${
                        filter.type === 'rating'
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
    )
  }


  return (
    <>
      <div className="flex relative z-20 justify-between items-center px-6 h-16 bg-white bg-opacity-30 border-b backdrop-blur-sm dark:bg-gray-800 dark:bg-opacity-30 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 hover:bg-opacity-80 dark:hover:bg-gray-700 dark:hover:bg-opacity-80"
            title={isSidebarOpen ? t('hideSidebar') : t('showSidebar')}
          >
            <Menu size={20} />
          </button>
          
          <button
            onClick={onImport}
            className="flex items-center px-4 py-2 space-x-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600"
            title={t('import')}
          >
            <Import size={20} />
          </button>
          <LanguageToggle />
          <ThemeToggle />
          {selectedCount > 0 ? (
            <>
              <span className="text-sm text-gray-600dark:text-rose-300">
                {t('selected').replace('{count}', selectedCount.toString())}
              </span>
              <div className="h-6 border-l dark:border-gray-600" />
              <div className="flex items-center space-x-2">
                {bulkActions.map((action, index) => (
                  <div key={index} className="relative group">
                    {action.categories ? (
                      <div className="relative">
                        <button
                          className="flex items-center px-3 py-2 space-x-2 text-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700dark:text-rose-300"
                          onClick={() => {
                            const dropdown = document.getElementById(`category-dropdown-${index}`);
                            if (dropdown) {
                              dropdown.classList.toggle('hidden');
                            }
                          }}
                          title={t(action.label.toLowerCase())}
                        >
                          {action.icon}
                          <span>{t(action.label.toLowerCase())}</span>
                        </button>
                        
                        <div 
                          id={`category-dropdown-${index}`}
                          className="hidden absolute left-0 top-full z-50 mt-1 w-48 bg-white rounded-lg border shadow-lg dark:bg-gray-800 dark:border-gray-700"
                        >
                          {action.categories.map(category => (
                            <label
                              key={category.id}
                              className="flex items-center px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <input
                                type="checkbox"
                                className="mr-2"
                                checked={selectedCategories.includes(category.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedCategories(prev => [...prev, category.id]);
                                  } else {
                                    setSelectedCategories(prev => prev.filter(id => id !== category.id));
                                  }
                                }}
                              />
                              <span>{category.name}</span>
                            </label>
                          ))}
                          <div className="px-4 py-2 border-t dark:border-gray-700">
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
                      </div>
                    ) : (
                      <button
                        onClick={action.onClick}
                        className="flex items-center px-3 py-2 space-x-2 text-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700dark:text-rose-300"
                        title={t(action.label.toLowerCase())}
                      >
                        {action.icon}
                        <span>{t(action.label.toLowerCase())}</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div ref={searchRef} className="relative">
                {isSearchOpen ? (
                  <div className="flex items-center bg-gray-50 dark:bg-gray-700 rounded-lg border dark:border-gray-600 p-2 min-w-[300px]">
                    <div className="flex flex-wrap flex-1 gap-2">
                      {tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center px-2 py-1 text-sm text-blue-800 bg-blue-100 rounded-md dark:bg-blue-900 dark:text-blue-200"
                        >
                          {tag.text}
                          <button
                            title={t('removeTag')}
                            onClick={() => removeTag(tag.id)}
                            className="ml-1 hover:text-blue-600 dark:hover:text-blue-400"
                          >
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                      <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={tags.length ? t('pressEnterToAddTag') : t('searchImages')}
                        className="flex-1 min-w-[100px] bg-transparent border-none outline-none dark:text-white"
                      />
                    </div>
                    <Search className="flex-shrink-0 text-gray-400" size={20} />
                  </div>
                ) : (
                  <button
                    onClick={handleSearchClick}
                    className="p-2 text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700dark:text-rose-300"
                    title={t('search')}
                  >
                    <Search size={20} />
                  </button>
                )}
              </div>

              <div className="flex items-center pl-4 space-x-2 border-l dark:border-gray-700">
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

              <div className="flex items-center pl-4 space-x-2 border-l dark:border-gray-700">
                <div 
                  className="relative group"
                  onMouseEnter={() => setIsDropdownOpen(true)}
                  onMouseLeave={() => setIsDropdownOpen(false)}
                >
                  <button className="flex items-center px-3 py-2 space-x-2 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
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
              </div>

              <button
                onClick={async () => {
                  const result = await window.electron.openImageJson();
                  if (!result.success) {
                    console.error(t('configOpenFailed').replace('{error}', result.error || ''));
                  }
                }}
                className="p-2 text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700dark:text-rose-300"
                title={t('openConfig')}
                aria-label={t('openConfig')}
              >
                <FileJson className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700dark:text-rose-300"
                title={t('settings')}
              >
                <SettingsIcon size={20} />
              </button>

              <div ref={filterRef} className="relative">
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={`p-2 rounded-lg ${
                    isFilterOpen || Object.values(filterOptions).some(v => Array.isArray(v) ? v.length > 0 : v !== null)
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  title={t('filter')}
                >
                  <div className="relative">
                    <FilterIcon size={20} />
                    {(() => {
                      const count = filterColors.length +
                        filterOptions.ratio.length +
                        filterOptions.formats.length +
                        (filterOptions.rating !== null ? 1 : 0);
                      return count > 0 ? (
                        <div className="absolute -top-2 -right-2 flex items-center justify-center w-4 h-4 text-[10px] text-white bg-red-500 rounded-full">
                          {count}
                        </div>
                      ) : null;
                    })()}
                  </div>
                </button>

                {filterPopup()}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Toolbar;