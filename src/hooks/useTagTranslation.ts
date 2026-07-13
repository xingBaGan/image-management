import { useEffect, useRef } from 'react';
import { Category, LocalImageData } from '@/types';
import {
  needsChineseTagTranslation,
  persistTagTranslation,
  requestChineseTagTranslation,
} from '@/services/tagTranslationService';

interface UseTagTranslationParams {
  image: LocalImageData | null;
  language: string;
  images: LocalImageData[];
  categories: Category[];
  setImages: React.Dispatch<React.SetStateAction<LocalImageData[]>>;
}

export function useTagTranslation({
  image,
  language,
  images,
  categories,
  setImages,
}: UseTagTranslationParams): void {
  const inFlightImageIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!image || !needsChineseTagTranslation(image, language)) {
      return;
    }

    if (inFlightImageIdsRef.current.has(image.id)) {
      return;
    }

    inFlightImageIdsRef.current.add(image.id);

    const translateTags = async () => {
      try {
        const translatedTags = await requestChineseTagTranslation(image.tags);

        if (!translatedTags.length) {
          return;
        }

        const updatedImages = await persistTagTranslation(image.id, translatedTags, images, categories);
        setImages(updatedImages);
      } catch (error) {
        console.error('Error orchestrating Chinese tag translation:', error);
      } finally {
        inFlightImageIdsRef.current.delete(image.id);
      }
    };

    void translateTags();
  }, [categories, image, images, language, setImages]);
}
