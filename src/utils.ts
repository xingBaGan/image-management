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

export const handleDrop = async (e: React.DragEvent, addImages: (newImages: any[]) => void) => {
  e.preventDefault();
  const files = e.dataTransfer.files;
  const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/') || file.type.startsWith('video/'));

  if (imageFiles.length > 0) {
    const newImages = await Promise.all(imageFiles.map(async (file) => {
      let filePath = file.path;
      const fileName = file.name;
      const fileSize = file.size;
      const dateModified = file.lastModified;
      const dateCreated = new Date().toISOString();
      filePath = `local-image://${filePath}`
      const id = generateHashId(filePath, fileSize);
      return {
        id,
        path: filePath,
        name: fileName,
        size: fileSize,
        dateCreated: dateCreated,
        dateModified: new Date(dateModified).toISOString(),
        tags: [],
        favorite: false,
        categories: [],
        type: file.type.startsWith('video/') ? 'video' : 'image',
        duration: file.type.startsWith('video/') ? await getVideoDuration(file) : undefined,
        thumbnail: file.type.startsWith('video/') ? await generateVideoThumbnail(file) : undefined,
      };
    }));

    addImages(newImages);
  }
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