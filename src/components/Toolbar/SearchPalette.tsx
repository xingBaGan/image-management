import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, X } from 'lucide-react';
import { useLocale } from '../../contexts/LanguageContext';
import { getTagFrequency, TagFrequency } from '../../services/tagService';
import { resolveCanonicalTagInput } from '../../services/tagTranslationService';

interface SearchPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (tags: string[]) => void;
  tags: string[];
  setTags: React.Dispatch<React.SetStateAction<string[]>>;
}

const SearchPalette: React.FC<SearchPaletteProps> = ({
  isOpen,
  onClose,
  onSearch,
  tags,
  setTags,
}) => {
  const { t } = useLocale();
  const [inputValue, setInputValue] = useState('');
  const [tagOptions, setTagOptions] = useState<TagFrequency[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const latestTagsRef = useRef(tags);
  const latestSelectedTagsRef = useRef<string[]>([]);
  const submitRequestIdRef = useRef(0);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    getTagFrequency({ sortDirection: 'desc', limit: 30 }).then(setTagOptions);
  }, []);

  useEffect(() => {
    latestTagsRef.current = tags;
  }, [tags]);

  useEffect(() => {
    if (isOpen) {
      setShowSuggestions(true);
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      inputRef.current?.blur();
    }
  }, [isOpen]);

  const setSelectedTagsState = (nextSelectedTags: string[]) => {
    latestSelectedTagsRef.current = nextSelectedTags;
    setSelectedTags(nextSelectedTags);
  };

  const setTagsState = (nextTags: string[]) => {
    latestTagsRef.current = nextTags;
    setTags(nextTags);
  };

  const invalidatePendingSubmit = () => {
    submitRequestIdRef.current += 1;
    isSubmittingRef.current = false;
  };

  const handleClose = () => {
    invalidatePendingSubmit();
    setInputValue('');
    setShowSuggestions(false);
    onClose();
  };

  const handleInputKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      if (isSubmittingRef.current) {
        return;
      }

      const submittedInput = inputValue;
      setInputValue('');
      submitRequestIdRef.current += 1;
      const requestId = submitRequestIdRef.current;
      isSubmittingRef.current = true;

      try {
        const newTag = await resolveCanonicalTagInput(submittedInput);
        if (submitRequestIdRef.current !== requestId) {
          return;
        }

        if (!newTag) {
          return;
        }

        const nextTags = Array.from(new Set([...latestTagsRef.current, newTag]));
        setTagsState(nextTags);
        onSearch(nextTags);
        setSelectedTagsState(nextTags);
      } finally {
        if (submitRequestIdRef.current === requestId) {
          isSubmittingRef.current = false;
        }
      }
    } else if (e.key === 'Escape') {
      handleClose();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (tag: string) => {
    invalidatePendingSubmit();
    const currentSelectedTags = latestSelectedTagsRef.current;
    const currentTags = latestTagsRef.current;
    let newSelectedTags = currentSelectedTags;

    if (newSelectedTags.includes(tag)) {
      newSelectedTags = newSelectedTags.filter(item => item !== tag);
      const nextTags = currentTags.filter(item => item !== tag);
      setSelectedTagsState(newSelectedTags);
      setTagsState(nextTags);
      onSearch(nextTags);
    } else {
      newSelectedTags = Array.from(new Set([...currentSelectedTags, tag]));
      setSelectedTagsState(newSelectedTags);
      onSearch(Array.from(new Set([...newSelectedTags, ...currentTags])));
    }
  };

  const removeTag = (tag: string) => {
    invalidatePendingSubmit();
    const currentTags = latestTagsRef.current;
    const currentSelectedTags = latestSelectedTagsRef.current;
    const newTags = currentTags.filter(item => item !== tag);
    setTagsState(newTags);
    onSearch(newTags);
    setSelectedTagsState(currentSelectedTags.filter(item => item !== tag));
  };

  const clearAllTags = () => {
    invalidatePendingSubmit();
    setTagsState([]);
    onSearch([]);
    setSelectedTagsState([]);
    setInputValue('');
  };

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] bg-black/40 backdrop-blur-sm animate-fade-in"
      data-search-palette
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        className="w-full max-w-xl mx-4 animate-scale-in"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-gray-700/60 dark:bg-gray-800/95">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
            <Search className="flex-shrink-0 text-gray-400 dark:text-gray-500" size={22} />
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleInputKeyDown}
              placeholder={tags.length ? t('pressEnterToAddTag') : t('searchImages')}
              className="flex-1 text-lg bg-transparent border-none outline-none placeholder:text-gray-400 dark:text-white dark:placeholder:text-gray-500"
              onFocus={() => setShowSuggestions(true)}
              autoComplete="off"
              data-search-palette
            />
            {tags.length > 0 && (
              <button
                type="button"
                onClick={clearAllTags}
                className="flex-shrink-0 px-2 py-1 text-xs text-gray-500 rounded-md transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
              >
                {t('clearAllTags')}
              </button>
            )}
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 px-5 py-3 border-b border-gray-100 dark:border-gray-700/60">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2.5 py-1 text-sm text-blue-800 bg-blue-100 rounded-full dark:bg-blue-900/60 dark:text-blue-200"
                >
                  {tag}
                  <button
                    type="button"
                    title={t('removeTag')}
                    onClick={() => removeTag(tag)}
                    className="ml-1.5 hover:text-blue-600 dark:hover:text-blue-300"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {showSuggestions && tagOptions.length > 0 && (
            <div className="px-5 py-4 max-h-[40vh] overflow-y-auto">
              <p className="mb-3 text-xs font-medium tracking-wide text-gray-400 uppercase dark:text-gray-500">
                {t('suggestedTags')}
              </p>
              <ul className="flex flex-wrap gap-2">
                {tagOptions.map((option) => (
                  <li
                    key={option.name}
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-full border cursor-pointer transition-colors
                      border-gray-200 hover:bg-blue-50 dark:border-gray-600 dark:hover:bg-blue-900/40
                      ${selectedTags.includes(option.name) ? 'selected bg-blue-100 dark:bg-blue-900/60 border-blue-200 dark:border-blue-700' : ''}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSuggestionClick(option.name);
                    }}
                  >
                    <span className="truncate">{option.name}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{option.times}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="px-5 py-2.5 text-xs text-gray-400 border-t border-gray-100 dark:border-gray-700/60 dark:text-gray-500">
            {t('searchPaletteHint')}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SearchPalette;
