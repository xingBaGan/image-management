import { ElectronAPI, Plugin } from './index';
declare global {
  interface Window {
    electron: ElectronAPI;
    plugins: PluginAPI
  }
}

export {}; 