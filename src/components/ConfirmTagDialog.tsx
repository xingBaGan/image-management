import React from 'react';
import { X } from 'lucide-react';
import { useLocale } from '../contexts/LanguageContext';

interface ConfirmTagDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  tagNames: string[];
  numImages: number; 
}

const ConfirmTagDialog: React.FC<ConfirmTagDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  tagNames,
  numImages,
}) => {
  const { t } = useLocale();

  if (!isOpen) return null;

  return (
    <div className="flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-50">
      <div className="relative p-6 w-96 bg-white rounded-lg dark:bg-gray-800">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-rose-400 dark:hover:text-gray-200"
          title={t('closeDialog')}
          aria-label={t('closeDialog')}
        >
          <X size={20} />
        </button>
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
          {t('confirmTagTitle')}
        </h2>
        <p className="mb-6 text-gray-500 dark:text-gray-400">
          {t('confirmTagMessage', { count: numImages, tag: tagNames.join(', ') })}
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 rounded-md dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {t('cancel')}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
          >
            {t('confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmTagDialog; 