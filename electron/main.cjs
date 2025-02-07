const { app, BrowserWindow, ipcMain, protocol, session } = require('electron');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs/promises');
const { Menu } = require('electron');
const { spawn } = require('child_process');
const { saveImageToLocal } = require('./services/FileService.cjs');
const { loadSettings, saveSettings, initializeSettings } = require('./services/settingService.cjs');
const isDev = !app.isPackaged;
// 获取设置文件路径
const { getImageSize } = require('./services/ipcService.cjs');

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
// 加载设置中的 ComfyUI_URL
let ComfyUI_URL = process.env.ComfyUI_URL;

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
    width: 1520,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextRemoteModule: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
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
        if (img.type === 'video' || (img.path && !img.path.startsWith('http'))) {
          return img;
        }

        const localPath = await downloadRemoteImage(img.path, img.name);
        if (localPath) {
          hasUpdates = true;
          // 更新特定图片的路径
          const currentData = JSON.parse(await fsPromises.readFile(jsonPath, 'utf-8'));
          // 获取图片的宽高
          const dimensions = await getImageSize(localPath); 
          const updatedImagesList = currentData.images.map(currentImg =>
            currentImg.id === img.id ? { ...currentImg, path: localPath, width: dimensions.width, height: dimensions.height } : currentImg
          );
          // 保存更新后的数据
          await fsPromises.writeFile(
            jsonPath,
            JSON.stringify({ ...currentData, images: updatedImagesList }, null, 2),
            'utf-8'
          );
          // 通知所有窗口下载完成
          BrowserWindow.getAllWindows().forEach(window => {
            window.webContents.send('remote-images-downloaded', { success: true });
          });
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
    // 通知所有窗口下载失败
    BrowserWindow.getAllWindows().forEach(window => {
      window.webContents.send('remote-images-downloaded', { success: false, error: error.message });
    });
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

  if (isDev) {
    try {
      await session.defaultSession.loadExtension(
        'C:/Users/jzj/AppData/Local/Microsoft/Edge/User Data/Default/Extensions/gpphkfbcpidddadnkolkpfckpihlkkil/6.0.1_0'
      );
    } catch (e) {
      console.log('React Devtools 加载失败', e);
    }
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});


require('./services/ipcService.cjs');