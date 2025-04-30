import { app, BrowserWindow, ipcMain, protocol } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { promises as fsPromises } from 'fs';
import { Menu } from 'electron';
import { spawn, ChildProcess } from 'child_process';
import { saveImageToLocal } from './services/FileService.cjs';
import { loadSettings, saveSettings, getComfyURL } from './services/settingService.cjs';
import { getJsonFilePath } from './services/FileService.cjs';
import { getImageSize } from './services/mediaService.cjs';
import { logger } from './services/logService.cjs';
import watchService from './services/watchService.cjs';
import http from 'http';

// 获取设置文件路径
import { startImageServer } from './imageServer/imageServerService.cjs';
const port = 8564;
const isDev = !app.isPackaged;
startImageServer(port);
async function stopImageServerByRequest() {
  return new Promise((resolve, reject) => {
    const req = http.request({
      host: '127.0.0.1',
      port: port,
      path: '/stopTunnel',
      method: 'POST',
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (!res.complete) {
          console.error('The connection was terminated while the message was still being sent');
          reject(new Error('Connection terminated prematurely'));
        } else {
          resolve(JSON.parse(data));
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.end();
  });
}

interface StartImageServerResponse {
  tunnelUrl: string;
  message: string;
}
async function startImageServerByRequest(): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = http.request({
      host: '127.0.0.1',
      port: port,
      path: '/startTunnel',
      method: 'POST',
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (!res.complete) {
          console.error('The connection was terminated while the message was still being sent');
          reject(new Error('Connection terminated prematurely'));
        } else {
          resolve(JSON.parse(data));
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.end();
  });
}

async function startLocalImageServer() {
  try {
    const result: StartImageServerResponse = await startImageServerByRequest();
    tunnelUrl = result.tunnelUrl;
    console.log('图片服务器公网地址:', tunnelUrl);
    BrowserWindow.getAllWindows().forEach(window => {
      window.webContents.send('image-server-changed', { success: true, tunnelUrl });
    });
  } catch (error) {
    stopImageServerByRequest();
    BrowserWindow.getAllWindows().forEach(window => {
      window.webContents.send('image-server-changed', { success: false, tunnelUrl: null });
    });
    console.error('启动图片服务器失败:', error);
  }
}
interface EnvConfig {
  [key: string]: string;
}

const loadEnvConfig = (): EnvConfig => {
  try {
    const envPath = isDev
      ? path.join(__dirname, '..', '.env')
      : path.join(process.resourcesPath, '.env');

    if (fs.existsSync(envPath)) {
      const envConfig = fs.readFileSync(envPath, 'utf8');
      const config: EnvConfig = {};
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

let serverProcess: ChildProcess | null = null;

// 启动 ComfyUI 服务器
async function _startComfyUIServer(comfyUI_url: string): Promise<ChildProcess> {
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

  serverProcess.stdout?.on('data', (data) => {
    console.log(`ComfyUI 服务器输出: ${data}`);
  });

  serverProcess.stderr?.on('data', (data) => {
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
    icon: path.join(__dirname, 'build/icons/icon.png'),
    titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    }
  });

  if (isDev) {
    await mainWindow.loadURL('http://localhost:5173');
    const devtools = new BrowserWindow();
    mainWindow.webContents.setDevToolsWebContents(devtools.webContents)
    mainWindow.webContents.openDevTools({
      mode: 'detach'
    });
  } else {
    await mainWindow.loadFile(path.join(process.resourcesPath, 'app.asar/dist/index.html'));
  }

  // 完全移除菜单栏
  Menu.setApplicationMenu(null);

  // 注册 IPC 处理器
  ipcMain.handle('save-image-to-local', async (event, imageBuffer: Buffer, fileName: string, ext: string) => {
    return await saveImageToLocal(imageBuffer, fileName, ext);
  });

  // 注册设置相关的 IPC 处理器
  ipcMain.handle('load-settings', async () => {
    return await loadSettings();
  });

  ipcMain.handle('save-settings', async (event, settings: any) => {
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
    console.log('settings.startImageServer', settings.startImageServer);
    return result;
  });

  // 添加窗口控制处理器
  ipcMain.handle('window-minimize', () => {
    logger.debug('Window minimized')
    mainWindow?.minimize()
  })

  ipcMain.handle('window-maximize', () => {
    // 根据id获取插件
    if (mainWindow?.isMaximized()) {
      // 从plugins中获取id对应的插件
      logger.debug('Window unmaximized')
      mainWindow.unmaximize()
      mainWindow.webContents.send('window-unmaximized')
    } else {
      logger.debug('Window maximized')
      mainWindow?.maximize()
      mainWindow?.webContents.send('window-maximized')
    }
  })

  ipcMain.handle('window-close', () => {
    mainWindow?.close()
  })
  const settings = await loadSettings();
  if (settings.startImageServer) {
    startLocalImageServer()
  }
}
let tunnelUrl: string | null = null;

const downloadRemoteImage = async (imageUrl: string, fileName: string): Promise<string | null> => {
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
const downloadRemoteImagesInBackground = async (jsonPath: string): Promise<void> => {
  try {
    const data = JSON.parse(await fsPromises.readFile(jsonPath, 'utf-8'));
    let hasUpdates = false;

    await Promise.all(
      data.images.map(async (img: any) => {
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
          const updatedImagesList = currentData.images.map((currentImg: any) =>
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
      window.webContents.send('remote-images-downloaded', { success: false, error: (error as Error).message });
    });
  }
};

const initializeUserData = async (): Promise<void> => {
  try {
    const jsonPath = getJsonFilePath();
    console.log('用户数据目录路径:', jsonPath);
    downloadRemoteImagesInBackground(jsonPath);
    console.log('用户数据初始化完成，图片将在后台继续下载');
  } catch (error) {
    console.error('初始化用户数据失败:', error);
  }
};

async function startComfyUIServer(): Promise<void> {
  // 初始化设置
  const url = await getComfyURL();
  if (!url) {
    throw new Error('ComfyUI URL is not configured');
  }
  // 启动 ComfyUI 服务器
  serverProcess = await _startComfyUIServer(url);
  // 当应用退出时关闭服务器
  app.on('before-quit', () => {
    if (serverProcess) {
      serverProcess.kill();
    }
  });
}

app.whenReady().then(async () => {
  await startComfyUIServer();
  await initializeUserData();
  // 启动图片服务器

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
      // await session.defaultSession.loadExtension(
      //   'C:/Users/jzj/AppData/Local/Microsoft/Edge/User Data/Default/Extensions/gpphkfbcpidddadnkolkpfckpihlkkil/6.0.1_0'
      // );
    } catch (e) {
      console.log('React Devtools 加载失败', e);
    }
  }
});

app.on('window-all-closed', async () => {
  await watchService.closeAll();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

const ipcService = require('./services/ipcService.cjs');
ipcService.init();
ipcMain.handle('update-folder-watchers', async (event, folders: string[]) => {
  await watchService.updateWatchers(folders);
  return true;
});
app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  // 关闭图片服务器
  stopImageServerByRequest();
});
