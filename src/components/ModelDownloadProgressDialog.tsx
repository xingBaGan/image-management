import React from 'react';
import { useLocale } from '../contexts/LanguageContext';

interface ModelDownloadProgressDialogProps {
  isOpen: boolean;
  modelName: string;
  progress: number;
  file?: string;
}

const ModelDownloadProgressDialog: React.FC<ModelDownloadProgressDialogProps> = ({
  isOpen,
  modelName,
  progress,
  file,
}) => {
  const { t } = useLocale();

  if (!isOpen) return null;

  return (
    <div className="flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-50">
      <div className="p-6 w-full max-w-md bg-white rounded-lg dark:bg-gray-800">
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
          {t('downloadModel')}
        </h2>
        <div className="space-y-2">
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
      </div>
    </div>
  );
};

export default ModelDownloadProgressDialog;
