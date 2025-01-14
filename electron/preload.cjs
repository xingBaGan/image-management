const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  readDirectory: (path) => ipcRenderer.invoke('read-directory', path),
  readFileMetadata: (path) => ipcRenderer.invoke('read-file-metadata', path),
  loadImagesFromJson: () => ipcRenderer.invoke('load-images-from-json'),
  showOpenDialog: () => ipcRenderer.invoke('show-open-dialog'),
  saveImagesToJson: (images, categories) => 
    ipcRenderer.invoke('save-images-to-json', images, categories),
  openImageJson: () => ipcRenderer.invoke('open-image-json'),
  saveCategories: (categories) => ipcRenderer.invoke('save-categories', categories),
}); 