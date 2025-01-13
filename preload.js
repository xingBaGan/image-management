const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  readDirectory: (path) => ipcRenderer.invoke('read-directory', path),
  readFileMetadata: (path) => ipcRenderer.invoke('read-file-metadata', path),
}); 