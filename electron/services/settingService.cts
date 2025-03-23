import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { promises as fsPromises } from 'fs';

interface Settings {
  autoTagging: boolean;
  autoColor: boolean;
  ComfyUI_URL: string;
  backgroundUrl: string;
  modelName: string;
}

const getSettingsPath = (): string => {
  return path.join(app.getPath('userData'), 'settings.json');
};

// 加载设置
const loadSettings = async (): Promise<Settings> => {
  try {
    const settingsPath = getSettingsPath();
    if (!fs.existsSync(settingsPath)) {
      const defaultSettings: Settings = {
        autoTagging: true,
        autoColor: false,
        ComfyUI_URL: 'http://localhost:8188',
        backgroundUrl: 'https://pica.zhimg.com/v2-8fe89aff1426d94bf36f8d4e1c25ed32_1440w.jpg',
        modelName: 'wd-v1-4-moat-tagger-v2'
      };
      console.log('不存在文件, 创建文件');
      await fsPromises.writeFile(
        settingsPath,
        JSON.stringify(defaultSettings, null, 2),
        'utf8'
      );
      return defaultSettings;
    }
    const data = await fsPromises.readFile(settingsPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('加载设置失败:', error);
    return {
      autoTagging: false,
      autoColor: false,
      ComfyUI_URL: '',
      backgroundUrl: '',
      modelName: ''
    };
  }
};

// 保存设置
const saveSettings = async (settings: Settings): Promise<boolean> => {
  try {
    const settingsPath = getSettingsPath();
    await fsPromises.writeFile(
      settingsPath,
      JSON.stringify(settings, null, 2),
      'utf8'
    );
    return true;
  } catch (error) {
    console.error('保存设置失败:', error);
    return false;
  }
};

const getComfyURL = async (): Promise<string | undefined> => {
  const settings = await loadSettings();
  if (settings.ComfyUI_URL) {
    return settings.ComfyUI_URL;
  }
  return undefined;
};

const getModelName = async (): Promise<string | undefined> => {
  const settings = await loadSettings();
  if (settings.modelName) {
    return settings.modelName;
  }
  return undefined;
};

export {
  getComfyURL,
  getModelName,
  loadSettings,
  saveSettings,
  Settings
}; 