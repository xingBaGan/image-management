import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  readDirectory: (path: string) => ipcRenderer.invoke('read-directory', path),
  readFileMetadata: (path: string) => ipcRenderer.invoke('read-file-metadata', path),
}); 