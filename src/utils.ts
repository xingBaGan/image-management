import { LocalImageData, Category, ImportFile } from './types/index.ts';
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
      video.src = URL.createObjectURL(file);
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

export const getImageSize = async (file: File) => {
  let image = new Image();
  if (typeof file.path === 'string') {
    image.src = file.path;
  } else {
    image.src = URL.createObjectURL(file);
  }
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    image.onload = () => {
      resolve({ width: image.width, height: image.height })
      // 释放内存
      // image.src = '';
    };
    image.onerror = reject;
  });
};

export const processMedia = async (files: ImportFile[], existingImages: LocalImageData[], categories: Category[]): Promise<LocalImageData[]> => {
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
  const updatedImages = await Promise.all(filteredNewImages.map(async file => {
    const newId = generateHashId(file.path, file.size);
    const type = file.type.startsWith('video/') ? 'video' : 'image';
    const tags = autoTaggingEnabled && type === 'image' ? await window.electron.tagImage(file.path, defaultModel) : [];
    let imageSize = { width: 0, height: 0 };
    try {
      imageSize = await getImageSize(file);
    } catch (error) {
      console.error('获取图片尺寸失败', error);
    }
    const [thumbnail, width, height] = type === 'video' ? await generateVideoThumbnail(file) : [undefined, undefined, undefined];
    return {
      id: newId,
      path: file.path.includes('local-image://') ? file.path : 'local-image://' + file.path,
      name: file.name,
      size: file.size,
      dateCreated: new Date(file.dateCreated || '').toISOString(),
      dateModified: new Date(file.dateModified || file.lastModified || '').toISOString(),
      tags,
      favorite: false,
      categories: [],
      type: type as 'image' | 'video',
      duration: type === 'video' ? await getVideoDuration(file) : undefined,
      thumbnail: thumbnail,
      width: type === 'image' ? imageSize.width : width,
      height: type === 'image' ? imageSize.height : height,
      rate: 0,
    };
  }));

  const localImageDataList: LocalImageData[] = [...(existingImages || []), ...updatedImages];

  await window.electron.saveImagesToJson(localImageDataList, categories);
  return updatedImages;
};


export const handleDrop = async (
  e: React.DragEvent,
  addImages: (newImages: LocalImageData[]) => void,
  existingImages: LocalImageData[],
  categories: Category[],
  setIsTagging: (isTagging: boolean) => void,
) => {
  e.preventDefault();
  console.log('e:', e.dataTransfer.files);
  const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/') || file.type.startsWith('video/'));
  console.log('files:', files);
  const firstFile = e.dataTransfer.files[0].path;
  if (files.length > 0) {
    setIsTagging(true);
    const newImages = await processMedia(files as ImportFile[], existingImages, categories);
    addImages(newImages as LocalImageData[]);
    setIsTagging(false);
  } else {
    const images = await window.electron.processDirectoryToFiles(firstFile);
    console.log('files:', images);
    // const newImages = await processMedia(files, existingImages, categories);
    const newImages = [...images, ...existingImages];
    addImages(newImages as LocalImageData[]);
  }
};

export const generateVideoThumbnail = async (file: File): Promise<[string, number, number]> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.currentTime = 1; // Capture the thumbnail at 1 second

    video.onloadeddata = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnail = canvas.toDataURL('image/png');
        resolve([thumbnail, video.videoWidth, video.videoHeight]);
      } else {
        reject('Failed to get canvas context');
      }
    };

    video.onerror = (error) => {
      reject('Error loading video: ' + error);
    };
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