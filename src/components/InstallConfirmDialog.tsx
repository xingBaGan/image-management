import React from 'react';
import { useLocale } from '../contexts/LanguageContext';

interface InstallConfirmDialogProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  checkResult: {
    checks: {
      python: boolean;
      pip: boolean;
      venv: boolean;
      models: boolean;
      venvPackages: boolean;
    };
    completeness: number;
  };
}

const InstallConfirmDialog: React.FC<InstallConfirmDialogProps> = ({
  isOpen,
  onCancel,
  onConfirm,
  checkResult
}) => {
  const { t } = useLocale();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4 dark:text-white">
          {t('environmentCheck')}
        </h2>
        <div className="mb-4 space-y-2">
          <p className="text-gray-600 dark:text-gray-300">
            {t('environmentIncomplete')}
          </p>
          <div className="space-y-1">
            {!checkResult.checks.python && (
              <p className="text-red-500">✗ Python 3 {t('notInstalled')}</p>
            )}
            {!checkResult.checks.pip && (
              <p className="text-red-500">✗ pip {t('notInstalled')}</p>
            )}
            {!checkResult.checks.venv && (
              <p className="text-red-500">✗ venv {t('notInstalled')}</p>
            )}
            {!checkResult.checks.venvPackages && (
              <p className="text-red-500">✗ {t('requiredPackages')} {t('notInstalled')}</p>
            )}
            {!checkResult.checks.models && (
              <p className="text-red-500">✗ {t('aiModels')} {t('notInstalled')}</p>
            )}
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            {t('installConfirmMessage')}
          </p>
        </div>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
          >
            {t('cancel')}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {t('install')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallConfirmDialog; 