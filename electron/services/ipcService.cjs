const { app, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const { generateHashId } = require('../utils/index.cjs');
const { getComfyURL } = require('./settingService.cjs');
const { saveImageToLocal, loadImagesData, getJsonFilePath, deletePhysicalFile } = require('./FileService.cjs');
const { getVideoDuration, generateVideoThumbnail, getImageSize, processDirectoryFiles } = require('./mediaService.cjs');
const { tagImage, getMainColor } = require(path.join(__dirname, '../../', 'script', 'script.cjs'))
const { tagQueue, colorQueue } = require('./queueService.cjs');
const { logger } = require('./logService.cjs');
const isRemoteComfyUI = function () {
  const ComfyUI_URL = getComfyURL();
  return !(ComfyUI_URL.includes('localhost') || ComfyUI_URL.includes('127.0.0.1'));
}

ipcMain.handle('get-video-duration', async (event, filePath) => {
  if (filePath.startsWith('local-image://')) {
    filePath = decodeURIComponent(filePath.replace('local-image://', ''));
  }
  return await getVideoDuration(filePath);
});

ipcMain.handle('generate-video-thumbnail', async (event, filePath) => {
  if (filePath.startsWith('local-image://')) {
    filePath = decodeURIComponent(filePath.replace('local-image://', ''));
  }
  return await generateVideoThumbnail(filePath);
});

// 添加 IPC 处理函数
ipcMain.handle('open-in-photoshop', async (_, filePath) => {
  try {
    const localPath = decodeURIComponent(filePath.replace('local-image://', ''));
    await shell.openPath(localPath)
    return { success: true };
  } catch (error) {
    console.error('Failed to open Photoshop:', error);
    return { success: false, error: error.message };
  }
});

// 添加打开文件所在文件夹的处理函数
ipcMain.handle('show-in-folder', async (_, filePath) => {
  try {
    const localPath = decodeURIComponent(filePath.replace('local-image://', ''));
    await shell.showItemInFolder(localPath);
    return { success: true };
  } catch (error) {
    console.error('Failed to show item in folder:', error);
    return { success: false, error: error.message };
  }
});

// 添加下载 URL 图片的功能
ipcMain.handle('download-url-image', async (_, url) => {
  try {
    const https = require('https');
    const http = require('http');

    const client = url.startsWith('https') ? https : http;

    const imageBuffer = await new Promise((resolve, reject) => {
      client.get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`请求失败: ${res.statusCode}`));
          return;
        }

        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      }).on('error', reject);
    });
    const id = generateHashId(url, imageBuffer.length);
    const fileNameMatch = url.match(/filename=([^&]+)/);
    let fileName = fileNameMatch ? fileNameMatch[1] : id;
    const contentType = await new Promise((resolve) => {
      client.get(url, (res) => {
        resolve(res.headers['content-type'] || 'image/jpeg');
      });
    });
    const ext = contentType.split('/').pop() || 'jpg';
    if (!fileName.includes('.')) {
      fileName = fileName + '.' + ext;
    }
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
    console.error('下载图片失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('read-directory', async (event, dirPath) => {
  try {
    const files = await fsPromises.readdir(dirPath);
    return files;
  } catch (error) {
    console.error('Error reading directory:', error);
    throw error;
  }
});

ipcMain.handle('read-file-metadata', async (event, filePath) => {
  try {
    const stats = await fsPromises.stat(filePath);
    return {
      size: stats.size,
      dateCreated: stats.birthtime,
      dateModified: stats.mtime
    };
  } catch (error) {
    console.error('Error reading file metadata:', error);
    throw error;
  }
});

ipcMain.handle('load-images-from-json', async () => {
  try {
    const userDataPath = app.getPath('userData');
    const jsonPath = path.join(userDataPath, 'images.json');

    if (!fs.existsSync(jsonPath)) {
      return { images: [], categories: [] };
    }

    const data = await fs.promises.readFile(jsonPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading images:', error);
    throw error;
  }
});

ipcMain.handle('show-open-dialog', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: '媒体文件', extensions: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'avi', 'webm'] }
    ]
  });

  if (result.canceled) {
    return [];
  }

  const fileMetadata = await Promise.all(
    result.filePaths.map(async (filePath) => {
      const stats = await fsPromises.stat(filePath);
      const localImageUrl = `local-image://${encodeURIComponent(filePath)}`;
      const ext = path.extname(filePath).toLowerCase();
      const isVideo = ['.mp4', '.mov', '.avi', '.webm'].includes(ext);

      const metadata = {
        id: Date.now().toString(),
        path: localImageUrl,
        name: path.basename(filePath, ext), // 移除扩展名
        extension: ext.slice(1), // 移除点号
        size: stats.size,
        dateCreated: stats.birthtime.toISOString(),
        dateModified: stats.mtime.toISOString(),
        tags: [],
        favorite: false,
        categories: [],
        type: isVideo ? 'video' : 'image',
      };

      if (isVideo) {
        try {
          metadata.duration = await getVideoDuration(filePath);
          metadata.thumbnail = await generateVideoThumbnail(filePath);
        } catch (error) {
          console.error('处理视频元数据失败:', error);
        }
      }

      return metadata;
    })
  );

  return fileMetadata;
});

ipcMain.handle('save-images-to-json', async (event, images, categories) => {
  try {
    const userDataPath = app.getPath('userData');
    const jsonPath = path.join(userDataPath, 'images.json');

    // 获取当前的图片数据
    const currentData = await loadImagesData();
    const currentImages = new Set(currentData.images.map(img => img.id));
    const newImages = new Set(images.map(img => img.id));

    // 找出被删除的图片
    const deletedImages = currentData.images.filter(img => 
      !newImages.has(img.id) && img.isBindInFolder
    );

    // 删除绑定文件夹中被删除的图片的物理文件
    for (const img of deletedImages) {
      try {
        await deletePhysicalFile(img.path);
        logger.info(`删除绑定文件夹图片: ${img.path}`);
      } catch (error) {
        logger.error(`删除绑定文件夹图片失败: ${img.path}`, error);
      }
    }

    // 保存更新后的数据
    await fs.promises.writeFile(
      jsonPath,
      JSON.stringify({ images, categories }, null, 2),
      'utf-8'
    );

    return true;
  } catch (error) {
    logger.error('保存图片数据失败:', error);
    throw error;
  }
});

// 处理保存图片数据的请求
ipcMain.handle('save-images', async (event, images) => {
  try {
    const filePath = getJsonFilePath();
    await fsPromises.writeFile(filePath, JSON.stringify({ images }, null, 2));
    return { success: true };
  } catch (error) {
    console.error('保存图片数据失败:', error);
    throw error;
  }
});

// 处理分类数据的请求
ipcMain.handle('save-categories', async (event, categories) => {
  try {
    const filePath = getJsonFilePath();
    // 先读取现有数据
    const existingData = JSON.parse(await fsPromises.readFile(filePath, 'utf8'));
    // 更新分类数据
    existingData.categories = categories;
    // 写入更新后的数据
    await fsPromises.writeFile(filePath, JSON.stringify(existingData, null, 2));
    return { success: true };
  } catch (error) {
    console.error('保存分类数据失败:', error);
    throw error;
  }
});

// 处理加载图片数据的请求
ipcMain.handle('load-images', async () => {
  try {
    // 使用 loadImagesData 替代原来的直接读取逻辑
    const data = loadImagesData();
    return data;
  } catch (error) {
    console.error('读取图片数据失败:', error);
    throw error;
  }
});

ipcMain.handle('open-image-json', async () => {
  try {
    const userDataPath = path.join(app.getPath('userData'), 'images.json');
    await shell.openPath(userDataPath);
    return { success: true };
  } catch (error) {
    console.error('打开 images.json 失败:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('is-remote-comfyui', async () => {
  return isRemoteComfyUI();
});

// 读取文件并返回 base64 格式
ipcMain.handle('read-file', async (event, filePath) => {
  try {
    if (filePath.includes('local-image://')) {
      filePath = filePath.replace('local-image://', '');
    }
    const buffer = await fsPromises.readFile(filePath);
    return buffer;
  } catch (error) {
    console.error('读取文件失败:', error);
    throw error;
  }
});

ipcMain.handle('tag-image', async (event, imagePath, modelName) => {
  const taskId = `tag-${Date.now()}`;
  try {
    return await tagQueue.addTask(async () => {
      imagePath = decodeURIComponent(imagePath);
      imagePath = imagePath.replace('local-image://', '');
      return await tagImage(imagePath, modelName);
    }, taskId);
  } catch (error) {
    console.error('Image tagging failed:', error);
    throw error;
  }
});

ipcMain.handle('get-main-color', async (event, imagePath) => {
  const taskId = `color-${Date.now()}`;
  try {
    return await colorQueue.addTask(async () => {
      imagePath = decodeURIComponent(imagePath);
      imagePath = imagePath.replace('local-image://', '');
      return await getMainColor(imagePath);
    }, taskId);
  } catch (error) {
    console.error('Color extraction failed:', error);
    throw error;
  }
});

// 获取队列状态的处理程序
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

// 添加重置队列进度的处理程序
ipcMain.handle('reset-queue-progress', async (event, type) => {
  if (type === 'tag') {
    tagQueue.reset();
  } else {
    colorQueue.reset();
  }
  return true;
});

// 修改现有的批量处理函数，使其在开始前重置进度
ipcMain.handle('process-directory', async (event, dirPath, isBindInFolder = false) => {
  try {
    // 在开始处理前重置进度
    tagQueue.reset();
    colorQueue.reset();
    const results = await processDirectoryFiles(dirPath, isBindInFolder);
    return results;
  } catch (error) {
    console.error('处理目录时出错:', error);
    throw new Error('处理目录失败: ' + error.message);
  }
});

// 添加新的 IPC 处理函数
ipcMain.handle('open-folder-dialog', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });

  if (result.canceled) {
    return null;
  }

  return result.filePaths[0];
});

ipcMain.handle('read-images-from-folder', async (event, folderPath) => {
  try {
    // 使用现有的  函数处理文件夹
    const files = await processDirectoryFiles(folderPath);
    
    // 创建新的分类对象
    const categoryName = path.basename(folderPath);
    const category = {
      id: `category-${Date.now()}`,
      name: categoryName,
      images: files.map(file => file.id),
      count: files.length,
      folderPath: folderPath,
      isImportFromFolder: true
    };

    return {
      category,
      images: files
    };
  } catch (error) {
    console.error('读取文件夹图片失败:', error);
    throw error;
  }
});

const pluginService = require('./pluginService.cjs');
pluginService.initializeAndSetupIPC(ipcMain);

module.exports = {
  getImageSize,
  processDirectoryFiles,
  getVideoDuration,
  generateVideoThumbnail,
  generateHashId,
  pluginService
};
