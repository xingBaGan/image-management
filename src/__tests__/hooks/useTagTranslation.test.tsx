import { renderHook, waitFor } from '@testing-library/react';
import { useTagTranslation } from '@/hooks/useTagTranslation';
import {
  needsChineseTagTranslation,
  persistTagTranslation,
  requestChineseTagTranslation,
} from '@/services/tagTranslationService';
import { Category, LocalImageData } from '@/types';

jest.mock('@/services/tagTranslationService', () => ({
  needsChineseTagTranslation: jest.fn(),
  requestChineseTagTranslation: jest.fn(),
  persistTagTranslation: jest.fn(),
}));

const mockNeedsChineseTagTranslation = needsChineseTagTranslation as jest.MockedFunction<
  typeof needsChineseTagTranslation
>;
const mockRequestChineseTagTranslation = requestChineseTagTranslation as jest.MockedFunction<
  typeof requestChineseTagTranslation
>;
const mockPersistTagTranslation = persistTagTranslation as jest.MockedFunction<
  typeof persistTagTranslation
>;

describe('useTagTranslation', () => {
  const image: LocalImageData = {
    id: 'image-1',
    name: 'sample.jpg',
    path: 'local-image://sample.jpg',
    size: 123,
    type: 'image',
    dateCreated: '2026-07-13',
    dateModified: '2026-07-13',
    extension: '.jpg',
    tags: ['cat', 'tree'],
    colors: [],
  };

  const categories: Category[] = [
    {
      id: 'category-1',
      name: 'Category 1',
      images: ['image-1'],
      count: 1,
    },
  ];

  const updatedImages: LocalImageData[] = [
    {
      ...image,
      tagTranslations: {
        zh: ['猫', '树'],
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockNeedsChineseTagTranslation.mockReturnValue(true);
    mockRequestChineseTagTranslation.mockResolvedValue(['猫', '树']);
    mockPersistTagTranslation.mockResolvedValue(updatedImages);
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('requests and persists Chinese tag translations, then updates in-memory images', async () => {
    const setImages = jest.fn();

    renderHook(() =>
      useTagTranslation({
        image,
        language: 'zh',
        images: [image],
        categories,
        setImages,
      })
    );

    await waitFor(() => {
      expect(mockRequestChineseTagTranslation).toHaveBeenCalledWith(['cat', 'tree']);
    });

    expect(mockNeedsChineseTagTranslation).toHaveBeenCalledWith(image, 'zh');
    expect(mockPersistTagTranslation).toHaveBeenCalledWith(
      'image-1',
      ['猫', '树'],
      [image],
      categories
    );
    expect(setImages).toHaveBeenCalledWith(updatedImages);
  });

  it('does nothing when translation is not needed', async () => {
    const setImages = jest.fn();
    mockNeedsChineseTagTranslation.mockReturnValue(false);

    renderHook(() =>
      useTagTranslation({
        image,
        language: 'en',
        images: [image],
        categories,
        setImages,
      })
    );

    await waitFor(() => {
      expect(mockNeedsChineseTagTranslation).toHaveBeenCalledWith(image, 'en');
    });

    expect(mockRequestChineseTagTranslation).not.toHaveBeenCalled();
    expect(mockPersistTagTranslation).not.toHaveBeenCalled();
    expect(setImages).not.toHaveBeenCalled();
  });

  it('avoids duplicate in-flight requests for the same selected image', async () => {
    const setImages = jest.fn();
    let resolveTranslation: ((value: string[]) => void) | undefined;

    mockRequestChineseTagTranslation.mockImplementation(
      () =>
        new Promise<string[]>((resolve) => {
          resolveTranslation = resolve;
        })
    );

    const { rerender } = renderHook(
      ({
        currentImage,
        currentImages,
      }: {
        currentImage: LocalImageData | null;
        currentImages: LocalImageData[];
      }) =>
        useTagTranslation({
          image: currentImage,
          language: 'zh',
          images: currentImages,
          categories,
          setImages,
        }),
      {
        initialProps: {
          currentImage: image,
          currentImages: [image],
        },
      }
    );

    await waitFor(() => {
      expect(mockRequestChineseTagTranslation).toHaveBeenCalledTimes(1);
    });

    rerender({
      currentImage: image,
      currentImages: [image],
    });

    expect(mockRequestChineseTagTranslation).toHaveBeenCalledTimes(1);

    resolveTranslation?.(['猫', '树']);

    await waitFor(() => {
      expect(mockPersistTagTranslation).toHaveBeenCalledTimes(1);
    });
  });

  it('does not persist partial translation results', async () => {
    const setImages = jest.fn();
    mockRequestChineseTagTranslation.mockResolvedValue(['猫']);

    renderHook(() =>
      useTagTranslation({
        image,
        language: 'zh',
        images: [image],
        categories,
        setImages,
      })
    );

    await waitFor(() => {
      expect(mockRequestChineseTagTranslation).toHaveBeenCalledWith(['cat', 'tree']);
    });

    expect(mockPersistTagTranslation).not.toHaveBeenCalled();
    expect(setImages).not.toHaveBeenCalled();
  });

  it('persists using the latest images list after async translation completes', async () => {
    const setImages = jest.fn();
    const anotherImage: LocalImageData = {
      ...image,
      id: 'image-2',
      name: 'another.jpg',
      path: 'local-image://another.jpg',
    };
    let resolveTranslation: ((value: string[]) => void) | undefined;

    mockRequestChineseTagTranslation.mockImplementation(
      () =>
        new Promise<string[]>((resolve) => {
          resolveTranslation = resolve;
        })
    );

    const { rerender } = renderHook(
      ({
        currentImage,
        currentImages,
      }: {
        currentImage: LocalImageData | null;
        currentImages: LocalImageData[];
      }) =>
        useTagTranslation({
          image: currentImage,
          language: 'zh',
          images: currentImages,
          categories,
          setImages,
        }),
      {
        initialProps: {
          currentImage: image,
          currentImages: [image],
        },
      }
    );

    await waitFor(() => {
      expect(mockRequestChineseTagTranslation).toHaveBeenCalledTimes(1);
    });

    rerender({
      currentImage: image,
      currentImages: [image, anotherImage],
    });

    resolveTranslation?.(['猫', '树']);

    await waitFor(() => {
      expect(mockPersistTagTranslation).toHaveBeenCalledWith(
        'image-1',
        ['猫', '树'],
        [image, anotherImage],
        categories
      );
    });
  });

  it('skips persisting when the current image tags changed during translation', async () => {
    const setImages = jest.fn();
    const updatedImage: LocalImageData = {
      ...image,
      tags: ['cat', 'tree', 'sky'],
    };
    let resolveTranslation: ((value: string[]) => void) | undefined;

    mockRequestChineseTagTranslation.mockImplementation(
      () =>
        new Promise<string[]>((resolve) => {
          resolveTranslation = resolve;
        })
    );

    const { rerender } = renderHook(
      ({
        currentImage,
        currentImages,
      }: {
        currentImage: LocalImageData | null;
        currentImages: LocalImageData[];
      }) =>
        useTagTranslation({
          image: currentImage,
          language: 'zh',
          images: currentImages,
          categories,
          setImages,
        }),
      {
        initialProps: {
          currentImage: image,
          currentImages: [image],
        },
      }
    );

    await waitFor(() => {
      expect(mockRequestChineseTagTranslation).toHaveBeenCalledTimes(1);
    });

    rerender({
      currentImage: updatedImage,
      currentImages: [updatedImage],
    });

    resolveTranslation?.(['猫', '树']);

    await waitFor(() => {
      expect(mockRequestChineseTagTranslation).toHaveBeenCalledTimes(1);
    });

    expect(mockPersistTagTranslation).not.toHaveBeenCalled();
    expect(setImages).not.toHaveBeenCalled();
  });

  it('logs and continues when translation orchestration fails', async () => {
    const setImages = jest.fn();
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockPersistTagTranslation.mockRejectedValue(new Error('persist failed'));

    renderHook(() =>
      useTagTranslation({
        image,
        language: 'zh',
        images: [image],
        categories,
        setImages,
      })
    );

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    expect(setImages).not.toHaveBeenCalled();
  });
});
