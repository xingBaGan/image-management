import React, { useState } from 'react';
import { AppendButtonsProps, Category } from '../../types/index.ts';
import { useLocale } from '../../contexts/LanguageContext';
import { DynamicIcon } from 'lucide-react/dynamic';


interface BulkAction {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  categories?: Category[];
  onSelectCategories?: (categories: string[]) => void;
}

interface BulkActionsProps {
  selectedCount: number;
  bulkActions: BulkAction[];
  appendButtonsProps: AppendButtonsProps[];
  selectedImages: Set<string>;
}

const BulkActions: React.FC<BulkActionsProps> = ({
  selectedCount,
  bulkActions,
  appendButtonsProps,
  selectedImages,
}) => {
  const { t } = useLocale();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  return (
    <>
      <span className="text-sm text-gray-600 dark:text-rose-300">
        {t('selected', { count: selectedCount })}
      </span>
      <div className="h-6 border-l dark:border-gray-600" />
      <div className="flex items-center space-x-2">
        {[...bulkActions, ...appendButtonsProps].map((action, index) => (
          <div key={index} className="relative group">
            {'categories' in action && action.categories ? (
              <div className="relative">
                <button
                  className="flex items-center px-3 py-2 space-x-2 text-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-rose-300"
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
                onClick={() => {
                  if ('eventId' in action) {
                    action.onClick([...selectedImages])
                  } else {
                    action.onClick()
                  }
                }}
                className="flex items-center px-3 py-2 space-x-2 text-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-rose-300"
                title={t(action.label.toLowerCase())}
              >
                {!('eventId' in action) ? action.icon : (
                   <DynamicIcon name={(action.icon || 'camera')} />
                )}
                <span>{t(action.label.toLowerCase())}</span>
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  );
};

export default BulkActions; 