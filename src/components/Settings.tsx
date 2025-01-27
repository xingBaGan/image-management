import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = useSettings();
  const [comfyUrl, setComfyUrl] = useState('');
  const [autoTagging, setAutoTagging] = useState(false);
  const [backgroundUrl, setBackgroundUrl] = useState('');

  useEffect(() => {
    if (isOpen) {
      setComfyUrl(settings.ComfyUI_URL);
      setAutoTagging(settings.autoTagging);
      setBackgroundUrl(settings.backgroundUrl);
    }
  }, [isOpen, settings]);

  const handleSave = async () => {
    try {
      await updateSettings({
        ComfyUI_URL: comfyUrl,
        autoTagging: autoTagging,
        backgroundUrl: backgroundUrl
      });
      onClose();
    } catch (error) {
      console.error('保存设置失败:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-50">
      <div className="relative p-6 w-full max-w-md bg-white rounded-lg shadow-xl dark:bg-gray-800">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          title="关闭"
        >
          <X size={20} />
        </button>

        <h2 className="mb-4 text-xl font-semibold dark:text-white">设置</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              ComfyUI 服务器地址
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
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              背景图片URL
            </label>
            <input
              type="text"
              value={backgroundUrl}
              onChange={(e) => setBackgroundUrl(e.target.value)}
              placeholder="输入背景图片URL"
              className="px-3 py-2 w-full rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              自动打标
            </label>
            <input
              type="checkbox"
              checked={autoTagging}
              onChange={(e) => setAutoTagging(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 rounded border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <div className="flex justify-end mt-6 space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 