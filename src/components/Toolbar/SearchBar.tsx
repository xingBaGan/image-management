import React, { useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useLocale } from '../../contexts/LanguageContext';

interface SearchBarProps {
  onSearch: (tags: string[]) => void;
  searchButtonRef: React.RefObject<HTMLElement>;
  tags: string[];
  setTags: React.Dispatch<React.SetStateAction<string[]>>;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  searchButtonRef,
  tags,
  setTags,
}) => {
  const { t } = useLocale();
  const [isSearchOpen, setIsSearchOpen] = useState(false || tags.length > 0);
  const [inputValue, setInputValue] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearchClick = () => {
    setIsSearchOpen(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      const newTag = inputValue.trim();
      const newTags = new Set([...tags, newTag]);
      setTags(Array.from(newTags));
      setInputValue('');
      onSearch(Array.from(newTags));
    } else if (e.key === 'Escape') {
      setIsSearchOpen(false);
      setInputValue('');
      setTags([]);
      onSearch([]);
    }
  };

  const removeTag = (tag: string) => {
    const newTags = tags.filter(t => t !== tag);
    setTags(newTags);
    onSearch(newTags);
  };

  return (
    <div ref={searchRef} className="relative">
      {isSearchOpen ? (
        <div className="flex items-center bg-gray-50 dark:bg-gray-700 rounded-lg border dark:border-gray-600 p-2 min-w-[300px]">
          <div className="flex flex-wrap flex-1 gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-1 text-sm text-blue-800 bg-blue-100 rounded-md dark:bg-blue-900 dark:text-blue-200"
              >
                {tag}
                <button
                  title={t('removeTag')}
                  onClick={() => removeTag(tag)}
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
              onKeyDown={handleInputKeyDown}
              placeholder={tags.length ? t('pressEnterToAddTag') : t('searchImages')}
              className="flex-1 min-w-[100px] bg-transparent border-none outline-none dark:text-white"
            />
            <div className="flex items-center">
              <span className="mr-2 text-xs text-gray-400 dark:text-gray-500">{t('escapeToExit')}</span>
              <Search className="flex-shrink-0 text-gray-400" size={20} />
            </div>
          </div>
        </div>
      ) : (
        <button
          ref={searchButtonRef as React.RefObject<HTMLButtonElement>}
          className="p-2 text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-blue-500"
          title={`${t('search')} (Ctrl+F)`}
          onClick={handleSearchClick}
        >
          <Search size={20} />
        </button>
      )}
    </div>
  );
};

export default SearchBar; 