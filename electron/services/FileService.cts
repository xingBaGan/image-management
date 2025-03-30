import { app, dialog } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from './logService.cjs';
import { promises as fsPromises } from 'fs';
import { Category } from '../dao/type.cjs';
import { 
  getVideoDuration, 
  generateVideoThumbnail,
  processDirectoryFiles 
} from './mediaService.cjs';
import { LocalImageData } from '../dao/type.cjs';
import { DAOFactory } from '../dao/DAOFactory.cjs';
import { isReadFromDB, MAX_IMAGE_COUNT } from '../services/checkImageCount.cjs';
import { ImageDatabase } from '../pouchDB/Database.cjs';
interface ImageData {
  images: any[];
  categories: any[];
}

interface LogMeta {
  [key: string]: any;
}

interface FileMetadata {
  id: string;
  path: string;
  name: string;
  extension: string;
  size: number;
  dateCreated: string;
  dateModified: string;
  tags: string[];
  favorite: boolean;
  categories: string[];
  type: 'video' | 'image';
  duration?: number;
  thumbnail?: string;
}

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
      "categories": [],
      "type": "image"
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
      "categories": [],
      "type": "image"
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
      "categories": [],
      "type": "image"
    }
  ],
  "categories": [
    {
      "id": "1",
      "name": "landscape",
      "images": []
    },
    {
      "id": "2",
      "name": "person",
      "images": []
    },
    {
      "id": "3",
      "name": "food",
      "images": []
    },
    {
      "id": "4",
      "name": "building",
      "images": []
    }
  ]
};
const getJsonFilePath = (): string => {
  return path.join(app.getPath('userData'), 'images.json');
};

const saveImageToLocal = async (imageData: Uint8Array, fileName: string, ext: string): Promise<string> => {
  try {
    // 确保 images 目录存在
    const imagesDir = path.join(app.getPath('userData'), 'images');
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }
    let uniqueFileName: string;
    if (!fileName.includes('.')) {
      uniqueFileName = `${fileName}.${ext}`;
    } else {
      uniqueFileName = fileName;
    }

    // 缓存图片
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

const saveImagesAndCategories = async (images: LocalImageData[], categories: Category[]): Promise<boolean> => {
    const imageDAO = DAOFactory.getImageDAO();
    const indexedCategories = categories.map((it, index) => ({
      ...it,
      order: index
    }));
    await imageDAO.saveImagesAndCategories(images, indexedCategories);
    imageCountManager.updateCount(images.length);
    return true;
}

const readImagesFromFolder = async (folderPath: string)=>{
  try {
    const [files, _category] = await processDirectoryFiles(folderPath);

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

    imageCountManager.updateCount(imageCountManager.getCount() + files.length);

    return {
      category,
      images: files
    };
  } catch (error) {
    logger.error('读取文件夹图片失败:', { error } as LogMeta);
    throw error;
  }
}

const saveCategories = async (categories: Category[]): Promise<{
  success: boolean;
  error?: string;
}> => {
  const categoryDAO = DAOFactory.getCategoryDAO();
  const indexedCategories = categories.map((it, index) => ({
    ...it,
    order: index
  }));
  const success = await categoryDAO.saveCategories(indexedCategories);
  return { success };
}

const imageCountManager = {
  count: 0,
  oldCount: 0,
  db: null as ImageDatabase | null,
  async init() {
    this.db = ImageDatabase.getInstance();
    const data = await loadImagesData(isReadFromDB());
    this.count = data.images.length;
    const dbCount = await this.db.getImagesLength();
    if(this.count >= MAX_IMAGE_COUNT && this.count !== dbCount && this.oldCount !== 0){
      this.syncDatabaseFromLocalJson();
    }
  },

  async syncDatabaseFromLocalJson(){
    const db = ImageDatabase.getInstance();
    const jsonPath = getJsonFilePath();
    const { images, categories } = await db.syncDatabaseFromLocalJson(jsonPath);
    return { images, categories };
  },
  
  async exportDatabaseToLocalJson(){
    const db = ImageDatabase.getInstance();
    const jsonPath = getJsonFilePath();
    const { images, categories } = await db.exportDatabaseToLocalJson(jsonPath);
    return { images, categories };
  },
  
  updateCount(newCount: number) {
    this.oldCount = this.count;
    this.count = newCount;
    if (this.oldCount >= MAX_IMAGE_COUNT && this.count < MAX_IMAGE_COUNT) {
      this.exportDatabaseToLocalJson();
    } else if (this.count >= MAX_IMAGE_COUNT && this.oldCount < MAX_IMAGE_COUNT && this.oldCount !== 0) {
      console.log('---delete---')
      this.syncDatabaseFromLocalJson();
    }
  },
  
  getCount() {
    return this.count;
  }
};

imageCountManager.init();

async function loadImagesData(loadFromDB: boolean = false): Promise<ImageData> {
  try {
    if (loadFromDB) {
      const imageDAO = DAOFactory.getImageDAO();
      const { images, categories } = await imageDAO.getImagesAndCategories();
      const sortedCategories = categories.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      return { images, categories: sortedCategories };
    }

    const imagesJsonPath = getJsonFilePath();

    if (!fs.existsSync(imagesJsonPath)) {
      const initialData: ImageData = mockImagesContent;
      fs.writeFileSync(imagesJsonPath, JSON.stringify(initialData, null, 2));
      return initialData;
    }

    const text = fs.readFileSync(imagesJsonPath, 'utf8');

    if (!text || text.trim() === '') {
      const initialData: ImageData = { images: [], categories: [] };
      fs.writeFileSync(imagesJsonPath, JSON.stringify(initialData, null, 2));
      return initialData;
    }

    try {
      const data = JSON.parse(text);
      imageCountManager.updateCount(data.images.length);
      return data;
    } catch (parseError) {
      logger.error('JSON 解析失败，恢复到初始状态', { error: parseError } as LogMeta);
      const initialData: ImageData = { images: [], categories: [] };
      fs.writeFileSync(imagesJsonPath, JSON.stringify(initialData, null, 2));
      return initialData;
    }
  } catch (error) {
    logger.error('读取图片数据失败:', { error } as LogMeta);
    throw error;
  }
}

async function getImageById(id: string): Promise<LocalImageData | undefined> {
  const data = await loadImagesData(isReadFromDB());
  return data.images.find(img => img.id === id);
}

async function getImagesByIds(ids: string[]): Promise<LocalImageData[]> {
  const data = await loadImagesData(isReadFromDB());
  return data.images.filter(img => ids.includes(img.id));
}

async function deletePhysicalFile(filePath: string): Promise<boolean> {
  try {
    // 解码文件路径并移除 local-image:// 前缀
    const localPath = decodeURIComponent(filePath.replace('local-image://', ''));
    
    // 检查文件是否存在
    if (fs.existsSync(localPath)) {
      await fs.promises.unlink(localPath);
      logger.info(`物理文件删除成功: ${localPath}`);
      return true;
    } else {
      logger.warn(`文件不存在: ${localPath}`);
      return false;
    }
  } catch (error) {
    logger.error(`删除物理文件失败: ${filePath}`, { error } as LogMeta);
    throw error;
  }
}

async function showDialog() {
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: '媒体文件', extensions: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'avi', 'webm'] }
    ]
  });

  if (result.canceled) {
    return [];
  }

  // 处理选中的文件
  const fileMetadata = await Promise.all(
    result.filePaths.map(async (filePath): Promise<FileMetadata> => {
      const stats = await fsPromises.stat(filePath);
      const localImageUrl = `local-image://${encodeURIComponent(filePath)}`;
      const ext = path.extname(filePath).toLowerCase();
      const isVideo = ['.mp4', '.mov', '.avi', '.webm'].includes(ext);

      const metadata: FileMetadata = {
        id: Date.now().toString(),
        path: localImageUrl,
        name: path.basename(filePath, ext),
        extension: ext.slice(1),
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
          logger.error('处理视频元数据失败:', { error } as LogMeta);
        }
      }

      return metadata;
    })
  );

  return fileMetadata;
}

export {
  saveImageToLocal,
  loadImagesData,
  getJsonFilePath,
  getImageById,
  getImagesByIds,
  deletePhysicalFile,
  saveImagesAndCategories,
  saveCategories,
  readImagesFromFolder,
  showDialog,
  imageCountManager
} 