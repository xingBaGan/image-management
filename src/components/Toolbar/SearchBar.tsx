import React, { useRef, useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useLocale } from '../../contexts/LanguageContext';
import { getTagFrequency, TagFrequency } from '../../services/tagService';

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
  const [tagOptions, setTagOptions] = useState<TagFrequency[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getTagFrequency({ sortDirection: 'desc', limit: 30 }).then(setTagOptions);
  }, []);

  // 只展示未被选中的全部 tagOptions
  const filteredOptions = tagOptions;
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
      setShowSuggestions(false);
      onSearch([]);
      setSelectedTags([]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (tag: string) => {
    let newSelectedTags = selectedTags;
    if (newSelectedTags.includes(tag)) {
      newSelectedTags = newSelectedTags.filter(t => t !== tag);
      setSelectedTags(newSelectedTags);
      onSearch(Array.from(new Set([...newSelectedTags, ...tags])));
      setTags(tags.filter(t => t !== tag));
    } else {
      newSelectedTags = Array.from(new Set([...selectedTags, tag]));
      setSelectedTags(newSelectedTags);
      onSearch(Array.from(new Set([...newSelectedTags, ...tags])));
    }
  };

  const removeTag = (tag: string) => {
    const newTags = tags.filter(t => t !== tag);
    setTags(newTags);
    onSearch(newTags);
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  const hiddenOthers = tags.length >= 2;
  return (
    <div ref={searchRef} className="relative">
      {isSearchOpen ? (
        <div className="flex items-center bg-gray-50 dark:bg-gray-700 rounded-lg border dark:border-gray-600 p-2 min-w-[300px]">
          <div 
            className="flex overflow-y-hidden overflow-x-auto flex-1 gap-2 max-h-[30px] max-w-[300px] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent dark:scrollbar-thumb-gray-700 dark:scrollbar-track-transparent"
            onWheel={e => {
              e.preventDefault();
              const container = e.currentTarget;
              const scrollAmount = e.deltaY > 0 ? 100 : -100;
              container.scrollLeft += scrollAmount;
            }}
          >
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-1 text-sm text-blue-800 bg-blue-100 rounded-md dark:bg-blue-900 dark:text-blue-200"
              >
                {tag}
                <button
                  title={t("removeTag")}
                  onClick={() => removeTag(tag)}
                  className="ml-1 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
            <div className={`flex-1 min-w-[100px]`}>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleInputKeyDown}
                placeholder={tags.length ? t("pressEnterToAddTag") : t("searchImages")}
                className="w-full bg-transparent border-none outline-none dark:text-white"
                onFocus={() => setShowSuggestions(true)}
                autoComplete="off"
              />
            </div>
            <div className={`flex items-center ${hiddenOthers ? 'hidden' : ''}`}>
              <span className="mr-2 text-xs text-gray-400 dark:text-gray-500">{t("escapeToExit")}</span>
              <Search className="flex-shrink-0 text-gray-400" size={20} />
            </div>
          </div>
          {/* flex流式布局建议列表，每行约4个，无横向滚动条 */}
          {showSuggestions && filteredOptions.length > 0 && (
            <ul
              className="flex flex-wrap gap-2 overflow-y-auto absolute top-8 z-10 mt-1 w-[60vw] h-auto rounded-xl border-none shadow-none bg-white/70 dark:bg-gray-800/70 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent dark:scrollbar-thumb-gray-700 dark:scrollbar-track-transparent"
              style={{ minWidth: 200 }}
              tabIndex={-1}
              onMouseDown={e => e.preventDefault()}
            >
              {filteredOptions.map((option) => (
                <li
                  key={option.name}
                  className={`
                      flex
                      justify-between 
                      items-center
                      px-3
                      py-1 whitespace-nowrap rounded-full border border-gray-200 transition cursor-pointer
                     hover:bg-blue-100 dark:hover:bg-blue-900 dark:border-gray-700 ${selectedTags.includes(option.name) ? "selected bg-blue-100 dark:bg-blue-900" : ""}`}
                  style={{ flex: "1 1 4%", maxWidth: "14%" }}
                  onMouseDown={() => handleSuggestionClick(option.name)}
                >
                  <span className="overflow-hidden text-sm text-ellipsis">{option.name}</span>
                  <span className="ml-2 text-xs text-gray-400">{option.times}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <button
          ref={searchButtonRef as React.RefObject<HTMLButtonElement>}
          className="p-2 text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-blue-400"
          title={`${t("search")}(Ctrl+F)`}
          onClick={handleSearchClick}
        >
          <Search size={20} />
        </button>
      )}
    </div>
  );
};

export default SearchBar; 