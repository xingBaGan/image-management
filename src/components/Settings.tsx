import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { supportModes } from '../config.mts';
import { useLocale } from '../contexts/LanguageContext';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  messageBox: {
    isOpen: boolean;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
  };
  setMessageBox: (messageBox: {
    isOpen: boolean;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
  }) => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  isOpen,
  onClose,
  messageBox,
  setMessageBox,
 }) => {
  const { settings, updateSettings } = useSettings();
  const { t } = useLocale();
  const [comfyUrl, setComfyUrl] = useState('');
  const [autoTagging, setAutoTagging] = useState(false);
  const [backgroundUrl, setBackgroundUrl] = useState('');
  const [modelName, setModelName] = useState('');
  const [autoColor, setAutoColor] = useState(false);
  const [startImageServer, setStartImageServer] = useState(false);
  useEffect(() => {
    if (isOpen) {
      setComfyUrl(settings.ComfyUI_URL);
      setAutoTagging(settings.autoTagging);
      setBackgroundUrl(settings.backgroundUrl);
      setAutoColor(settings.autoColor);
      setStartImageServer(settings.startImageServer);
    }
  }, [isOpen, settings]);

  const handleSave = async () => {
    try {
      await updateSettings({
        ComfyUI_URL: comfyUrl,
        autoTagging: autoTagging,
        backgroundUrl: backgroundUrl,
        modelName: modelName,
        autoColor: autoColor,
        startImageServer: startImageServer,
      });
      setMessageBox({
        ...messageBox,
        isOpen: true,
        message: t('configSaved'),
        type: 'success'
      });
      onClose();
    } catch (error) {
      console.error(t('saveFailed', { error: String(error) }));
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-50">
        <div className="relative p-6 w-full max-w-md bg-white rounded-lg shadow-xl dark:bg-gray-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title={t('close')}
          >
            <X size={20} />
          </button>

          <h2 className="mb-4 text-xl font-semibold dark:text-white">{t('settingsTitle')}</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700dark:text-blue-300">
                {t('comfyServerUrl')}
              </label>
              <input
                type="text"
                value={comfyUrl}
                onChange={(e) => setComfyUrl(e.target.value)}
                placeholder="http://localhost:8188"
                className="px-3 py-2 w-full rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700dark:text-blue-300">
                {t('backgroundImageUrl')}
              </label>
              <input
                type="text"
                value={backgroundUrl}
                onChange={(e) => setBackgroundUrl(e.target.value)}
                placeholder={t('enterBackgroundUrl')}
                className="px-3 py-2 w-full rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700dark:text-blue-300">
                {t('autoTagging')}
              </label>
              <input
                title={t('autoTagging')}
                type="checkbox"
                checked={autoTagging}
                onChange={(e) => setAutoTagging(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 rounded border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700dark:text-blue-300">
                {t('autoColor')}
              </label>
              <input
                title={t('autoColor')}
                type="checkbox"
                checked={autoColor}
                onChange={(e) => setAutoColor(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 rounded border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700dark:text-blue-300">
                {t('startImageServer')}
              </label>
              <input
                title={t('startImageServer')}
                type="checkbox"
                checked={startImageServer}
                onChange={(e) => setStartImageServer(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 rounded border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700dark:text-blue-300">
                {t('modelName')}
              </label>
              <select
                title={t('modelName')}
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                className="px-3 py-2 w-full rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                {supportModes.map((mode) => (
                  <option key={mode} value={mode}>{mode}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end mt-6 space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700dark:text-blue-300 dark:hover:bg-gray-600"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600"
              >
                {t('save')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Settings; 