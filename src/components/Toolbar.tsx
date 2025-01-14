import React, { useState, useRef, useEffect } from 'react';
import { Search, Grid, List, SortAsc, SortDesc, X, Menu, Import, FolderOpen, Save, FileJson } from 'lucide-react';
import { ViewMode, SortBy, BulkAction } from '../types';

interface ToolbarProps {
  viewMode: ViewMode;
  sortBy: SortBy;
  sortDirection: 'asc' | 'desc';
  onViewModeChange: (mode: ViewMode) => void;
  onSortChange: (sort: SortBy) => void;
  onSearch: (query: string) => void;
  selectedCount: number;
  bulkActions: BulkAction[];
  onToggleSidebar: () => void;
  onImport: () => void;
  isSidebarOpen: boolean;
}

interface SearchTag {
  id: string;
  text: string;
}

const Toolbar: React.FC<ToolbarProps> = ({
  viewMode,
  sortBy,
  sortDirection,
  onViewModeChange,
  onSortChange,
  onSearch,
  selectedCount,
  bulkActions,
  onToggleSidebar,
  onImport,
  isSidebarOpen,
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [tags, setTags] = useState<SearchTag[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        if (tags.length === 0) {
          setIsSearchOpen(false);
        }
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
      setTags([...tags, newTag]);
      setInputValue('');
      onSearch([...tags.map(tag => tag.text), newTag.text].join(' '));
    }
  };

  const removeTag = (tagId: string) => {
    const newTags = tags.filter(tag => tag.id !== tagId);
    setTags(newTags);
    onSearch(newTags.map(tag => tag.text).join(' '));
  };

  const getSortLabel = () => {
    switch (sortBy) {
      case 'name':
        return 'Name';
      case 'date':
        return 'Date';
      case 'size':
        return 'Size';
      default:
        return 'Sort by';
    }
  };

  return (
    <div className="flex relative justify-between items-center px-6 h-16 bg-white border-b dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-center space-x-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          title={isSidebarOpen ? "收起侧边栏" : "展开侧边栏"}
        >
          <Menu size={20} />
        </button>
        
        <button
          onClick={onImport}
          className="flex items-center px-4 py-2 space-x-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600"
          title="导入图片"
        >
          <Import size={20} />
        </button>

        {selectedCount > 0 ? (
          <>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {selectedCount} selected
            </span>
            <div className="h-6 border-l dark:border-gray-600" />
            <div className="flex items-center space-x-2">
              {bulkActions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className="flex items-center px-3 py-2 space-x-2 text-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"
                >
                  {action.icon}
                  <span>{action.label}</span>
                </button>
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
                      placeholder={tags.length ? "Press Enter to add tag" : "Search images..."}
                      className="flex-1 min-w-[100px] bg-transparent border-none outline-none dark:text-white"
                    />
                  </div>
                  <Search className="flex-shrink-0 text-gray-400" size={20} />
                </div>
              ) : (
                <button
                  onClick={handleSearchClick}
                  className="p-2 text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"
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
              >
                <List size={20} />
              </button>
            </div>

            <div className="flex items-center pl-4 space-x-2 border-l dark:border-gray-700">
              <div className="relative group">
                <button
                  className="flex items-center px-3 py-2 space-x-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {sortDirection === 'asc' ? <SortAsc size={20} /> : <SortDesc size={20} />}
                  <span>Sort by {getSortLabel()}</span>
                </button>
                <div className="hidden absolute left-0 top-full z-50 py-1 mt-1 w-48 bg-white rounded-lg border shadow-lg dark:bg-gray-800 dark:border-gray-700 group-hover:block">
                  <button
                    onClick={() => onSortChange('name')}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      sortBy === 'name' ? 'text-blue-600 dark:text-blue-300' : ''
                    }`}
                  >
                    Name
                  </button>
                  <button
                    onClick={() => onSortChange('date')}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      sortBy === 'date' ? 'text-blue-600 dark:text-blue-300' : ''
                    }`}
                  >
                    Date
                  </button>
                  <button
                    onClick={() => onSortChange('size')}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      sortBy === 'size' ? 'text-blue-600 dark:text-blue-300' : ''
                    }`}
                  >
                    Size
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={async () => {
                const result = await window.electron.openImageJson();
                if (!result.success) {
                  console.error('打开配置文件失败:', result.error);
                }
              }}
              className="p-2 text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"
              title="打开配置文件"
              aria-label="打开配置文件"
            >
              <FileJson className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Toolbar;