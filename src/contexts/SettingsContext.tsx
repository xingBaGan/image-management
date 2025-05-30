import React, { createContext, useContext, useState, useEffect } from 'react';


export interface Settings {
  ComfyUI_URL: string;
  autoTagging: boolean;
  backgroundUrl: string;
  modelName: string;
  autoColor: boolean;
  startImageServer: boolean;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
  loadSettings: () => Promise<void>;
  setModelName: (modelName: string) => void;
}
const defaultModel = 'wd-v1-4-moat-tagger-v2';
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>({
    ComfyUI_URL: '',
    autoTagging: false,
    backgroundUrl: '',
    modelName: defaultModel,
    autoColor: false,
    startImageServer: false,
  });

  const loadSettings = async () => {
    try {
      const loadedSettings = await window.electron.loadSettings();
      setSettings({
        ComfyUI_URL: loadedSettings.ComfyUI_URL || '',
        autoTagging: loadedSettings.autoTagging || false,
        backgroundUrl: loadedSettings.backgroundUrl || '',
        modelName: loadedSettings.modelName || defaultModel,
        autoColor: loadedSettings.autoColor || false,
        startImageServer: loadedSettings.startImageServer || false,
      });
    } catch (error) {
      console.error('加载设置失败:', error);
    }
  };

  const updateSettings = async (newSettings: Partial<Settings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      await window.electron.saveSettings(updatedSettings);
      setSettings(updatedSettings);
    } catch (error) {
      console.error('保存设置失败:', error);
    }
  };

  const setModelName = (modelName: string) => {
    setSettings((prevSettings) => ({ ...prevSettings, modelName }));
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loadSettings, setModelName }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}; 