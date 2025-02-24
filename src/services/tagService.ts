import { ImportStatus, LocalImageData } from '../types';
import { getMainColor } from '../utils';

const baseUrl = 'http://localhost:3000';

async function getLocalImagePath(imagePath: string): Promise<string> {
  // 如果是本地路径，直接解码
  return decodeURIComponent(imagePath.replace('local-image://', ''));
}

export async function generateImageTags(imagePath: string): Promise<string[]> {
  try {
    // 获取本地图片路径
    const localPath = await getLocalImagePath(imagePath);
    
    const response = await fetch(`${baseUrl}/api/tagger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imagePath: localPath
      })
    });

    const result = await response.json();
    
    if (result.success && result.data?.outputs?.tags) {
      return result.data.outputs.tags[0].split(',').map((tag: string) => tag.trim());
    }
    
    return [];
  } catch (error) {
    console.error(`生成图片标签失败:`, error);
    return [];
  }
}

export async function addTagsToImages(
  selectedImages: LocalImageData[], 
  allImages: LocalImageData[],
  categories: any[],
  modelName: string,
  setImportState: (importState: ImportStatus) => void
): Promise<{
  updatedImages: LocalImageData[],
  success: boolean
}> {
  try {
    setImportState(ImportStatus.Tagging);
    // 对每个选中的图片调用 tagger API
    let finalImages: LocalImageData[] = allImages;
    const tagsImages: LocalImageData[] = [];
    await Promise.all(
      selectedImages.map(async (image, index) => {
        const imagePath = await getLocalImagePath(image.path);
        const newTags = await window.electron.tagImage(imagePath, modelName);
        // 按照字母顺序排序
        const sortedTags = newTags.map(tag => tag.trim()).sort((a, b) => a.localeCompare(b));
        if (!image?.colors?.length) {
          const colors = await getMainColor(imagePath);
          image.colors = colors;
        }

        if (newTags.length > 0) {
          // 合并现有标签和新标签，去重
          image = {
            ...image,
            tags: [...new Set([...image.tags, ...sortedTags])]
          };
        }
        tagsImages.push(image);
        // 每10次保存一次
        if ((index + 1) % 10 === 0 || index === selectedImages.length - 1) {
          finalImages = finalImages.map(img => {
            const updatedImg = tagsImages.find(updated => updated?.id === img.id);
            return updatedImg || img;
          });
        
          await window.electron.saveImagesToJson(finalImages, categories);
        }

        return image;
      })
    );

    setImportState(ImportStatus.Imported);
    return {
      updatedImages: finalImages,
      success: true
    };
  } catch (error) {
    console.error('批量添加标签失败:', error);
    return {
      updatedImages: allImages,
      success: false
    };
  }
}
