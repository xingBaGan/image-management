const { app, BrowserWindow, ipcMain, dialog, protocol, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs/promises');

const isDev = !app.isPackaged;

function createWindow() {
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
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({
      mode: 'detach'
    });
  } else {
    mainWindow.loadFile(path.join(process.resourcesPath, 'app.asar/dist/index.html'));
  }
}

const initializeUserData = async () => {
  try {
    const userDataPath = path.join(app.getPath('userData'), 'images.json');
    console.log('用户数据目录路径:', userDataPath);
    
    try {
      await fsPromises.access(userDataPath);
    } catch {
      console.log('images.json 文件不存在');
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
      
      await fsPromises.writeFile(userDataPath, JSON.stringify(mockImagesContent, null, 2), 'utf-8');
      console.log('Mock images data initialized in userData directory');
    }
  } catch (error) {
    console.error('Error initializing user data:', error);
  }
};

app.whenReady().then(async () => {
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
      created: stats.birthtime,
      modified: stats.mtime
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

