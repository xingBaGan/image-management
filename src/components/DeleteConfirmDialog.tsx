import React from 'react';
import { useLocale } from '../contexts/LanguageContext';

interface DeleteConfirmDialogProps {
  onCancel: () => void;
  onConfirm: () => void;
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({ onCancel, onConfirm }) => {
  const { t } = useLocale();

  return (
    <div className="flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-50">
      <div className="relative p-6 w-80 bg-white rounded-lg dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          {t('deleteConfirmTitle')}
        </h3>
        <p className="mb-6 text-gray-600dark:text-rose-300">
          {t('deleteConfirmMessage')}
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 rounded-md dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {t('cancel')}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-white bg-red-500 rounded-md hover:bg-red-600"
          >
            {t('delete')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmDialog; 