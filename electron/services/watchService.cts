import * as chokidar from 'chokidar';
import { loadImagesData, saveImagesAndCategories } from './FileService.cjs';
import { notifyAllWindows, getReadableFilePath } from '../utils/index.cjs';
import { logger } from './logService.cjs';
import { processDirectoryFiles } from './mediaService.cjs';
import { join } from 'path';
import * as path from 'path';
import * as fs from 'fs';

interface Category {
  id: string;
  images: string[];
  count: number;
  folderPath?: string;
  [key: string]: any;
}

interface Image {
  id: string;
  path: string;
  categories: string[];
  [key: string]: any;
}

interface Change {
  type: 'add' | 'unlink';
  path: string;
}

interface FileChangeData {
  type: 'add' | 'remove';
  newImages: Image[];
  category: Category;
}

const QUEUE_TIMEOUT = 600;

class WatchService {
  private watchers: Map<string, chokidar.FSWatcher>;
  private changeQueue: Map<string, Change[]>;
  private processingQueue: boolean;
  private queueTimeout: NodeJS.Timeout | null;

  constructor() {
    this.watchers = new Map();
    this.changeQueue = new Map();
    this.processingQueue = false;
    this.queueTimeout = null;
  }

  // 每次初始化，都同步文件夹内容
  async syncFolderContent(folderPath: string): Promise<void> {
    const { images, categories } = await loadImagesData();
    let [newImages, category] = await processDirectoryFiles(folderPath, null);
    if (!newImages.length) return;
    // 更新
    newImages = newImages.map(it => ({
      ...it,
      categories: [...new Set([...it?.categories, category?.id])]
    }));
    if (category) {
      category.images = [...new Set([...new Set(category?.images), ...newImages.map(it => it.id)])];
      category.count = category.images.length;
      saveImagesAndCategories(
        [...images.filter(it => !newImages.some(newImg => newImg.id === it.id)), ...newImages],
        [...categories.filter(it => it.id !== category.id), category]
      );
    }
  }

  // 更新监听的文件夹
  async updateWatchers(folders: string[]): Promise<void> {
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
      logger.error('更新文件夹监听器失败:', { error });
    }
  }

  // 添加新的处理队列方法
  private async processChangeQueue(): Promise<void> {
    if (this.processingQueue) return;
    this.processingQueue = true;

    try {
      // 按文件夹分组处理变更
      for (const [folderPath, changes] of this.changeQueue.entries()) {
        const { images, categories } = await loadImagesData();
        const category = this.getWatchCategory(folderPath);
        if (!category) continue;

        let allNewImages: Image[] = [];
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

        let deletedImages: Image[] = [];
        // 处理删除文件
        const removedFiles = changes.filter(c => c.type === 'unlink');
        if (removedFiles.length > 0) {
          deletedImages = removedFiles.map(change => 
            images.find(it => getReadableFilePath(it.path) === change.path)
          ).filter((img): img is Image => img !== undefined);

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
  private queueChange(path: string, type: 'add' | 'unlink'): void {
    const folderPath = this.inWatcherPath(path);
    if (!folderPath) return;

    if (!this.changeQueue.has(folderPath)) {
      this.changeQueue.set(folderPath, []);
    }
    const queue = this.changeQueue.get(folderPath);
    if (queue) {
      queue.push({ type, path });
    }

    // 清除之前的定时器
    if (this.queueTimeout) {
      clearTimeout(this.queueTimeout);
    }

    // 设置新的定时器，600ms后处理队列
    this.queueTimeout = setTimeout(() => {
      this.processChangeQueue();
    }, QUEUE_TIMEOUT);
  }

  // 创建单个文件夹的监听器
  private createWatcher(folderPath: string): chokidar.FSWatcher {
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
  private async handleFileChange(data: FileChangeData): Promise<void> {
    try {
      const { type, newImages, category } = data;

      // 通知渲染进程更新数据
      notifyAllWindows('folder-content-changed', {
        type,
        newImages,
        category
      });
    } catch (error) {
      logger.error('处理文件变化失败:', { error });
    }
  }

  // 关闭所有监听器
  async closeAll(): Promise<void> {
    for (const watcher of this.watchers.values()) {
      await watcher.close();
    }
    this.watchers.clear();
  }

  // 获取所有监听的文件夹
  getWatcherPaths(): string[] {
    return Array.from(this.watchers.keys()).map(_path => path.normalize(_path).replace(/\\/g, '/'));
  }

  // 检查路径是否在监听范围内
  inWatcherPath(path: string): string | undefined {
    const _path = path.replace(/\\/g, '/');
    const watcherPaths = this.getWatcherPaths();
    return watcherPaths.find(watcherPath => _path.startsWith(watcherPath));
  }

  getWatchCategory(path: string): Category | undefined {
    const inWatcherPath = this.inWatcherPath(path);
    const { categories } = loadImagesData();
    return categories.find(_category => _category?.folderPath?.replace(/\\/g, '/') === inWatcherPath);
  }

  async copyFileToCategoryFolder(filePath: string, currentCategory: Category): Promise<void> {
    if (!currentCategory || !currentCategory.folderPath) return;
    const categoryFolderPath = currentCategory.folderPath;
    fs.copyFileSync(filePath, path.join(categoryFolderPath, path.basename(filePath)));
  }
}

// 导出单例实例
export = new WatchService(); 