interface ElectronAPI {
  loadSettings: () => Promise<{
    ComfyUI_URL?: string;
    [key: string]: any;
  }>;
  saveSettings: (settings: {
    ComfyUI_URL: string;
    [key: string]: any;
  }) => Promise<boolean>;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

export {}; 