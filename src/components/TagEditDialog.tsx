import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useLocale } from '../contexts/LanguageContext';

interface TagEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newTag: string) => void;
  initialTag: string;
}

const TagEditDialog: React.FC<TagEditDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  initialTag,
}) => {
  const { t } = useLocale();
  const [tagValue, setTagValue] = useState(initialTag);

  useEffect(() => {
    setTagValue(initialTag);
  }, [initialTag]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tagValue.trim()) {
      onConfirm(tagValue.trim());
      onClose();
    }
  };

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
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">{t('editTagTitle')}</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={tagValue}
            onChange={(e) => setTagValue(e.target.value)}
            className="px-3 py-2 mb-4 w-full text-gray-900 bg-white rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={t('enterTagName')}
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 rounded-md dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
            >
              {t('confirm')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TagEditDialog; 