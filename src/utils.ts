import { defaultModel } from './config.ts';
import { LocalImageData } from './types/index.ts';
import { Category } from './types/index.ts';
import { ImageInfo } from './types/index.ts';

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

export const getVideoDuration = async (file: File) => {
  const video = document.createElement('video');
  video.src = URL.createObjectURL(file);
  await video.play();
  return video.duration;
};

export const processImages = async (files: File[], existingImages: ImageInfo[], categories: Category[]): Promise<LocalImageData[]> => {
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
    const tags = autoTaggingEnabled ? await window.electron.tagImage(file.path, defaultModel) : [];
    return {
      id: newId,
      path: 'local-image://' + file.path,
      name: file.name,
      size: file.size,
      dateCreated: new Date().toISOString(),
      dateModified: new Date(file.lastModified).toISOString(),
      tags,
      favorite: false,
      categories: [],
      type: type as 'image' | 'video',
      duration: type === 'video' ? await getVideoDuration(file) : undefined,
      thumbnail: type === 'video' ? await generateVideoThumbnail(file) : undefined,
    };
  }));

  const localImageDataList: LocalImageData[] = [...(existingImages || []), ...updatedImages];

  await window.electron.saveImagesToJson(localImageDataList, categories);
  return updatedImages;
};

export const handleDrop = async (
  e: React.DragEvent,
  addImages: (newImages: LocalImageData[]) => void,
  existingImages: ImageInfo[],
  categories: Category[], 
  setIsTagging: (isTagging: boolean) => void
) => {
  e.preventDefault();
  const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/') || file.type.startsWith('video/'));
  setIsTagging(true);
  const newImages = await processImages(files, existingImages, categories);
  addImages(newImages);
  setIsTagging(false);
};

export const generateVideoThumbnail = async (file: File): Promise<string> => {
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
        resolve(thumbnail);
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