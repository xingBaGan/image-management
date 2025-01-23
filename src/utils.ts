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

export const handleDrop = async (e: React.DragEvent, addImages: (newImages: any[]) => void) => {
  e.preventDefault();
  const files = e.dataTransfer.files;
  const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));

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
        type: 'image' as const,
      };
    }));

    addImages(newImages);
  }
}; 