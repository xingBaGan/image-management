const { app, BrowserWindow, ipcMain, dialog, protocol, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs/promises');
const { Menu } = require('electron');
const { spawn } = require('child_process');
const { tagImage } = require(path.join(__dirname, '..', 'script', 'script.cjs'));

const isDev = !app.isPackaged;
// 获取设置文件路径
const getSettingsPath = () => {
  return path.join(app.getPath('userData'), 'settings.json');
};

// 加载设置
const loadSettings = async () => {
  try {
    const settingsPath = getSettingsPath();
    if (!fs.existsSync(settingsPath)) {
      const defaultSettings = {
        autoTagging: true,
        ComfyUI_URL: 'http://localhost:8188'
      };
      console.log('不存在文件, 创建文件');
      await fsPromises.writeFile(
        settingsPath,
        JSON.stringify(defaultSettings, null, 2),
        'utf8' // 修正编码为 'utf8'
      );
      return defaultSettings;
    }
    const data = await fsPromises.readFile(settingsPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('加载设置失败:', error);
    return {
      autoTagging: false, // 返回默认值以防止空对象
      ComfyUI_URL: ''
    };
  }
};

// 保存设置
const saveSettings = async (settings) => {
  try {
    const settingsPath = getSettingsPath();
    await fsPromises.writeFile(
      settingsPath,
      JSON.stringify(settings, null, 2),
      'utf8'
    );
    return true;
  } catch (error) {
    console.error('保存设置失败:', error);
    return false;
  }
};

// 读取 .env 文件
const loadEnvConfig = () => {
  try {
    const envPath = isDev
      ? path.join(__dirname, '..', '.env')
      : path.join(process.resourcesPath, '.env');

    if (fs.existsSync(envPath)) {
      const envConfig = fs.readFileSync(envPath, 'utf8');
      const config = {};
      envConfig.split('\n').forEach(line => {
        // 忽略注释和空行
        if (line.startsWith('#') || !line.trim()) return;

        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          // 处理值中可能包含 = 的情况
          const value = valueParts.join('=').trim();
          // 移除可能存在的引号
          config[key.trim()] = value.replace(/^["'](.*)["']$/, '$1');
        }
      });
      return config;
    }
    return {};
  } catch (error) {
    console.error('读取 .env 配置失败:', error);
    return {};
  }
};

// 加载 .env 配置
const envConfig = loadEnvConfig();
// 将配置添加到环境变量
Object.assign(process.env, envConfig);
let ComfyUI_URL = process.env.ComfyUI_URL;

const isRemoteComfyUI = function () {
  initializeSettings();
  return !(ComfyUI_URL.includes('localhost') || ComfyUI_URL.includes('127.0.0.1'));
}

// 加载设置中的 ComfyUI_URL
const initializeSettings = async () => {
  const settings = await loadSettings();
  if (settings.ComfyUI_URL) {
    ComfyUI_URL = settings.ComfyUI_URL;
  }
};

// 启动 ComfyUI 服务器
async function _startComfyUIServer(comfyUI_url) {
  const serverPath = isDev
    ? path.join(__dirname, '..', 'comfyui_client', 'dist', 'server.js')
    : path.join(process.resourcesPath, 'comfyui_client', 'dist', 'server.js');

  console.log('----ComfyUI_URL----', comfyUI_url);
  console.log('ComfyUI 服务器路径:', serverPath);

  const serverProcess = spawn('node', [serverPath, comfyUI_url], {
    stdio: 'pipe',
    env: {
      ...process.env,
      NODE_NO_WARNINGS: '1'
    }
  });

  serverProcess.stdout.on('data', (data) => {
    console.log(`ComfyUI 服务器输出: ${data}`);
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`ComfyUI 服务器错误: ${data}`);
  });

  serverProcess.on('close', (code) => {
    console.log(`ComfyUI 服务器已关闭，退出码: ${code}`);
  });

  return serverProcess;
}

async function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });

  if (isDev) {
    await mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({
      mode: 'detach'
    });
  } else {
    await mainWindow.loadFile(path.join(process.resourcesPath, 'app.asar/dist/index.html'));
  }

  // 完全移除菜单栏
  Menu.setApplicationMenu(null);
  // 注册 IPC 处理器
  ipcMain.handle('save-image-to-local', async (event, imageBuffer, fileName, ext) => {
    return await saveImageToLocal(imageBuffer, fileName, ext);
  });

  // 注册设置相关的 IPC 处理器
  ipcMain.handle('load-settings', async () => {
    return await loadSettings();
  });

  ipcMain.handle('save-settings', async (event, settings) => {
    const result = await saveSettings(settings);

    if (serverProcess) {
      serverProcess.kill();
    }
    // 重启ComfyUI服务器
    serverProcess = await _startComfyUIServer(settings.ComfyUI_URL);
    if (result) {
      // 更新环境变量
      ComfyUI_URL = settings.ComfyUI_URL;
    }
    return result;
  });
}

const downloadRemoteImage = async (imageUrl, fileName) => {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 从 Content-Type 中获取文件扩展名
    const contentType = response.headers.get('Content-Type');
    const ext = contentType?.split('/').pop() || 'jpg';

    // 检查文件是否已存在
    const imagesDir = path.join(app.getPath('userData'), 'images');
    const filePath = path.join(imagesDir, `${fileName}.${ext}`);
    if (fs.existsSync(filePath)) {
      return `local-image://${filePath}`;
    }

    console.log('downloadRemoteImage', imageUrl, fileName);
    // 保存图片到本地
    return await saveImageToLocal(buffer, fileName, ext);
  } catch (error) {
    console.error(`下载图片失败: ${imageUrl}`, error);
    return null;
  }
};

// 添加后台下载远程图片的函数
const downloadRemoteImagesInBackground = async (jsonPath) => {
  try {
    const data = JSON.parse(await fsPromises.readFile(jsonPath, 'utf-8'));
    let hasUpdates = false;

    await Promise.all(
      data.images.map(async (img) => {
        // 跳过视频和已经本地化的图片
        if (img.type === 'video' || !img.path.startsWith('http')) {
          return img;
        }

        const localPath = await downloadRemoteImage(img.path, img.name);
        if (localPath) {
          hasUpdates = true;
          // 更新特定图片的路径
          const currentData = JSON.parse(await fsPromises.readFile(jsonPath, 'utf-8'));
          const updatedImagesList = currentData.images.map(currentImg =>
            currentImg.id === img.id ? { ...currentImg, path: localPath } : currentImg
          );
          // 保存更新后的数据
          await fsPromises.writeFile(
            jsonPath,
            JSON.stringify({ ...currentData, images: updatedImagesList }, null, 2),
            'utf-8'
          );
        }
      })
    );

    if (hasUpdates) {
      console.log('远程图片下载和更新完成');
    } else {
      console.log('没有需要下载的远程图片');
    }
  } catch (error) {
    console.error('后台下载图片时出错:', error);
  }
};

const initializeUserData = async () => {
  const mockImagesContent = {
    "images": [
      {
        "id": "1",
        "path": "https://images.unsplash.com/photo-1518791841217-8f162f1e1131",
        "name": "Cute cat",
        "size": 1024000,
        "dateCreated": "2024-01-01T00:00:00.000Z",
        "dateModified": "2024-01-01T00:00:00.000Z",
        "tags": ["animals", "cats"],
        "favorite": true,
        "categories": [],
        "type": "image"
      },
      {
        "id": "2",
        "path": "https://images.unsplash.com/photo-1579353977828-2a4eab540b9a",
        "name": "Sunset view",
        "size": 2048000,
        "dateCreated": "2024-01-02T00:00:00.000Z",
        "dateModified": "2024-01-02T00:00:00.000Z",
        "tags": ["nature", "sunset"],
        "favorite": false,
        "categories": []
      },
      {
        "id": "3",
        "path": "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d",
        "name": "Workspace",
        "size": 1536000,
        "dateCreated": "2024-01-03T00:00:00.000Z",
        "dateModified": "2024-01-03T00:00:00.000Z",
        "tags": ["work", "desk"],
        "favorite": false,
        "categories": []
      },
      {
        "id": "4",
        "path": "https://images.unsplash.com/photo-1484723091739-30a097e8f929",
        "name": "Food photography",
        "size": 3072000,
        "dateCreated": "2024-01-04T00:00:00.000Z",
        "dateModified": "2024-01-04T00:00:00.000Z",
        "tags": ["food", "photography"],
        "favorite": true,
        "categories": []
      },
      {
        "id": "5",
        "path": "https://media.w3.org/2010/05/sintel/trailer.mp4",
        "name": "示例视频",
        "size": 5242880,
        "dateCreated": "2024-01-05T00:00:00.000Z",
        "dateModified": "2024-01-05T00:00:00.000Z",
        "tags": ["视频", "示例"],
        "favorite": false,
        "categories": [],
        "type": "video",
        "duration": 52,
        "thumbnail": "https://peach.blender.org/wp-content/uploads/title_anouncement.jpg"
      }
    ],
    "categories": [
      {
        "id": "1",
        "name": "风景",
        "images": []
      },
      {
        "id": "2",
        "name": "人物",
        "images": []
      },
      {
        "id": "3",
        "name": "美食",
        "images": []
      },
      {
        "id": "4",
        "name": "建筑",
        "images": []
      }
    ]
  };
  try {
    const userDataPath = path.join(app.getPath('userData'), 'images.json');
    console.log('用户数据目录路径:', userDataPath);

    // 检查文件是否存在
    try {
      await fsPromises.access(userDataPath);
      // 即使文件存在，也启动后台下载检查
      downloadRemoteImagesInBackground(userDataPath);
      return;
    } catch {
      console.log('images.json 文件不存在，开始初始化');

      // 先保存初始数据
      await fsPromises.writeFile(
        userDataPath,
        JSON.stringify(mockImagesContent, null, 2),
        'utf-8'
      );

      // 启动后台下载
      downloadRemoteImagesInBackground(userDataPath);

      console.log('用户数据初始化完成，图片将在后台继续下载');
    }
  } catch (error) {
    console.error('初始化用户数据失败:', error);
  }
};

let serverProcess = null;
async function startComfyUIServer() {
  // 初始化设置
  await initializeSettings();
  // 启动 ComfyUI 服务器
  serverProcess = await _startComfyUIServer(ComfyUI_URL);
  // 当应用退出时关闭服务器
  app.on('before-quit', () => {
    if (serverProcess) {
      serverProcess.kill();
    }
  });
}

app.whenReady().then(async () => {
  await startComfyUIServer();
  // 初始化用户数据
  await initializeUserData();

  protocol.registerFileProtocol('local-image', (request, callback) => {
    const filePath = request.url.replace('local-image://', '');
    try {
      const decodedPath = decodeURIComponent(filePath);
      callback({ path: decodedPath });
    } catch (error) {
      console.error('Error handling local-image protocol:', error);
      callback({ error: -2 /* FAILED */ });
    }
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
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

      return {
        id: Date.now().toString(),
        path: localImageUrl,
        name: path.basename(filePath),
        size: stats.size,
        dateCreated: stats.birthtime.toISOString(),
        dateModified: stats.mtime.toISOString(),
        tags: [],
        favorite: false,
        categories: [],
        type: isVideo ? 'video' : 'image',
        duration: undefined,
        thumbnail: undefined
      };
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

// 获取应用数据目录中的 JSON 文件路径
const getJsonFilePath = () => {
  return path.join(app.getPath('userData'), 'images.json');
};

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
  return await tagImage(imagePath, modelName);
});

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

const saveImageToLocal = async (imageData, fileName, ext) => {
  try {
    // 确保 images 目录存在
    const imagesDir = path.join(app.getPath('userData'), 'images');
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }

    // 缓存图片
    const uniqueFileName = `${fileName}.${ext}`;
    const filePath = path.join(imagesDir, uniqueFileName);

    // 将 Uint8Array 转换为 Buffer 并写入文件
    const buffer = Buffer.from(imageData);
    await fs.promises.writeFile(filePath, buffer);

    // 返回本地路径
    return `local-image://${filePath}`;
  } catch (error) {
    console.error('保存图片失败:', error);
    throw error;
  }
};

