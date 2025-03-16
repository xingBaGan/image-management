import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from './logService.cjs';
import { promises as fsPromises } from 'fs';
import { Category } from '../dao/type';
import { 
  processDirectoryFiles 
} from './mediaService.cjs';
interface ImageData {
  images: any[];
  categories: any[];
}

interface LogMeta {
  [key: string]: any;
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

const saveImagesAndCategories = async (images: any[], categories: any[]): Promise<boolean> => {
  const jsonPath = getJsonFilePath();
  const tempPath = path.join(app.getPath('userData'), 'images.json.temp');
  // 先写入临时文件
  const jsonData = JSON.stringify({ images, categories }, null, 2);
  await fsPromises.writeFile(tempPath, jsonData, 'utf-8');

  // 验证临时文件的完整性
  try {
    const tempContent = await fsPromises.readFile(tempPath, 'utf-8');
    JSON.parse(tempContent); // 验证 JSON 格式是否正确
  } catch (error) {
    throw new Error('临时文件写入验证失败');
  }

  // 如果验证成功，替换原文件
  await fsPromises.rename(tempPath, jsonPath);

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
  try {
    const filePath = getJsonFilePath();
    const existingData = JSON.parse(await fsPromises.readFile(filePath, 'utf8'));
    existingData.categories = categories;
    await fsPromises.writeFile(filePath, JSON.stringify(existingData, null, 2));
    return { success: true };
  } catch (error) {
    logger.error('保存分类数据失败:', { error } as LogMeta);
    throw error;
  }
}

function loadImagesData(): ImageData {
  try {
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

function getImageById(id: string): any | undefined {
  const data = loadImagesData();
  return data.images.find(img => img.id === id);
}

function getImagesByIds(ids: string[]): any[] {
  const data = loadImagesData();
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

export {
  saveImageToLocal,
  loadImagesData,
  getJsonFilePath,
  getImageById,
  getImagesByIds,
  deletePhysicalFile,
  saveImagesAndCategories,
  saveCategories,
  readImagesFromFolder
} 