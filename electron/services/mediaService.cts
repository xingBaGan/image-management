import { app } from 'electron';
import * as probe from 'probe-image-size';
import ffmpeg from 'fluent-ffmpeg';
import * as path from 'path';
import * as fs from 'fs';
import { promises as fsPromises } from 'fs';
import { generateHashId } from '../utils/index.cjs';

const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path.replace('app.asar', 'app.asar.unpacked');
const ffprobePath = require('@ffprobe-installer/ffprobe').path.replace('app.asar', 'app.asar.unpacked');
const isDev = !app.isPackaged;

// 设置 ffmpeg 和 ffprobe 路径
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

interface ImageSize {
  width: number;
  height: number;
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
  ratio?: string;
  favorite: boolean;
  categories: string[];
  width: number;
  height: number;
  type: 'video' | 'image';
  thumbnail?: string;
  duration?: number;
  isBindInFolder: boolean;
}

interface Category {
  isImportFromFolder?: boolean;
  [key: string]: any;
}

const { supportedExtensions } = isDev
  ? require(path.join(__dirname, '../../', 'config.cjs'))  // 开发环境
  : require(path.join(process.resourcesPath, 'config.cjs'));  // 生产环境

// 获取视频时长
const getVideoDuration = (filePath: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err: Error | null, metadata: any) => {
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
const generateVideoThumbnail = (filePath: string): Promise<string> => {
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
        fs.readFile(thumbnailPath, (err: NodeJS.ErrnoException | null, data: Buffer) => {
          if (err) {
            console.error('读取缩略图失败:', err);
            reject(err);
            return;
          }
          const base64 = `data:image/png;base64,${data.toString('base64')}`;
          resolve(base64);
        });
      })
      .on('error', (err: Error) => {
        console.error('生成缩略图失败:', err);
        reject(err);
      });
  });
};

const getImageSize = async (filePath: string): Promise<ImageSize> => {
  try {
    // 处理 base64 图片
    if (filePath.startsWith('data:image')) {
      const base64 = filePath.split(',')[1];
      const buffer = Buffer.from(base64, 'base64');
      const dimensions = probe.sync(buffer);
      return {
        width: dimensions?.width || 0,
        height: dimensions?.height || 0,
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

const getRatio = async (width: number, height: number): Promise<string> => {
  const ratio = width / height;
  // ['4:3', '16:9', '1:1', '3:4', '9:16']
  const ratios = ['4:3', '16:9', '1:1', '3:4', '9:16'];
  const closestRatio = ratios.reduce((prev, curr) => {
    const [prevWidth, prevHeight] = prev.split(':').map(Number);
    const [currWidth, currHeight] = curr.split(':').map(Number);
    const prevRatio = prevWidth / prevHeight;
    const currRatio = currWidth / currHeight;
    return (Math.abs(ratio - prevRatio) < Math.abs(ratio - currRatio) ? prev : curr);
  });
  return closestRatio;
};

const processDirectoryFiles = async (
  dirPathOrPaths: string | string[],
  currentCategory: Category | null = {}
): Promise<[FileMetadata[], Category]> => {
  if (!dirPathOrPaths) return [[], {} as Category];
  const processedFiles: FileMetadata[] = [];
  if (!Array.isArray(dirPathOrPaths)) {
    dirPathOrPaths = [dirPathOrPaths];
  }

  try {
    for (const dirPath of dirPathOrPaths) {
      const stats = await fsPromises.stat(dirPath);
      if (stats.isDirectory()) {
        const files = await fsPromises.readdir(dirPath);
        for (const file of files) {
          try {
            const filePath = path.join(dirPath, file);
            const _stats = await fsPromises.stat(filePath);

            if (_stats.isDirectory()) {
              // 递归处理子文件夹
              const [subDirFiles, subDirCategory] = await processDirectoryFiles(filePath, currentCategory);
              processedFiles.push(...subDirFiles);
              currentCategory = subDirCategory;
            } else if (_stats.isFile()) {
              const [metadata, category] = await getMetadataByFilePath(filePath, _stats, currentCategory);
              if (metadata && category) {
                currentCategory = category;
                processedFiles.push(metadata);
              }
            }
          } catch (error) {
            console.error(`处理文件 ${file} 时出错:`, error);
            continue;
          }
        }
      } else {
        const [metadata, category] = await getMetadataByFilePath(dirPath, stats, currentCategory);
        if (metadata && category) {
          currentCategory = category;
          processedFiles.push(metadata);
        }
      }
    }

    return [processedFiles, currentCategory || {} as Category];
  } catch (error) {
    console.error('处理目录失败:', error);
    throw error;
  }
};

const getMetadataByFilePath = async (
  filePath: string,
  stats: fs.Stats,
  currentCategory: Category | null = {}
): Promise<[FileMetadata | undefined, Category | undefined]> => {
  const ext = path.extname(filePath).toLowerCase();
  if (!supportedExtensions.includes(ext)) return [undefined, undefined];
  const isVideo = ['.mp4', '.mov', '.avi', '.webm'].includes(ext);
  const localImageUrl = `local-image://${encodeURIComponent(filePath)}`;
  const thumbnail = isVideo ? await generateVideoThumbnail(filePath) : undefined;
  let imageSize = await getImageSize(filePath);
  imageSize = isVideo ? await getImageSize(thumbnail || '') : imageSize;
  const id = generateHashId(filePath, stats.size);
  const ratio = await getRatio(imageSize.width, imageSize.height);
  let isImportFromFolder = false;
  
  if (currentCategory === null) {
    const watchService = require('./watchService.cjs');
    const category = watchService.getWatchCategory(filePath);
    if (category) {
      isImportFromFolder = true;
      currentCategory = category;
    }
  } else {
    isImportFromFolder = currentCategory.isImportFromFolder ? true : false;
  }

  const metadata: FileMetadata = {
    id: id,
    path: localImageUrl,
    name: path.basename(filePath, ext), // 移除扩展名
    extension: ext.slice(1), // 移除点号
    size: stats.size,
    dateCreated: stats.birthtime.toISOString(),
    dateModified: stats.mtime.toISOString(),
    tags: [],
    ratio: ratio,
    favorite: false,
    categories: [],
    width: imageSize.width,
    height: imageSize.height,
    type: isVideo ? 'video' : 'image',
    thumbnail: thumbnail,
    duration: isVideo ? await getVideoDuration(filePath) : undefined,
    isBindInFolder: isImportFromFolder,
  };

  return [metadata, currentCategory || {} as Category];
}

export {
  getVideoDuration,
  generateVideoThumbnail,
  getImageSize,
  processDirectoryFiles,
  FileMetadata,
  Category,
  ImageSize
}; 