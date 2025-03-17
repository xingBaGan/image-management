import { BrowserWindow } from 'electron';

const generateHashId = (filePath: string, fileSize: number): string => {
    const str = `${filePath}-${fileSize}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
};

function notifyAllWindows(name: string, data: any): void {
  const windows = BrowserWindow.getAllWindows();
  windows.forEach(window => {
    window.webContents.send(name, data);
  });
}

function getReadableFilePath(filePath: string): string {
  return decodeURIComponent(filePath.replace('local-image://', '')).replace(/\\/g, '/').replace(/\//g, '\\');
}

export {
    generateHashId,
    notifyAllWindows,
    getReadableFilePath
} 