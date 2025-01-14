const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  readDirectory: (path) => ipcRenderer.invoke('read-directory', path),
  readFileMetadata: (path) => ipcRenderer.invoke('read-file-metadata', path),
  loadImagesFromJson: (jsonPath) => ipcRenderer.invoke('load-images-from-json', jsonPath),
  showOpenDialog: () => ipcRenderer.invoke('show-open-dialog'),
  saveImagesToJson: (images) => ipcRenderer.invoke('save-images-to-json', images)
}); 