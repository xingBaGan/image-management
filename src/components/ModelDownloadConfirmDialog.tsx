import React from 'react';
import { X } from 'lucide-react';
import { useLocale } from '../contexts/LanguageContext';

interface ModelDownloadConfirmDialogProps {
  isOpen: boolean;
  modelName: string;
  progress: number;
  isDownloading: boolean;
  file?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

const ModelDownloadConfirmDialog: React.FC<ModelDownloadConfirmDialogProps> = ({
  isOpen,
  modelName,
  progress,
  isDownloading,
  file,
  onCancel,
  onConfirm,
}) => {
  const { t } = useLocale();

  if (!isOpen) return null;

  return (
    <div className="flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-50">
      <div className="relative p-6 w-full max-w-md bg-white rounded-lg dark:bg-gray-800">
        <button
          onClick={onCancel}
          disabled={isDownloading}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 disabled:opacity-40 dark:text-blue-300 dark:hover:text-gray-200"
          title={t('closeDialog')}
          aria-label={t('closeDialog')}
        >
          <X size={20} />
        </button>
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
          {t('modelDownloadRequiredTitle')}
        </h2>
        <p className="mb-4 text-gray-500 dark:text-gray-400">
          {t('modelDownloadRequiredMessage', { model: modelName })}
        </p>

        {isDownloading && (
          <div className="mb-5 space-y-2">
            <div className="flex justify-between text-sm text-gray-700 dark:text-gray-200">
              <span>{t('modelDownloading', { model: modelName })}</span>
              <span>{progress}%</span>
            </div>
            <div className="overflow-hidden w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className="h-2 rounded-full bg-blue-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            {file && (
              <p className="text-xs text-gray-500 dark:text-gray-400">{file}</p>
            )}
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            disabled={isDownloading}
            className="px-4 py-2 text-gray-700 rounded-md dark:text-white hover:bg-gray-100 disabled:opacity-60 dark:hover:bg-gray-700"
          >
            {t('cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={isDownloading}
            className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:opacity-60"
          >
            {t('download')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModelDownloadConfirmDialog;
