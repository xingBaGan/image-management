import React, { useState, useEffect } from 'react';
import { X, Copy, Trash } from 'lucide-react';
import { useLocale } from '../contexts/LanguageContext';
import { toast } from 'react-toastify';
import { isArrayOfString } from '../utils';

interface MediaTagsProps {
  tags: string[];
  mediaId: string;
  onTagsUpdate: (mediaId: string, newTags: string[]) => void;
  showCopyButton?: boolean;
  showClearButton?: boolean;
}

const MediaTags: React.FC<MediaTagsProps> = ({
  tags,
  mediaId,
  onTagsUpdate,
  showCopyButton = false,
  showClearButton = false,
}) => {
  const { t } = useLocale();
  const [selectedTags, setSelectedTags] = useState<string[]>(tags);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    setSelectedTags(tags);
  }, [tags]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      const newTag = inputValue.trim();
      if (!selectedTags.includes(newTag)) {
        const newTags = new Set([...selectedTags, newTag]);
        setSelectedTags(Array.from(newTags));
        onTagsUpdate(mediaId, Array.from(newTags));
      }
      setInputValue('');
    } else if (e.key === 'Backspace' && !inputValue && selectedTags.length > 0) {
      // 当输入框为空且按下退格键时，删除最后一个标签
      const newTags = selectedTags.slice(0, -1);
      setSelectedTags(newTags);
      onTagsUpdate(mediaId, newTags);
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = selectedTags.filter(tag => tag !== tagToRemove);
    setSelectedTags(newTags);
    onTagsUpdate(mediaId, newTags);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text');
    try {
      const parsedTags = JSON.parse(pastedText);
      if (isArrayOfString(parsedTags)) {
        const newTags = new Set([...selectedTags, ...parsedTags]);
        setSelectedTags(Array.from(newTags));
        onTagsUpdate(mediaId, Array.from(newTags));
        toast.info(t('pasteTagsSuccess'), {
          position: 'bottom-right',
        });
        setInputValue('');
      }
    } catch (error) {
      // Invalid JSON, do nothing
    }
  }
  return (
    <div className="w-full p-2 bg-gray-50 dark:bg-gray-800 rounded-lg min-h-[8rem] bg-white/30 backdrop-blur-md dark:bg-gray-800/30 " onPaste={handlePaste}>
      <div className="flex overflow-y-auto relative flex-wrap gap-2 mb-2 h-40 tags-container">
        {selectedTags.map((tag, index) => (
          <div
            key={index}
            className="flex gap-1 items-center px-2 py-1 h-7 text-sm text-blue-800 bg-blue-100 rounded-full dark:bg-blue-900 dark:text-blue-200 group"
          >
            <span>{tag}</span>
            <button
              onClick={() => removeTag(tag)}
              className="opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-500 dark:hover:text-red-400 focus:outline-none"
              aria-label={t('deleteTag', { tag })}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      {showCopyButton && (
        <button
          onClick={() => {
            navigator.clipboard.writeText(JSON.stringify(selectedTags));
            toast.info(t('copyTagsSuccess'), {
              position: 'bottom-right',
            });
          }}
          className="fixed z-10 bottom-1 right-1 p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          aria-label={t('copyTags')}
          title={t('copyTags')}
        >
          <Copy size={16} />
        </button>
      )}
      {showClearButton && (
        <button
          onClick={() => {
            setSelectedTags([]);
            onTagsUpdate(mediaId, []);
          }}
          className="fixed right-1 bottom-1 p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
          aria-label={t('clearTags')}
          title={t('clearTags')}
        >
          <Trash size={16} />
        </button>
      )}
     <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleInputKeyDown}
        placeholder={t('tagInput')}
        className="p-1 mt-1 w-full text-sm placeholder-gray-500 text-gray-700 bg-transparent outline-none border-t-1 dark:text-blue-300 dark:placeholder-gray-400"
      />
    </div>
  );
};

export default MediaTags; 