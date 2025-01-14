const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  readDirectory: (path) => ipcRenderer.invoke('read-directory', path),
  readFileMetadata: (path) => ipcRenderer.invoke('read-file-metadata', path),
  loadImagesFromJson: (filename) => ipcRenderer.invoke('load-images', filename),
  showOpenDialog: () => ipcRenderer.invoke('show-open-dialog'),
  saveImagesToJson: (images) => ipcRenderer.invoke('save-images', images),
  openImageJson: () => ipcRenderer.invoke('open-image-json'),
}); 