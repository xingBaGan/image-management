import { Category, LocalImageData } from '@/types/index';

const isChineseLanguage = (language: string): boolean => language.toLowerCase().startsWith('zh');
const hasCompleteChineseTagTranslation = (media: LocalImageData): boolean =>
  !!media.tags.length &&
  !!media.tagTranslations?.zh?.length &&
  media.tagTranslations.zh.length === media.tags.length;

export function needsChineseTagTranslation(media: LocalImageData, language: string): boolean {
  return isChineseLanguage(language) && media.tags.length > 0 && !hasCompleteChineseTagTranslation(media);
}

export function getDisplayTags(media: LocalImageData, language: string): string[] {
  if (isChineseLanguage(language) && hasCompleteChineseTagTranslation(media)) {
    return media.tagTranslations?.zh ?? media.tags;
  }

  return media.tags;
}

export async function requestChineseTagTranslation(tags: string[]): Promise<string[]> {
  if (!tags.length) {
    return [];
  }

  try {
    return await window.electron.translateTags(tags, 'zh');
  } catch (error) {
    console.error('Error requesting Chinese tag translation:', error);
    return [];
  }
}

export async function persistTagTranslation(
  mediaId: string,
  translatedTags: string[],
  images: LocalImageData[],
  categories: Category[]
): Promise<LocalImageData[]> {
  return await window.electron.imageAPI.updateTagTranslation(mediaId, 'zh', translatedTags, images, categories);
}
