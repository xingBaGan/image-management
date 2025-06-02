import React, { memo, useState } from 'react';
import { Heart, MoreVertical, Check } from 'lucide-react';
import { LocalImageData, AppendButtonsProps } from '../types/index.ts';
import { useLocale } from '../contexts/LanguageContext';

interface ImageItemProps {
  image: LocalImageData;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onDoubleClick: (e: React.MouseEvent) => void;
  onFavorite: (id: string) => void;
  onOpenInEditor: (path: string) => void;
  showInFolder?: (path: string) => void;
  viewMode: 'grid' | 'list';
  gridItemAppendButtonsProps: AppendButtonsProps[];
}

const ImageItem: React.FC<ImageItemProps> = memo(({
  image,
  isSelected,
  onSelect,
  onDoubleClick,
  onFavorite,
  onOpenInEditor,
  showInFolder,
  viewMode,
  gridItemAppendButtonsProps
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const { t } = useLocale();
  if (viewMode === 'list') {
    return (
      <div className="relative w-12 h-12">
        <img
          src={image.path}
          alt={image.name}
          className="object-cover w-12 h-12 rounded"
          onClick={onDoubleClick}
          loading="lazy"
        />
        {isSelected && (
          <div className="flex absolute inset-0 justify-center items-center rounded bg-blue-500/50">
            <Check className="text-white" size={20} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`relative group cursor-pointer will-change-transform transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] transform ${isSelected ? 'ring-4 ring-blue-500 rounded-lg scale-[0.98]' : 'scale-100'
        }`}
      style={{
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        perspective: '1000px',
        WebkitPerspective: '1000px'
      }}
      onClick={onSelect}
      onDoubleClick={onDoubleClick}
    >
              <img
          src={image.path}
          alt={image.name}
          className="w-full h-auto rounded-2xl"
          loading="lazy"
          decoding="async"
        />
        <div
          className={`absolute inset-0 bg-black will-change-opacity transition-opacity duration-300 ease-in-out rounded-lg ${isSelected ? 'bg-opacity-10' : 'bg-opacity-0 group-hover:bg-opacity-10'
            }`}
        />
        {isSelected && (
          <div className="absolute top-4 left-4 p-1 bg-blue-500 rounded-full transition-transform duration-200 ease-in-out transform scale-100">
            <Check className="text-white" size={20} />
          </div>
        )}
        <div className="flex absolute top-4 right-4 z-10 items-center space-x-2 opacity-0 transition-all duration-300 ease-in-out transform translate-y-2 group-hover:opacity-100 group-hover:translate-y-0">
          <button
            title={image.favorite ? t('removeFromFavorites') : t('addToFavorites')}
            onClick={(e) => {
              e.stopPropagation();
              onFavorite(image.id);
            }}
            className={`p-2 mb-2 rounded-full transition-all duration-200 ease-in-out transform hover:scale-110 ${image.favorite
              ? 'bg-red-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
              } backdrop-blur-sm`}
          >
            <Heart size={20} />
          </button>
          <div 
            className="relative pb-2"
            onMouseEnter={() => setShowDropdown(true)}
            onMouseLeave={() => setShowDropdown(false)}
          >
            <button
              title={t('moreOptions')}
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="p-2 text-gray-700 bg-white rounded-full transition-all duration-200 ease-in-out transform hover:scale-110 hover:bg-gray-100"
            >
              <MoreVertical size={20} />
            </button>
            {showDropdown && (
              <div 
                className="absolute right-0 z-10 mt-2 w-32 bg-white rounded-lg ring-1 ring-black ring-opacity-5 shadow-lg dark:bg-gray-800"
                style={{
                  transform: 'translateZ(0)'
                }}
              >
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenInEditor(image.path);
                    setShowDropdown(false);
                  }}
                  className="flex items-center px-4 py-2 text-xs text-center text-gray-700 hover:bg-gray-100 hover:rounded-lg dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  {t('openInEditor')}
                </div>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    showInFolder(image.path);
                    setShowDropdown(false);
                  }}
                  className="flex items-center px-4 py-2 text-xs text-center text-gray-700 hover:bg-gray-100 hover:rounded-lg dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  {t('openContainingFolder')}
                </div>
                {(gridItemAppendButtonsProps || []).map((button) => (
                  <div
                    key={button.eventId}
                    onClick={() => button.onClick([image.id])}
                    className="flex items-center px-4 py-2 text-xs text-center text-gray-700 hover:bg-gray-100 hover:rounded-lg dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    {button.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="absolute right-0 bottom-0 left-0 p-4 bg-gradient-to-t from-black to-transparent rounded-2xl opacity-0 backdrop-blur-sm transition-all duration-300 ease-in-out transform translate-y-2 group-hover:opacity-100 group-hover:translate-y-0">
          <h3 className="font-medium text-white truncate">{image.name}</h3>
          <p className="text-sm text-gray-300">
            {new Date(image.dateModified).toLocaleDateString()}
          </p>
        </div>
      </div>
  );
});

export default ImageItem; 