const chokidar = require('chokidar');
const { processDirectoryFiles } = require('./mediaService.cjs');
const { loadImagesData } = require('./FileService.cjs');
const { notifyAllWindows } = require('../utils/index.cjs');
const { logger } = require('./logService.cjs');
const { join } = require('path');

class WatchService {
  constructor() {
    this.watchers = new Map();
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
    } catch (error) {
      logger.error('更新文件夹监听器失败:', error);
    }
  }

  // 创建单个文件夹的监听器
  createWatcher(folderPath) {
    const supportedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
    const folderPathRegex = join(folderPath, `*.{${supportedExtensions.join(',')}}`).replace(/\\/g, '/');
    console.log('创建监听器', folderPathRegex);
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
      .on('add', async path => {
        await this.handleFileChange({
          type: 'add',
          path: path
        });
      })
      .on('unlink', async path => {
        await this.handleFileChange({
          type: 'remove',
          path: path
        });
      })
      .on('error', error => {
        logger.error(`监听错误: ${error}`);
      });

    return watcher;
  }

  // 处理文件变化
  async handleFileChange(data) {
    try {
      const { type, path } = data;

      // 通知渲染进程更新数据
      notifyAllWindows('folder-content-changed', {
        type,
        path
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
}

module.exports = new WatchService(); 