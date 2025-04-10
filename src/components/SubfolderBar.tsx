import React from 'react';
import { useTranslation } from 'react-i18next';
interface SubfolderBarProps {
  subfolders: {
    id: string;
    name: string;
    count: number;
    thumbnail?: string;
    children?: string[];
  }[];
  onSelectSubfolder?: (name: string) => void;
  isVisible?: boolean;
}

const SubfolderBar: React.FC<SubfolderBarProps> = ({ subfolders, onSelectSubfolder, isVisible = true }) => {
  const { t } = useTranslation();
  return (
    <div 
      className={`overflow-x-auto fixed bottom-0 left-48 right-60 p-2 px-4 bg-gray-300 bg-opacity-50 border-t border-gray-200 dark:bg-gray-800 dark:border-gray-700 rounded-lg
        transform transition-all duration-300 ease-in-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full'}`}
    >
      <div className="flex space-x-4">
        {subfolders.map((folder) => (
          <button
            key={folder.name}
            onClick={() => onSelectSubfolder?.(folder.id)}
            className="overflow-hidden flex-shrink-0 w-48 rounded border-gray-700 shadow-md transition-all duration-200 border-1 group"
          >
            <div className="relative w-full h-24">
              {folder.thumbnail ? (
                <img
                  src={folder.thumbnail}
                  alt={folder.name}
                  className="object-cover w-full h-full opacity-90"
                />
              ) : (
                <div className="flex justify-center items-center w-full h-full">
                  <div className="w-12 h-12 rounded-full dark:bg-gray-700" />
                </div>
              )}
            </div>
            <div className="p-3 border-t border-gray-700">
              <h3 className="font-mono text-sm truncate dark:text-gray-300">
                {folder.name}
              </h3>
              <p className="font-mono text-xs text-gray-900 dark:text-gray-500">
                {folder.count} {folder.count === 1 ? t('item') : t('items')}
                {folder.children && folder.children.length > 0 && (
                  <span className="text-gray-500">
                    ({folder.children.length} {folder.children.length === 1 ? t('subFolder') : t('subFolders')})
                  </span>
                )}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SubfolderBar; 