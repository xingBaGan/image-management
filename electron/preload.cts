import { contextBridge, ipcRenderer } from 'electron';
import { Category, LocalImageData } from './dao/type.cjs';
const parseArgs = (args: any[]): any[] => {
  return [...args].map(arg => JSON.parse(arg));
}

// 暴露给渲染进程的 electron API
contextBridge.exposeInMainWorld('electron', {
  // =============== 窗口控制相关 ===============
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),
  onMaximize: (callback: () => void) => ipcRenderer.on('window-maximized', callback),
  onUnmaximize: (callback: () => void) => ipcRenderer.on('window-unmaximized', callback),
  removeMaximize: (callback: () => void) => ipcRenderer.removeListener('window-maximized', callback),
  removeUnmaximize: (callback: () => void) => ipcRenderer.removeListener('window-unmaximized', callback),

  // =============== 文件操作相关 ===============
  readDirectory: (path: string) => ipcRenderer.invoke('read-directory', path),
  readFileMetadata: (path: string) => ipcRenderer.invoke('read-file-metadata', path),
  readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),
  deleteFile: (filePath: string) => ipcRenderer.invoke('delete-file', filePath),
  showInFolder: (filePath: string) => ipcRenderer.invoke('show-in-folder', filePath),
  openInEditor: (filePath: string) => ipcRenderer.invoke('open-in-photoshop', filePath),
  isReadFromDB: () => ipcRenderer.invoke('is-read-from-db'),

  // =============== 图片数据管理相关 ===============
  loadImagesFromJson: () => ipcRenderer.invoke('load-images-from-json'),
  saveImagesToJson: (images: any[], categories: any[]) => 
    ipcRenderer.invoke('save-images-to-json', images, categories),
  openImageJson: () => ipcRenderer.invoke('open-image-json'),
  saveImageToLocal: (imageBuffer: Buffer, fileName: string, ext: string) => 
    ipcRenderer.invoke('save-image-to-local', imageBuffer, fileName, ext),
  tagImage: (imagePath: string, modelName: string) => ipcRenderer.invoke('tag-image', imagePath, modelName),
  getMainColor: (imagePath: string) => ipcRenderer.invoke('get-main-color', imagePath),
  downloadUrlImage: (url: string) => ipcRenderer.invoke('download-url-image', url),

  // =============== 分类管理相关 ===============
  saveCategories: (categories: any[]) => ipcRenderer.invoke('save-categories', categories),
  processDirectoryFiles: (dirPath: string, currentCategory: any = {}) => 
    ipcRenderer.invoke('process-directory', dirPath, currentCategory),
  copyFileToCategoryFolder: (filePath: string, currentCategory: any) => 
    ipcRenderer.invoke('copy-file-to-category-folder', filePath, currentCategory),
  categoryAPI: {
    addCategory: (newCategory: Category, images: LocalImageData[], categories: Category[]) => 
      ipcRenderer.invoke('add-category', newCategory, images, categories),
    
    renameCategory: (categoryId: string, newName: string, categories: Category[]) => 
      ipcRenderer.invoke('rename-category', categoryId, newName, categories),
    
    deleteCategory: (categoryId: string, images: LocalImageData[], categories: Category[]) => 
      ipcRenderer.invoke('delete-category', categoryId, images, categories),
    
    addToCategory: (selectedImages: Set<string>, selectedCategories: string[], images: LocalImageData[], categories: Category[]) => 
      ipcRenderer.invoke('add-to-category', selectedImages, selectedCategories, images, categories),
    
    importFolderFromPath: (folderPath: string, images: LocalImageData[], categories: Category[]) => 
      ipcRenderer.invoke('import-folder-from-path', folderPath, images, categories),
  },
  imageAPI: {
    toggleFavorite: (id: string, images: LocalImageData[], categories: Category[]) => 
      ipcRenderer.invoke('toggle-favorite', id, images, categories),
    addImages: (newImages: LocalImageData[], currentImages: LocalImageData[], categories: Category[], currentSelectedCategory: Category) => 
      ipcRenderer.invoke('add-images', newImages, currentImages, categories, currentSelectedCategory),
    bulkDeleteSoft: (selectedImages: Set<string>, images: LocalImageData[], categories: Category[]) => 
      ipcRenderer.invoke('bulk-delete-soft', selectedImages, images, categories),
    bulkDeleteHard: (selectedImages: Set<string>, images: LocalImageData[], categories: Category[]) => 
      ipcRenderer.invoke('bulk-delete-hard', selectedImages, images, categories),
    bulkDeleteFromCategory: (selectedImages: Set<string>, categories: Category[], currentSelectedCategory: Category) => 
      ipcRenderer.invoke('bulk-delete-from-category', selectedImages, categories, currentSelectedCategory),
    updateTags: (mediaId: string, newTags: string[], images: LocalImageData[], categories: Category[]) => 
      ipcRenderer.invoke('update-tags', mediaId, newTags, images, categories),
    updateRating: (mediaId: string, rate: number, images: LocalImageData[], categories: Category[]) => 
      ipcRenderer.invoke('update-rating', mediaId, rate, images, categories),
    filterAndSortImages: (mediaList: LocalImageData[], options: any) => 
      ipcRenderer.invoke('filter-and-sort-images', mediaList, options),
    getImageById: (imageId: string) => ipcRenderer.invoke('get-image-by-id', imageId),
  },
  // =============== 设置相关 ===============
  loadSettings: () => ipcRenderer.invoke('load-settings'),
  saveSettings: (settings: any) => ipcRenderer.invoke('save-settings', settings),
  isRemoteComfyUI: () => ipcRenderer.invoke('is-remote-comfyui'),

  // =============== 队列状态相关 ===============
  getQueueStatus: () => ipcRenderer.invoke('get-queue-status'),
  resetQueueProgress: (type: string) => ipcRenderer.invoke('reset-queue-progress', type),
  onQueueUpdate: (callback: (status: any) => void) => {
    ipcRenderer.on('queue-progress-update', (event, status) => callback(status));
  },
  removeQueueUpdateListener: (callback: (status: any) => void) => {
    ipcRenderer.removeListener('queue-progress-update', callback);
  },
  cancelTagging: () => ipcRenderer.invoke('cancel-tagging'),
  cancelColor: () => ipcRenderer.invoke('cancel-color'),

  // =============== 文件夹监听相关 ===============
  openFolderDialog: () => ipcRenderer.invoke('open-folder-dialog'),
  showOpenDialog: () => ipcRenderer.invoke('show-open-dialog'),
  readImagesFromFolder: (folderPath: string) => ipcRenderer.invoke('read-images-from-folder', folderPath),
  updateFolderWatchers: (folders: string[]) => ipcRenderer.invoke('update-folder-watchers', folders),
  onFolderContentChanged: (callback: (data: any) => void) => {
    ipcRenderer.on('folder-content-changed', (event, data) => callback(data));
  },
  removeFolderContentChangedListener: (callback: (data: any) => void) => {
    ipcRenderer.removeListener('folder-content-changed', callback);
  },

  // =============== 远程图片下载相关 ===============
  onRemoteImagesDownloaded: (callback: (result: any) => void) => {
    ipcRenderer.on('remote-images-downloaded', (event, result) => callback(result));
  },
  removeRemoteImagesDownloadedListener: (callback: (result: any) => void) => {
    ipcRenderer.removeListener('remote-images-downloaded', callback);
  },

  // =============== 插件通信相关 ===============
  on: (channel: string, callback: (...args: any[]) => void) => {
    if (channel === 'initialize-plugin') {  // 白名单校验
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
  },
  removeListener: (channel: string, callback: (...args: any[]) => void) => {
    if (channel === 'initialize-plugin') {
      ipcRenderer.removeListener(channel, callback);
    }
  },

  // =============== 环境检查相关 ===============
  checkEnvironment: () => ipcRenderer.invoke('check-environment'),
  installEnvironment: () => ipcRenderer.invoke('install-environment'),
});

// =============== 插件系统相关 API ===============
contextBridge.exposeInMainWorld('plugins', {
  // 获取可用插件列表
  getPlugins: () => ipcRenderer.invoke('get-plugins'),
  
  // 初始化指定插件
  initializePlugin: (pluginId: string) => ipcRenderer.invoke('plugin-setup', pluginId),
  
  // 设置插件
  setupPlugin: (plugin: any) => {
    if (plugin) {
      console.log(`设置插件: ${plugin.name}`);
      // setup 函数会通过 initialize-plugin 事件单独处理
    }
  },
  
  // 插件通信相关方法
  on: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.on(channel, (event, ...args) => callback(...args));
  },
  send: (channel: string, ...args: any[]) => {
    ipcRenderer.send(channel, ...parseArgs(args));
  },
  removeListener: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.removeListener(channel, callback);
  }
}); 