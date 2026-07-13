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
  const latestImageRef = useRef<LocalImageData | null>(image);
  const latestImagesRef = useRef<LocalImageData[]>(images);
  const latestCategoriesRef = useRef<Category[]>(categories);

  latestImageRef.current = image;
  latestImagesRef.current = images;
  latestCategoriesRef.current = categories;

  useEffect(() => {
    if (!image || !needsChineseTagTranslation(image, language)) {
      return;
    }

    if (inFlightImageIdsRef.current.has(image.id)) {
      return;
    }

    inFlightImageIdsRef.current.add(image.id);

    const translateTags = async () => {
      const sourceTags = [...image.tags];

      try {
        const translatedTags = await requestChineseTagTranslation(sourceTags);

        if (!translatedTags.length || translatedTags.length !== sourceTags.length) {
          return;
        }

        const latestImage = latestImageRef.current;
        const tagsChanged =
          !latestImage ||
          latestImage.id !== image.id ||
          latestImage.tags.length !== sourceTags.length ||
          latestImage.tags.some((tag, index) => tag !== sourceTags[index]);

        if (tagsChanged) {
          return;
        }

        const updatedImages = await persistTagTranslation(
          image.id,
          translatedTags,
          latestImagesRef.current,
          latestCategoriesRef.current
        );
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
