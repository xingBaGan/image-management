import React, { useState, useEffect } from 'react';
import { Tag, X, Plus } from 'lucide-react';
import { useLocale } from '../contexts/LanguageContext';

interface MediaTagsProps {
  tags: string[];
  mediaId: string;
  onTagsUpdate: (mediaId: string, newTags: string[]) => void;
}

const MediaTags: React.FC<MediaTagsProps> = ({
  tags,
  mediaId,
  onTagsUpdate,
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
        const newTags = [...selectedTags, newTag];
        setSelectedTags(newTags);
        onTagsUpdate(mediaId, newTags);
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

  return (
    <div className="w-full p-2 bg-gray-50 dark:bg-gray-800 rounded-lg min-h-[8rem] bg-white/30 backdrop-blur-md dark:bg-gray-800/30 dark:border-gray-700">
      <div className="flex overflow-y-auto flex-wrap gap-2 mb-2 h-40">
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
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleInputKeyDown}
        placeholder={t('tagInput')}
        className="p-1 mt-2 w-full text-sm placeholder-gray-500 text-gray-700 bg-transparent outline-none border-t-1dark:text-rose-300 dark:placeholder-gray-400"
      />
    </div>
  );
};

export default MediaTags; 