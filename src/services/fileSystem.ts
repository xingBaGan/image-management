interface FileSystemAPI {
  readDirectory: (path: string) => Promise<string[]>;
  readFileMetadata: (path: string) => Promise<any>;
}

declare global {
  interface Window {
    electronAPI: FileSystemAPI;
  }
}

export const readDirectory = async (path: string): Promise<string[]> => {
  if (window.electronAPI) {
    return await window.electronAPI.readDirectory(path);
  }
  throw new Error('Electron API not available');
};

export const readFileMetadata = async (path: string): Promise<any> => {
  if (window.electronAPI) {
    return await window.electronAPI.readFileMetadata(path);
  }
  throw new Error('Electron API not available');
};

export async function downloadImage(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl);

    const blob = await response.blob();
    
    const fileName = imageUrl.split('/').pop() || 'image.jpg';
    // 从Content-Type: 中获取文件后缀
    const contentType = response.headers.get('Content-Type');
    const ext = contentType?.split('/').pop() || fileName.split('.').pop() || 'jpg';

    // 将 blob 转换为 Uint8Array
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // 保存到本地，返回本地路径
    const localPath = await window.electron.saveImageToLocal(uint8Array, fileName, ext);
    
    return localPath;
  } catch (error) {
    console.error('下载图片失败:', error);
    throw error;
  }
}

export function isRemoteUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://');
}
