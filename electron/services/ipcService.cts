import { ipcMain, dialog, shell } from 'electron';
import { promises as fsPromises } from 'fs';
import { generateHashId } from '../utils/index.cjs';
import { getComfyURL } from './settingService.cjs';
import { isReadFromDB } from './checkImageCount.cjs';
import { 
  saveImageToLocal, 
  loadImagesData, 
  getJsonFilePath, 
  deletePhysicalFile, 
  saveImagesAndCategories,
  saveCategories,
  showDialog,
  imageCountManager,
} from './FileService.cjs';
import { 
  getVideoDuration, 
  generateVideoThumbnail,
  processDirectoryFiles 
} from './mediaService.cjs';
import { tagImage, getMainColor, checkEnvironment, installEnvironment } from '../../script/script.cjs';
import { tagQueue, colorQueue } from './queueService.cjs';
import { logger } from './logService.cjs';
import { MAX_IMAGE_COUNT } from '../services/checkImageCount.cjs';
import { Category } from '../dao/type.cjs';

interface LogMeta {
  [key: string]: any;
}
// 检查是否为远程 ComfyUI
const isRemoteComfyUI = async function (): Promise<boolean> {
  const ComfyUI_URL = await getComfyURL();
  return !(ComfyUI_URL?.includes('localhost') || ComfyUI_URL?.includes('127.0.0.1'));
}

const init = (): void => {
  // =============== 视频处理相关 ===============
  ipcMain.handle('get-video-duration', async (event, filePath: string) => {
    if (filePath.startsWith('local-image://')) {
      filePath = decodeURIComponent(filePath.replace('local-image://', ''));
    }
    return await getVideoDuration(filePath);
  });

  ipcMain.handle('generate-video-thumbnail', async (event, filePath: string) => {
    if (filePath.startsWith('local-image://')) {
      filePath = decodeURIComponent(filePath.replace('local-image://', ''));
    }
    return await generateVideoThumbnail(filePath);
  });

  // =============== 文件操作相关 ===============
  ipcMain.handle('open-in-photoshop', async (_, filePath: string) => {
    try {
      const localPath = decodeURIComponent(filePath.replace('local-image://', ''));
      await shell.openPath(localPath)
      return { success: true };
    } catch (error) {
      logger.error('打开 Photoshop 失败:', { error } as LogMeta);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('show-in-folder', async (_, filePath: string) => {
    try {
      const localPath = decodeURIComponent(filePath.replace('local-image://', ''));
      await shell.showItemInFolder(localPath);
      return { success: true };
    } catch (error) {
      logger.error('在文件夹中显示失败:', { error } as LogMeta);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('read-directory', async (event, dirPath: string) => {
    try {
      const files = await fsPromises.readdir(dirPath);
      return files;
    } catch (error) {
      logger.error('读取目录失败:', { error } as LogMeta);
      throw error;
    }
  });

  ipcMain.handle('read-file-metadata', async (event, filePath: string) => {
    try {
      const stats = await fsPromises.stat(filePath);
      return {
        size: stats.size,
        dateCreated: stats.birthtime,
        dateModified: stats.mtime
      };
    } catch (error) {
      logger.error('读取文件元数据失败:', { error } as LogMeta);
      throw error;
    }
  });

  // =============== 图片下载和处理相关 ===============
  ipcMain.handle('download-url-image', async (_, url: string) => {
    try {
      const https = require('https');
      const http = require('http');
      const client = url.startsWith('https') ? https : http;

      // 下载图片数据
      const imageBuffer = await new Promise<Buffer>((resolve, reject) => {
        client.get(url, (res: any) => {
          if (res.statusCode !== 200) {
            reject(new Error(`请求失败: ${res.statusCode}`));
            return;
          }

          const chunks: Buffer[] = [];
          res.on('data', (chunk: Buffer) => chunks.push(chunk));
          res.on('end', () => resolve(Buffer.concat(chunks)));
          res.on('error', reject);
        }).on('error', reject);
      });

      // 处理文件名和扩展名
      const id = generateHashId(url, imageBuffer.length);
      const fileNameMatch = url.match(/filename=([^&]+)/);
      let fileName = fileNameMatch ? fileNameMatch[1] : id;
      const contentType = await new Promise<string>((resolve) => {
        client.get(url, (res: any) => {
          resolve(res.headers['content-type'] || 'image/jpeg');
        });
      });
      const ext = contentType.split('/').pop() || 'jpg';
      
      if (!fileName.includes('.')) {
        fileName = fileName + '.' + ext;
      }

      // 保存图片到本地
      const localPath = await saveImageToLocal(imageBuffer, fileName, ext);
      return {
        success: true,
        localPath,
        fileName,
        extension: ext,
        size: imageBuffer.length,
        type: contentType
      };
    } catch (error) {
      logger.error('下载图片失败:', { error } as LogMeta);
      return { success: false, error: (error as Error).message };
    }
  });

  // =============== 数据管理相关 ===============
  ipcMain.handle('load-images-from-json', async () => {
    try {
      return await loadImagesData(isReadFromDB());
    } catch (error) {
      logger.error('加载图片数据失败:', { error } as LogMeta);
      throw error;
    }
  });

  ipcMain.handle('save-images-to-json', async (event, images: any[], categories: any[]) => {
    try {
      return await saveImagesAndCategories(images, categories);
    } catch (error) {
      logger.error('保存图片数据失败:', { error } as LogMeta);
      throw error;
    }
  });

  // =============== 文件选择对话框相关 ===============
  ipcMain.handle('show-open-dialog', async () => {
    return await showDialog();
  });

  ipcMain.handle('open-folder-dialog', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });

    if (result.canceled) {
      return null;
    }

    return result.filePaths[0];
  });

  // =============== 分类管理相关 ===============
  ipcMain.handle('save-categories', async (event, categories: any[]) => {
    return await saveCategories(categories);
  });

  // =============== 图片分析相关 ===============
  ipcMain.handle('tag-image', async (event, imagePath: string, modelName: string) => {
    const taskId = `tag-${Date.now()}`;
    try {
      return await tagQueue.addTask(async () => {
        imagePath = decodeURIComponent(imagePath);
        imagePath = imagePath.replace('local-image://', '');
        return await tagImage(imagePath, modelName);
      }, taskId);
    } catch (error) {
      logger.error('图片标签分析失败:', { error } as LogMeta);
      throw error;
    }
  });

  ipcMain.handle('get-main-color', async (event, imagePath: string) => {
    const taskId = `color-${Date.now()}`;
    try {
      return await colorQueue.addTask(async () => {
        imagePath = decodeURIComponent(imagePath);
        imagePath = imagePath.replace('local-image://', '');
        return await getMainColor(imagePath);
      }, taskId);
    } catch (error) {
      logger.error('提取主色调失败:', { error } as LogMeta);
      throw error;
    }
  });

  ipcMain.handle('check-environment', async () => {
    return await checkEnvironment();
  });

  ipcMain.handle('install-environment', async () => {
    return await installEnvironment();
  });
  // =============== 队列 ===============
  ipcMain.handle('get-queue-status', async () => {
    return {
      tag: {
        queueLength: tagQueue.getQueueLength(),
        runningTasks: tagQueue.getRunningTasks()
      },
      color: {
        queueLength: colorQueue.getQueueLength(),
        runningTasks: colorQueue.getRunningTasks()
      }
    };
  });

  ipcMain.handle('reset-queue-progress', async (event, type) => {
    if (type === 'tag') {
      tagQueue.reset();
    } else {
      colorQueue.reset();
    }
    return true;
  });

  // =============== 文件夹监控相关 ===============
  ipcMain.handle('process-directory', async (event, dirPath: string, currentCategory: any = {}) => {
    try {
      tagQueue.reset();
      colorQueue.reset();
      const results = await processDirectoryFiles(dirPath, currentCategory);
      return results;
    } catch (error) {
      logger.error('处理目录失败:', { error } as LogMeta);
      throw new Error(`处理目录失败: ${(error as Error).message}`);
    }
  });

  // =============== 文件夹操作相关 ===============
  ipcMain.handle('read-images-from-folder', async (event, folderPath: string, categories: Category[]) => {
    return await processDirectoryFiles(folderPath, categories);
  });

  // =============== 文件管理相关 ===============
  ipcMain.handle('copy-file-to-category-folder', async (event, filePath: string, currentCategory: any) => {
    const watchService = require('./watchService.cjs');
    return await watchService.copyFileToCategoryFolder(filePath, currentCategory);
  });

  ipcMain.handle('delete-file', async (event, filePath: string) => {
    return await deletePhysicalFile(filePath);
  });

  ipcMain.handle('read-file', async (event, filePath: string) => {
    try {
      if (filePath.includes('local-image://')) {
        filePath = filePath.replace('local-image://', '');
      }
      const buffer = await fsPromises.readFile(filePath);
      return buffer;
    } catch (error) {
      logger.error('读取文件失败:', { error } as LogMeta);
      throw error;
    }
  });

  // =============== JSON文件操作相关 ===============
  ipcMain.handle('open-image-json', async () => {
    try {
      if (imageCountManager.count > MAX_IMAGE_COUNT) {
        await imageCountManager.exportDatabaseToLocalJson();
      }
      const jsonPath = getJsonFilePath();
      await shell.openPath(jsonPath);
      return { success: true };
    } catch (error) {
      logger.error('打开 images.json 失败:', { error } as LogMeta);
      return { success: false, error: (error as Error).message };
    }
  });

  // =============== 其他功能 ===============
  ipcMain.handle('is-remote-comfyui', async () => {
    return isRemoteComfyUI();
  });

  ipcMain.handle('cancel-tagging', async () => {
    try {
      // 取消所有正在运行的打标任务
      tagQueue.cancelAllTasks();
      return { success: true };
    } catch (error) {
      logger.error('取消打标失败:', { error } as LogMeta);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('is-read-from-db', async () => {
    return isReadFromDB();
  });

  // 设置 IPC 处理程序
  ipcMain.handle('open-external', async (_, url) => {
    await shell.openExternal(url);
  });

  ipcMain.handle('cancel-color', async () => {
    try {
      // 取消所有正在运行的配色任务
      colorQueue.cancelAllTasks();
      return { success: true };
    } catch (error) {
      logger.error('取消配色失败:', { error } as LogMeta);
      return { success: false, error: (error as Error).message };
    }
  });

  // 初始化插件系统
  const pluginService = require('./pluginService.cjs');
  pluginService.initializeAndSetupIPC(ipcMain);
  const categoryService = require('../ipc/categoryHandlers.cjs');
  categoryService.registerCategoryHandlers();
  const imageService = require('../ipc/imageHandlers.cjs');
  imageService.registerImageHandlers();
};

export { init, isRemoteComfyUI }; 