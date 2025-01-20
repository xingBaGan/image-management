interface CompressOptions {
  maxSize?: number;    // 最大尺寸
  quality?: number;    // 压缩质量 0-1
  maxSizeKB?: number; // 目标文件大小（KB）
  ext?: string; // 文件扩展名
}

export const compressImage = async (
  file: Uint8Array | string, 
  options: CompressOptions = {}
): Promise<string> => {
  const {
    maxSize = 1024,
    quality = 0.7,
    maxSizeKB = 1024, // 默认1MB
    ext = 'jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      let currentQuality = quality;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      // 计算压缩后的尺寸
      let width = img.width;
      let height = img.height;
      
      if (width > height && width > maxSize) {
        height = Math.round((height * maxSize) / width);
        width = maxSize;
      } else if (height > maxSize) {
        width = Math.round((width * maxSize) / height);
        height = maxSize;
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      // 递归压缩直到文件大小符合要求
      const compressRecursive = (q: number) => {
        const base64 = canvas.toDataURL('image/' + ext, q);
        
        // 计算大约的文件大小（KB）
        const sizeInKB = Math.round((base64.length * 3) / 4) / 1024;
        
        if (sizeInKB > maxSizeKB && q > 0.1) {
          // 如果文件仍然太大，继续压缩
          compressRecursive(q - 0.1);
        } else {
          resolve(base64);
        }
      };

      compressRecursive(currentQuality);
    };

    img.onerror = reject;

    if (typeof file === 'string') {
      img.src = file;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => img.src = e.target?.result as string;
      reader.readAsDataURL(new Blob([file]));
    }
  });
};
