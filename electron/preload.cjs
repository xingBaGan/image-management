const { contextBridge, ipcRenderer } = require('electron');

const parseArgs = (args) => {
  return [...args].map(arg => JSON.parse(arg));
}

// 暴露给渲染进程的 electron API
contextBridge.exposeInMainWorld('electron', {
  // =============== 窗口控制相关 ===============
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),
  onMaximize: (callback) => ipcRenderer.on('window-maximized', callback),
  onUnmaximize: (callback) => ipcRenderer.on('window-unmaximized', callback),
  removeMaximize: (callback) => ipcRenderer.removeListener('window-maximized', callback),
  removeUnmaximize: (callback) => ipcRenderer.removeListener('window-unmaximized', callback),

  // =============== 文件操作相关 ===============
  readDirectory: (path) => ipcRenderer.invoke('read-directory', path),
  readFileMetadata: (path) => ipcRenderer.invoke('read-file-metadata', path),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  deleteFile: (filePath) => ipcRenderer.invoke('delete-file', filePath),
  showInFolder: (filePath) => ipcRenderer.invoke('show-in-folder', filePath),
  openInEditor: (filePath) => ipcRenderer.invoke('open-in-photoshop', filePath),

  // =============== 图片数据管理相关 ===============
  loadImagesFromJson: () => ipcRenderer.invoke('load-images-from-json'),
  saveImagesToJson: (images, categories, currentSelectedCategory) => 
    ipcRenderer.invoke('save-images-to-json', images, categories, currentSelectedCategory),
  openImageJson: () => ipcRenderer.invoke('open-image-json'),
  saveImageToLocal: (imageBuffer, fileName, ext) => 
    ipcRenderer.invoke('save-image-to-local', imageBuffer, fileName, ext),
  tagImage: (imagePath, modelName) => ipcRenderer.invoke('tag-image', imagePath, modelName),
  getMainColor: (imagePath) => ipcRenderer.invoke('get-main-color', imagePath),
  downloadUrlImage: (url) => ipcRenderer.invoke('download-url-image', url),

  // =============== 分类管理相关 ===============
  saveCategories: (categories) => ipcRenderer.invoke('save-categories', categories),
  processDirectoryFiles: (dirPath, currentCategory = {}) => 
    ipcRenderer.invoke('process-directory', dirPath, currentCategory),
  copyFileToCategoryFolder: (filePath, currentCategory) => 
    ipcRenderer.invoke('copy-file-to-category-folder', filePath, currentCategory),

  // =============== 设置相关 ===============
  loadSettings: () => ipcRenderer.invoke('load-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  isRemoteComfyUI: () => ipcRenderer.invoke('is-remote-comfyui'),

  // =============== 队列状态相关 ===============
  getQueueStatus: () => ipcRenderer.invoke('get-queue-status'),
  resetQueueProgress: (type) => ipcRenderer.invoke('reset-queue-progress', type),
  onQueueUpdate: (callback) => {
    ipcRenderer.on('queue-progress-update', (event, status) => callback(status));
  },
  removeQueueUpdateListener: (callback) => {
    ipcRenderer.removeListener('queue-progress-update', callback);
  },

  // =============== 文件夹监听相关 ===============
  openFolderDialog: () => ipcRenderer.invoke('open-folder-dialog'),
  showOpenDialog: () => ipcRenderer.invoke('show-open-dialog'),
  readImagesFromFolder: (folderPath) => ipcRenderer.invoke('read-images-from-folder', folderPath),
  updateFolderWatchers: (folders) => ipcRenderer.invoke('update-folder-watchers', folders),
  onFolderContentChanged: (callback) => {
    ipcRenderer.on('folder-content-changed', (event, data) => callback(data));
  },
  removeFolderContentChangedListener: (callback) => {
    ipcRenderer.removeListener('folder-content-changed', callback);
  },

  // =============== 远程图片下载相关 ===============
  onRemoteImagesDownloaded: (callback) => {
    ipcRenderer.on('remote-images-downloaded', (event, result) => callback(result));
  },
  removeRemoteImagesDownloadedListener: (callback) => {
    ipcRenderer.removeListener('remote-images-downloaded', callback);
  },

  // =============== 插件通信相关 ===============
  on: (channel, callback) => {
    if (channel === 'initialize-plugin') {  // 白名单校验
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
  },
  removeListener: (channel, callback) => {
    if (channel === 'initialize-plugin') {
      ipcRenderer.removeListener(channel, callback);
    }
  }
});

// =============== 插件系统相关 API ===============
contextBridge.exposeInMainWorld('plugins', {
  // 获取可用插件列表
  getPlugins: () => ipcRenderer.invoke('get-plugins'),
  
  // 初始化指定插件
  initializePlugin: (pluginId) => ipcRenderer.invoke('plugin-setup', pluginId),
  
  // 设置插件
  setupPlugin: (plugin) => {
    if (plugin) {
      console.log(`设置插件: ${plugin.name}`);
      // setup 函数会通过 initialize-plugin 事件单独处理
    }
  },
  
  // 插件通信相关方法
  on: (channel, callback) => {
    ipcRenderer.on(channel, (event, ...args) => callback(...args));
  },
  send: (channel, ...args) => {
    ipcRenderer.send(channel, ...parseArgs(args));
  },
  removeListener: (channel, callback) => {
    ipcRenderer.removeListener(channel, callback);
  }
});