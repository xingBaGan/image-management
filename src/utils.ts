import { LocalImageData, Category, ImportFile, ImportStatus } from './types/index.ts';
import { defaultModel } from './config';

export const generateHashId = (filePath: string, fileSize: number): string => {
  const str = `${filePath}-${fileSize}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
};

export const getVideoDuration = async (file: File | string) => {
  let video;
  try {
    if (typeof file === 'string') {
      video = document.createElement('video');
      video.src = file;
      video.muted = true;
      await video.play();
      return video.duration;
    } else {
      video = document.createElement('video');
      assignPathToMedia(file, video);
      video.muted = true;
      await video.play();
      return video.duration;
    }
  } finally {
    if (video) {
      video.src = '';
      video.load();
    }
  }
};

export const assignPathToMedia = (file: File, media: HTMLImageElement | HTMLVideoElement)=> {
  if (typeof file.path === 'string') {
    if (file.path.includes('local-image://')) {
      media.src = file.path;
    } else {
      media.src = 'local-image://' + file.path;
    }
  } else {
    media.src = URL.createObjectURL(file);
  }
}

export const getImageSize = async (file: File) => {
  let image = new Image();
  assignPathToMedia(file, image);
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    image.onload = () => {
      resolve({ width: image.width, height: image.height })
      // 释放内存
      // image.src = '';
    };
    image.onerror = reject;
  });
};

export const getMainColor = async (payload: File | string) => {
  const path = typeof payload === 'string' ? payload : payload.path;
  const colors = await window.electron.getMainColor(path);
  return colors;
};

export const getRatio = async (width: number, height: number) => {
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

export const processMedia = async (
  files: ImportFile[], 
  existingImages: LocalImageData[], 
  categories: Category[],
  setImportState: (importState: ImportStatus) => void,
  currentSelectedCategory?: Category,
  shouldSaveToLocal: boolean = true,
): Promise<LocalImageData[]> => {
  const existingIds = new Set((existingImages || []).map(img => img.id));
  const filteredNewImages = files.filter(file => {
    const newId = generateHashId(file.path, file.size);
    return !existingIds.has(newId);
  });

  if (filteredNewImages.length === 0) {
    console.log('所有图片都已经存在');
    return [];
  }

  const autoTaggingEnabled = (await window.electron.loadSettings()).autoTagging;
  const autoColorEnabled = (await window.electron.loadSettings()).autoColor;
  const updatedImages = await Promise.all(filteredNewImages.map(async file => {
    const newId = generateHashId(file.path, file.size);
    const type = file.type.startsWith('video') ? 'video' : 'image';
    const isVideo = type === 'video';
    const isImage = type === 'image';
    let tags: string[] = [];
    if (autoTaggingEnabled && isImage) {
      setImportState(ImportStatus.Tagging);
      tags = await window.electron.tagImage(file.path, defaultModel);
      // 按照字母顺序排序
      tags = tags.map(tag => tag.trim()).sort((a, b) => a.localeCompare(b));
    }
    let imageSize = { width: 0, height: 0 };
    try {
      isImage && (imageSize = await getImageSize(file));
    } catch (error) {
      console.error('获取图片尺寸失败', error);
    }
    let thumbnailItem: [string, number, number] | [undefined, undefined, undefined] = [undefined, undefined, undefined];
    try {
      thumbnailItem = isVideo ? await generateVideoThumbnail(file) : [undefined, undefined, undefined];
    } catch (error) {
      console.error('获取视频缩略图失败', error);
    }
    const [thumbnail, width, height] = thumbnailItem || [undefined, undefined, undefined];
    const extension = (file as any).extension || file.name.split('.').pop() || file.type.split('/').pop() || 'jpg';
    let colors: string[] = [];
    setImportState(ImportStatus.Importing);
    if (autoColorEnabled && isImage) {
      colors = await getMainColor(file);
    }
    const ratio = await getRatio(width || imageSize.width, height || imageSize.height);
    return {
      id: newId,
      ratio: ratio,
      path: file.path.includes('local-image://') ? file.path : 'local-image://' + file.path,
      name: file.name.includes('.') ? file.name : file.name + '.' + extension,
      extension: extension,
      size: file.size,
      dateCreated: new Date(file?.dateCreated || new Date()).toISOString(),
      dateModified: new Date(file?.dateModified || file?.lastModified || new Date()).toISOString(),
      tags: tags as string[],
      favorite: false,
      categories: [],
      type: type as 'image' | 'video',
      duration: isVideo ? await getVideoDuration(file) : undefined,
      thumbnail: thumbnail,
      width: isImage ? imageSize.width : width,
      height: isImage ? imageSize.height : height,
      rate: 0,
      colors: colors
    };
  }));

  const localImageDataList: LocalImageData[] = [...(existingImages || []), ...updatedImages];
  setImportState(ImportStatus.Imported);
  if (shouldSaveToLocal) {
    await window.electron.saveImagesToJson(localImageDataList, categories, currentSelectedCategory);
  }
  return updatedImages;
};


export const addImagesToCategory = async (newImages: LocalImageData[], categories: Category[], currentSelectedCategory?: Category) => {
  if (currentSelectedCategory) {
    const category = categories.find(cat => cat.id === currentSelectedCategory.id);
    // 拷贝绑定文件夹中的图片到当前分类中
    for (const img of newImages) {
      if (category) {
        category.images?.push(img.id);
        category.count = category.images.length;
        img.categories?.push(category.id);
      }
    }
  }
  return newImages;
}

export const handleDrop = async (
  e: React.DragEvent,
  addImages: (newImages: LocalImageData[]) => void,
  existingImages: LocalImageData[],
  categories: Category[],
  setImportState: (importState: ImportStatus) => void,
  currentSelectedCategory?: Category
) => {
  e.preventDefault();
  const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/') || file.type.startsWith('video/'));
  const dirPaths = Array.from(e.dataTransfer.files).filter(files => files.type === "");
  let images: LocalImageData[] = [];
  if (files.length > 0) {
    const newImages = await processMedia(files as ImportFile[], existingImages, categories, setImportState, currentSelectedCategory, false);
    await addImagesToCategory(newImages, categories, currentSelectedCategory);
    images.push(...newImages);
  }

  if (dirPaths.length > 0) {
    for (const file of dirPaths) {
      if ('path' in file) {
        setImportState(ImportStatus.Importing);
        const firstFile = file.path as string;
        const newImages = await window.electron.processDirectoryFiles(firstFile, currentSelectedCategory);
        await addImagesToCategory(newImages, categories, currentSelectedCategory);
        images.push(...newImages);
      }
    }

  }
  addImages(images);
  setImportState(ImportStatus.Imported);
};

// 添加压缩图片的辅助函数
const compressImage = (
  canvas: HTMLCanvasElement,
  maxWidth: number = 320,
  quality: number = 0.6
): string => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // 计算压缩后的尺寸
  let width = canvas.width;
  let height = canvas.height;
  if (width > maxWidth) {
    height = Math.floor((height * maxWidth) / width);
    width = maxWidth;
  }

  // 创建临时画布进行压缩
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return '';

  // 使用双线性插值算法进行缩放
  tempCtx.imageSmoothingEnabled = true;
  tempCtx.imageSmoothingQuality = 'high';
  tempCtx.drawImage(canvas, 0, 0, width, height);

  // 返回压缩后的 base64
  return tempCanvas.toDataURL('image/jpeg', quality);
};

export const generateVideoThumbnail = async (file: File | ImportFile): Promise<[string, number, number]> => {
  return new Promise((resolve, reject) => {
    // 设置10秒超时
    const timeout = setTimeout(() => {
      video.removeAttribute('src');
      video.load();
      reject('获取视频封面超时');
    }, 10000);

    const video = document.createElement('video');
    video.currentTime = 1;
    // 优化视频加载
    video.preload = 'metadata';
    video.playsInline = true;
    video.muted = true;
    
    // 设置事件处理
    const cleanupAndReject = (error: string) => {
      clearTimeout(timeout);
      video.removeAttribute('src');
      video.load();
      reject(error);
    };

    video.onloadeddata = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        
        if (!context) {
          cleanupAndReject('无法获取 canvas context');
          return;
        }

        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnail = compressImage(canvas, 320, 0.6);
        
        // 清理资源
        clearTimeout(timeout);
        video.removeAttribute('src');
        video.load();
        
        resolve([thumbnail, canvas.width, canvas.height]);
      } catch (error) {
        cleanupAndReject(`处理视频帧失败: ${error}`);
      }
    };

    video.onerror = () => {
      cleanupAndReject(`视频加载错误: ${video.error?.message || '未知错误'}`);
    };

    // 最后才设置视频源以触发加载
    assignPathToMedia(file, video);
  });
};

export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

export function formatDate(date: string | number | Date): string {
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * 将16进制颜色转换为RGB值
 */
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

/**
 * 计算两个颜色的相似度
 * @param color1 第一个颜色（16进制）
 * @param color2 第二个颜色（16进制）
 * @param precision 精度 (0.1 ~ 1)，值越大表示要求的相似度越高
 * @returns 如果颜色相似返回true，否则返回false
 */
export const isSimilarColor = (color1: string, color2: string, precision: number = 0.8): boolean => {
  // 确保精度在有效范围内
  precision = Math.max(0.1, Math.min(1, precision));
  
  // 转换为RGB
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return false;
  
  // 计算欧几里得距离
  const distance = Math.sqrt(
    Math.pow(rgb1.r - rgb2.r, 2) +
    Math.pow(rgb1.g - rgb2.g, 2) +
    Math.pow(rgb1.b - rgb2.b, 2)
  );
  
  // 最大可能距离是 sqrt(255^2 + 255^2 + 255^2) ≈ 441.67
  const maxDistance = Math.sqrt(3 * Math.pow(255, 2));
  
  // 计算相似度（0到1之间）
  const similarity = 1 - (distance / maxDistance);
  
  // 根据精度判断是否相似
  return similarity >= precision;
}; 