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
  saveImageToLocal: (imageBuffer, fileName, ext) => 
    ipcRenderer.invoke('save-image-to-local', imageBuffer, fileName, ext),
  loadSettings: () => ipcRenderer.invoke('load-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  isRemoteComfyUI: () => ipcRenderer.invoke('is-remote-comfyui'),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  tagImage: (imagePath, modelName) => ipcRenderer.invoke('tag-image', imagePath, modelName),
  getMainColor: (imagePath) => ipcRenderer.invoke('get-main-color', imagePath),
  processDirectoryFiles: (dirPath) => ipcRenderer.invoke('process-directory', dirPath),
  openInEditor: (filePath) => ipcRenderer.invoke('open-in-photoshop', filePath),
  downloadUrlImage: (url) => ipcRenderer.invoke('download-url-image', url),
  showInFolder: (filePath) => ipcRenderer.invoke('show-in-folder', filePath),
  onRemoteImagesDownloaded: (callback) => {
    ipcRenderer.on('remote-images-downloaded', (event, result) => callback(result));
  },
  removeRemoteImagesDownloadedListener: (callback) => {
    ipcRenderer.removeListener('remote-images-downloaded', callback);
  }
});