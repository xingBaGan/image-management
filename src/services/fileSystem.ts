interface FileSystemAPI {
  readDirectory: (path: string) => Promise<string[]>;
  readFileMetadata: (path: string) => Promise<any>;
}

declare global {
  interface Window {
    electronAPI: FileSystemAPI;
  }
}

export const readDirectory = async (path: string): Promise<string[]> => {
  if (window.electronAPI) {
    return await window.electronAPI.readDirectory(path);
  }
  throw new Error('Electron API not available');
};

export const readFileMetadata = async (path: string): Promise<any> => {
  if (window.electronAPI) {
    return await window.electronAPI.readFileMetadata(path);
  }
  throw new Error('Electron API not available');
};
