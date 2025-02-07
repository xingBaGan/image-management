const { app, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const probe = require('probe-image-size');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path.replace('app.asar', 'app.asar.unpacked');
const ffprobePath = require('@ffprobe-installer/ffprobe').path.replace('app.asar', 'app.asar.unpacked');
const fsPromises = require('fs').promises;
const isDev = !app.isPackaged;
const { saveImageToLocal } = require('./FileService.cjs');
// 设置 ffmpeg 和 ffprobe 路径
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);



const { supportedExtensions } = isDev
  ? require(path.join(__dirname, '../../', 'config.cjs'))  // 开发环境
  : require(path.join(process.resourcesPath, 'config.cjs'));  // 生产环境
const { tagImage, getMainColor } = require(path.join(__dirname, '../../', 'script', 'script.cjs'))


const isRemoteComfyUI = function () {
  initializeSettings();
  return !(ComfyUI_URL.includes('localhost') || ComfyUI_URL.includes('127.0.0.1'));
}

const getJsonFilePath = () => {
  return path.join(app.getPath('userData'), 'images.json');
};

function loadImagesData() {
  try {
    const imagesJsonPath = path.join(app.getPath('userData'), 'images.json');
    let data = JSON.parse(fs.readFileSync(imagesJsonPath, 'utf8'));

    if (!data.categories) {
      data.categories = [];
    }

    // 更新图片数据结构
    let hasUpdates = false;
    data.images = data.images.map(img => {
      const updatedImg = { ...img };

      // 确保所有必需字段存在
      if (!updatedImg.id) updatedImg.id = Date.now().toString();
      if (!updatedImg.name) updatedImg.name = path.basename(updatedImg.path);
      if (!updatedImg.dateCreated) updatedImg.dateCreated = new Date().toISOString();
      if (!updatedImg.dateModified) updatedImg.dateModified = new Date().toISOString();
      if (!updatedImg.size) updatedImg.size = 0;
      if (!updatedImg.tags) updatedImg.tags = [];
      if (typeof updatedImg.favorite !== 'boolean') updatedImg.favorite = false;
      if (!updatedImg.categories) updatedImg.categories = [];
      if (!updatedImg.type) {
        // 根据文件扩展名判断类型
        const ext = path.extname(updatedImg.path).toLowerCase();
        updatedImg.type = ['.mp4', '.mov', '.avi', '.webm'].includes(ext) ? 'video' : 'image';
      }

      return updatedImg;
    });

    if (hasUpdates) {
      fs.writeFileSync(imagesJsonPath, JSON.stringify(data, null, 2));
    }

    return data;
  } catch (error) {
    console.error('Error loading images data:', error);
    return { images: [], categories: [] };
  }
}

// 获取视频时长
const getVideoDuration = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        console.error('获取视频时长失败:', err);
        reject(err);
        return;
      }
      resolve(metadata.format.duration);
    });
  });
};

// 生成视频缩略图
const generateVideoThumbnail = (filePath) => {
  return new Promise((resolve, reject) => {
    const thumbnailPath = path.join(app.getPath('userData'), 'thumbnails', `${path.basename(filePath)}.png`);

    // 确保缩略图目录存在
    fs.mkdirSync(path.dirname(thumbnailPath), { recursive: true });

    ffmpeg(filePath)
      .screenshots({
        timestamps: ['1'], // 在1秒处截图
        filename: path.basename(thumbnailPath),
        folder: path.dirname(thumbnailPath),
        size: '320x240' // 缩略图尺寸
      })
      .on('end', () => {
        // 将缩略图转换为 base64
        fs.readFile(thumbnailPath, (err, data) => {
          if (err) {
            console.error('读取缩略图失败:', err);
            reject(err);
            return;
          }
          const base64 = `data:image/png;base64,${data.toString('base64')}`;
          resolve(base64);
        });
      })
      .on('error', (err) => {
        console.error('生成缩略图失败:', err);
        reject(err);
      });
  });
};

const generateHashId = (filePath, fileSize) => {
  const str = `${filePath}-${fileSize}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
};

const getImageSize = async (filePath) => {
  try {
    // 处理 base64 图片
    if (filePath.startsWith('data:image')) {
      const base64 = filePath.split(',')[1];
      const buffer = Buffer.from(base64, 'base64');
      const dimensions = probe.sync(buffer);
      return {
        width: dimensions.width,
        height: dimensions.height,
      };
    }

    // 检查是否为视频文件
    const ext = path.extname(filePath).toLowerCase();
    if (['.mp4', '.mov', '.avi', '.webm'].includes(ext)) {
      return { width: 0, height: 0 };
    }
    if (filePath.startsWith('local-image://')) {
      filePath = decodeURIComponent(filePath.replace('local-image://', ''));
    }
    // 读取图片文件
    const buffer = await fsPromises.readFile(filePath);
    const dimensions = probe.sync(buffer);
    if (!dimensions) {
      console.warn(`无法获取图片尺寸: ${filePath}`);
      return { width: 0, height: 0 };
    }

    return {
      width: dimensions.width,
      height: dimensions.height
    };
  } catch (error) {
    console.error(`获取图片尺寸失败: ${filePath}`, error);
    return { width: 0, height: 0 };
  }
};

const processDirectory = async (dirPath) => {
  try {
    const files = await fsPromises.readdir(dirPath);
    
    const processedFiles = [];

    for (const file of files) {
      try {
        const filePath = path.join(dirPath, file);
        const stats = await fsPromises.stat(filePath);
        if (!stats.isFile()) continue;
        
        const ext = path.extname(filePath).toLowerCase();
        if (!supportedExtensions.includes(ext)) continue;
        const isVideo = ['.mp4', '.mov', '.avi', '.webm'].includes(ext);
        const localImageUrl = `local-image://${encodeURIComponent(filePath)}`;
        const thumbnail = isVideo ? await generateVideoThumbnail(filePath) : undefined;
        let imageSize = await getImageSize(filePath);
        imageSize = isVideo ? await getImageSize(thumbnail) : imageSize;
        const id = generateHashId(filePath, stats.size);
        const metadata = {
          id: id,
          path: localImageUrl,
          name: path.basename(filePath, ext), // 移除扩展名
          extension: ext.slice(1), // 移除点号
          size: stats.size,
          dateCreated: stats.birthtime.toISOString(),
          dateModified: stats.mtime.toISOString(),
          tags: [],
          favorite: false,
          categories: [],
          width: imageSize.width,
          height: imageSize.height,
          type: isVideo ? 'video' : 'image',
          thumbnail: thumbnail,
          duration: isVideo ? await getVideoDuration(filePath) : undefined,
        };
        processedFiles.push(metadata);
      } catch (error) {
        console.error(`处理文件 ${file} 时出错:`, error);
        continue;
      }
    }

    return processedFiles;
  } catch (error) {
    console.error('处理目录失败:', error);
    throw error;
  }
};

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

    await fs.promises.writeFile(
      jsonPath,
      JSON.stringify({ images, categories }, null, 2),
      'utf-8'
    );

    return true;
  } catch (error) {
    console.error('Error saving images:', error);
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
  imagePath = decodeURIComponent(imagePath);
  imagePath = imagePath.replace('local-image://', '');
  return await tagImage(imagePath, modelName);
});

ipcMain.handle('get-main-color', async (event, imagePath) => {
  imagePath = decodeURIComponent(imagePath);
  imagePath = imagePath.replace('local-image://', '');
  return await getMainColor(imagePath);
});


ipcMain.handle('process-directory', async (event, dirPath) => {
  try {
    const results = await processDirectory(dirPath);
    return results;
  } catch (error) {
    console.error('处理目录时出错:', error);
    throw new Error('处理目录失败: ' + error.message);
  }
});

module.exports = {
  getImageSize,
  processDirectory,
  getVideoDuration,
  generateVideoThumbnail,
  generateHashId
};
