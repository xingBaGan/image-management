import React, { useState } from 'react';
import { AppendButtonsProps, Category } from '../../types/index.ts';
import { useLocale } from '../../contexts/LanguageContext';
import { DynamicIcon } from 'lucide-react/dynamic';
import CategoryDropdown from './CategoryDropdown.tsx';

export interface BulkAction {
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
      <span className="text-sm text-gray-600 dark:text-blue-300">
        {t('selected', { count: selectedCount })}
      </span>
      <div className="h-6 border-l dark:border-gray-600" />
      <div className="flex items-center space-x-2">
        {[...bulkActions, ...appendButtonsProps].map((action, index) => (
          <div key={index} className="relative group">
            {'categories' in action && action.categories ? (
              <div className="relative">
                <button
                  className="flex items-center p-2 text-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-blue-400"
                  onClick={() => {
                    const dropdown = document.getElementById(`category-dropdown-${index}`);
                    if (dropdown) {
                      dropdown.classList.toggle('hidden');
                    }
                  }}
                  title={t(action.label.toLowerCase())}
                >
                  {action.icon}
                </button>

                <CategoryDropdown
                  action={action}
                  index={index}
                  selectedCategories={selectedCategories}
                  setSelectedCategories={setSelectedCategories}
                  t={t}
                />
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
                title={t(action.label.toLowerCase())}
                className="flex items-center p-2 text-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-blue-400"
              >
                {!('eventId' in action) ? action.icon : (
                   <DynamicIcon name={(action.icon || 'camera')} />
                )}
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  );
};

export default BulkActions; 