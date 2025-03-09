const chokidar = require('chokidar');
const { loadImagesData, saveImagesAndCategories } = require('./FileService.cjs');
const { notifyAllWindows, getReadableFilePath } = require('../utils/index.cjs');
const { logger } = require('./logService.cjs');
const { processDirectoryFiles } = require('./mediaService.cjs');
const { join } = require('path');
const path = require('path');
const fs = require('fs');

const QUEUE_TIMEOUT = 600;
class WatchService {
  constructor() {
    this.watchers = new Map();
    this.changeQueue = new Map(); // 存储待处理的变更
    this.processingQueue = false; // 标记是否正在处理队列
    this.queueTimeout = null;
  }
  // 每次初始化，都同步文件夹内容
  async syncFolderContent(folderPath) {
    const { images, categories } = await loadImagesData();
    let [newImages, category] = await processDirectoryFiles(folderPath, null);
    if (!newImages.length) return;
    // 更新
    newImages = newImages.map(it => ({
      ...it,
      categories: [...new Set([...it?.categories, category?.id])]
    }));
    category.images = [...new Set([...new Set(category?.images), ...newImages.map(it => it.id)])];
    category.count = category.images.length;
    saveImagesAndCategories([...images.filter(it => !newImages.some(newImg => newImg.id === it.id)), ...newImages], [...categories.filter(it => it.id !== category.id), category]);
  }

  // 更新监听的文件夹
  async updateWatchers(folders) {
    logger.info('更新监听的文件夹', folders);
    try {
      // 停止所有不在新列表中的监听器
      for (const [path, watcher] of this.watchers.entries()) {
        if (!folders.includes(path)) {
          await watcher.close();
          this.watchers.delete(path);
          logger.info(`停止监听文件夹: ${path}`);
        }
      }

      // 添加新的监听器
      for (const folder of folders) {
        if (!this.watchers.has(folder) && folder) {
          const watcher = this.createWatcher(folder);
          this.watchers.set(folder, watcher);
          logger.info(`开始监听文件夹: ${folder}`);
        }
      }
      // 同步文件夹内容
      for (const folder of folders) {
        await this.syncFolderContent(folder);
      }
    } catch (error) {
      logger.error('更新文件夹监听器失败:', error);
    }
  }

  // 添加新的处理队列方法
  async processChangeQueue() {
    if (this.processingQueue) return;
    this.processingQueue = true;

    try {
      // 按文件夹分组处理变更
      for (const [folderPath, changes] of this.changeQueue.entries()) {
        const { images, categories } = await loadImagesData();
        const category = this.getWatchCategory(folderPath);
        
        let allNewImages = [];
        // 处理新增文件
        const addedFiles = changes.filter(c => c.type === 'add');
        if (addedFiles.length > 0) {
          for (const change of addedFiles) {
            const [newImages] = await processDirectoryFiles(change.path, null);
            allNewImages = [...allNewImages, ...newImages];
          }
          
          allNewImages = allNewImages.map(it => ({
            ...it,
            categories: [...new Set([...it.categories, category.id])]
          }));
          
          category.images = [...new Set([...category.images, ...allNewImages.map(it => it.id)])];
          
          await this.handleFileChange({
            type: 'add',
            newImages: allNewImages,
            category
          });
        }

        let deletedImages = [];
        // 处理删除文件
        const removedFiles = changes.filter(c => c.type === 'unlink');
        if (removedFiles.length > 0) {
          deletedImages = removedFiles.map(change => 
            images.find(it => getReadableFilePath(it.path) === change.path)
          ).filter(Boolean);

          if (deletedImages.length > 0) {
            category.images = category.images.filter(
              it => !deletedImages.some(img => img.id === it)
            );
            
            await this.handleFileChange({
              type: 'remove',
              newImages: deletedImages,
              category
            });
          }
        }

        // 更新数据
        category.count = category.images.length;
        const updatedImages = [...images.filter(it => 
          !allNewImages?.some(newImg => newImg.id === it.id) && 
          !deletedImages?.some(delImg => delImg.id === it.id)
        ), ...allNewImages];
        
        saveImagesAndCategories(
          updatedImages,
          [...categories.filter(it => it.id !== category.id), category]
        );
      }
    } finally {
      this.changeQueue.clear();
      this.processingQueue = false;
    }
  }

  // 添加变更到队列
  queueChange(path, type) {
    const folderPath = this.inWatcherPath(path);
    if (!folderPath) return;

    if (!this.changeQueue.has(folderPath)) {
      this.changeQueue.set(folderPath, []);
    }
    this.changeQueue.get(folderPath).push({ type, path });

    // 清除之前的定时器
    if (this.queueTimeout) {
      clearTimeout(this.queueTimeout);
    }

    // 设置新的定时器，1秒后处理队列
    this.queueTimeout = setTimeout(() => {
      this.processChangeQueue();
    }, QUEUE_TIMEOUT);
  }

  // 创建单个文件夹的监听器
  createWatcher(folderPath) {
    const supportedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
    const folderPathRegex = join(folderPath, `*.{${supportedExtensions.join(',')}}`).replace(/\\/g, '/');
    
    const watcher = chokidar.watch(folderPath, {
      persistent: true,
      ignoreInitial: true,
      depth: 1,
      ignorePermissionErrors: true,
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100
      },
    });

    watcher
      .on('add', path => {
        this.queueChange(path, 'add');
      })
      .on('unlink', path => {
        this.queueChange(path, 'unlink');
      })
      .on('error', error => {
        logger.error(`监听错误: ${error}`);
      });

    return watcher;
  }

  // 处理文件变化
  async handleFileChange(data) {
    try {
      const { type, newImages, category } = data;

      // 通知渲染进程更新数据
      notifyAllWindows('folder-content-changed', {
        type,
        newImages,
        category
      });
    } catch (error) {
      logger.error('处理文件变化失败:', error);
    }
  }

  // 关闭所有监听器
  async closeAll() {
    for (const watcher of this.watchers.values()) {
      await watcher.close();
    }
    this.watchers.clear();
  }

  // 获取所有监听的文件夹
  getWatcherPaths() {
    return Array.from(this.watchers.keys()).map(_path => path.normalize(_path).replace(/\\/g, '/'));
  }

  // 'K:/dataset/folder_test'
  inWatcherPath(path) {
    const _path = path.replace(/\\/g, '/');
    const watcherPaths = this.getWatcherPaths();
    return watcherPaths.find(watcherPath => _path.startsWith(watcherPath));
  }

  getWatchCategory(path) {
    const inWatcherPath = this.inWatcherPath(path);
    const { categories } = loadImagesData();
		const category = categories.find(_category => _category?.folderPath?.replace(/\\/g, '/') === inWatcherPath);
    return category;
  }

  async copyFileToCategoryFolder(filePath, currentCategory) {
    if (!currentCategory || !currentCategory.folderPath) return;
    const categoryFolderPath = currentCategory.folderPath;
    fs.copyFileSync(filePath, path.join(categoryFolderPath, path.basename(filePath)));
  }
}

module.exports = new WatchService(); 