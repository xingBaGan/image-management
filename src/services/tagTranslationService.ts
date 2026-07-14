import { Category, LocalImageData } from '@/types/index';

const isChineseLanguage = (language: string): boolean => language.toLowerCase().startsWith('zh');
const hasCompleteChineseTagTranslation = (media: LocalImageData): boolean =>
  !!media.tags.length &&
  !!media.tagTranslations?.zh?.length &&
  media.tagTranslations.zh.length === media.tags.length;
const englishTagPattern = /^[A-Za-z0-9][A-Za-z0-9 _.,:'"()&/+\-]*$/;

export function hasLikelyEnglishTags(tags: string[]): boolean {
  return tags.length > 0 && tags.every(tag => englishTagPattern.test(tag.trim()));
}

export function looksCanonicalEnglishTag(input: string): boolean {
  const trimmed = input.trim();
  return !!trimmed && englishTagPattern.test(trimmed);
}

export function needsChineseTagTranslation(media: LocalImageData, language: string): boolean {
  return (
    isChineseLanguage(language) &&
    hasLikelyEnglishTags(media.tags) &&
    !hasCompleteChineseTagTranslation(media)
  );
}

export function getDisplayTags(media: LocalImageData, language: string): string[] {
  if (isChineseLanguage(language) && hasCompleteChineseTagTranslation(media)) {
    return media.tagTranslations?.zh ?? media.tags;
  }

  return media.tags;
}

export async function resolveCanonicalTagInput(input: string): Promise<string> {
  const trimmed = input.trim();
  if (!trimmed || looksCanonicalEnglishTag(trimmed)) {
    return trimmed;
  }

  try {
    const resolved = await window.electron.resolveTagInput(trimmed, 'en');
    return resolved.trim() || trimmed;
  } catch (error) {
    console.error('Error resolving canonical tag input:', error);
    return trimmed;
  }
}

export function getTagHoverText(
  tag: string,
  translatedTag: string | undefined,
  language: string
): string | undefined {
  if (!isChineseLanguage(language)) {
    return undefined;
  }
  if (!translatedTag || translatedTag === tag) {
    return undefined;
  }
  return translatedTag;
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
