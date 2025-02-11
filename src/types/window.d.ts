interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
}

interface Window {
  electron: {
    on: (channel: string, callback: (...args: any[]) => void) => void;
    removeListener: (channel: string, callback: (...args: any[]) => void) => void;
  };
  plugins: {
    on: (channel: string, callback: (...args: any[]) => void) => void;
    removeListener: (channel: string, callback: (...args: any[]) => void) => void;
    getPlugins: () => Promise<Plugin[]>;
    initializePlugin: (pluginId: string) => Promise<void>;
    setupPlugin: (plugin: Plugin) => void;
  };
} 