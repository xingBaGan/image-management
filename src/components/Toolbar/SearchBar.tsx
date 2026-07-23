import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useLocale } from '../../contexts/LanguageContext';
import SearchPalette from './SearchPalette';

const isMac = /Mac|iPhone|iPad/.test(navigator.userAgent);

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
  const [isOpen, setIsOpen] = useState(false);

  const searchShortcut = isMac ? '⌘+K' : 'Ctrl+Space';

  const handleToggle = () => {
    setIsOpen(prev => !prev);
  };

  return (
    <>
      <button
        ref={searchButtonRef as React.RefObject<HTMLButtonElement>}
        className="relative p-2 text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-blue-400"
        title={`${t('search')} (${searchShortcut})`}
        onClick={handleToggle}
        aria-pressed={isOpen}
      >
        <Search size={20} />
        {tags.length > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full" />
        )}
      </button>

      <SearchPalette
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSearch={onSearch}
        tags={tags}
        setTags={setTags}
      />
    </>
  );
};

export default SearchBar;
