import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useLocale } from '../contexts/LanguageContext';
import MediaTags from './MediaTags';

interface BatchTagDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newTags: string[]) => void;
  numImages: number;
}

const BatchTagDialog: React.FC<BatchTagDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  numImages,
}) => {
  const { t } = useLocale();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTags.length > 0) {
      onConfirm(selectedTags);
    }
  };
  const handleClose = () => {
    onClose();
  };
  if (!isOpen) return null;

  return (
    <div className="overflow-y-auto fixed inset-0 z-10 batch-tag-dialog">
      <div className="flex justify-center items-end px-4 pt-4 pb-20 min-h-screen text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className="inline-block overflow-hidden text-left align-bottom bg-white rounded-lg transition-all transform shadow-xxl sm:my-8 sm:w-full sm:max-w-lg sm:align-middle" role="dialog" aria-modal="true" aria-labelledby="modal-headline">
          <div className="px-4 pt-5 pb-4 bg-gray-200">
            <div className="sm:flex sm:items-start textarea">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg font-medium leading-6 text-gray-900" id="modal-headline">
                  {t('batchTagImages', { count: numImages })}
                </h3>
                <div className="mt-4">
                  <MediaTags
                    tags={selectedTags}
                    mediaId={''}
                    onTagsUpdate={(mediaId, newTags) => setSelectedTags(newTags)}
                    showClearButton={true}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="px-4 py-3 bg-gray-50 sm:flex sm:flex-row-reverse sm:px-6 dialog-footer">
            <button
              type="button"
              disabled={selectedTags.length === 0}
              className={`inline-flex w-full justify-center rounded-md border border-transparent px-4 py-2 text-base font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${
                selectedTags.length === 0
                  ? 'cursor-not-allowed bg-gray-400'
                  : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
              }`}
              onClick={handleSubmit}
            >
              {t('batchTag')}
            </button>
            <button
              type="button"
              className="inline-flex justify-center px-4 py-2 mt-3 w-full text-base font-medium text-gray-700 bg-white rounded-md border border-gray-300 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={handleClose}
            >
              {t('cancel')}
            </button>
          </div>
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              className="text-gray-400 bg-white rounded-md hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={handleClose}
            >
              <span className="sr-only">{t('close')}</span>
              <X className="w-6 h-6" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchTagDialog; 