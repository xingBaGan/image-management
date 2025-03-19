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
import { isReadFromDB } from '../utils/index.cjs';
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
      const initialData: ImageData = { images: [], categories: [] };
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
      return JSON.parse(text);
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
  showDialog
} 