import {
  getDisplayTags,
  needsChineseTagTranslation,
  persistTagTranslation,
  requestChineseTagTranslation,
} from '@/services/tagTranslationService';
import { Category, ElectronAPI, LocalImageData } from '@/types/index';

const mockTranslateTags = jest.fn() as jest.MockedFunction<ElectronAPI['translateTags']>;
const mockUpdateTagTranslation = jest.fn() as jest.MockedFunction<ElectronAPI['imageAPI']['updateTagTranslation']>;

describe('tagTranslationService', () => {
  const baseImage: LocalImageData = {
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

  beforeEach(() => {
    window.electron = {
      translateTags: mockTranslateTags,
      imageAPI: {
        updateTagTranslation: mockUpdateTagTranslation,
      },
    } as unknown as ElectronAPI;

    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns true when zh tags should be translated for Chinese display', () => {
    expect(needsChineseTagTranslation(baseImage, 'zh')).toBe(true);
  });

  it('returns false when Chinese translations already exist', () => {
    expect(
      needsChineseTagTranslation(
        {
          ...baseImage,
          tagTranslations: {
            zh: ['猫', '树'],
          },
        },
        'zh'
      )
    ).toBe(false);
  });

  it('returns false when the current language is not Chinese', () => {
    expect(needsChineseTagTranslation(baseImage, 'en')).toBe(false);
  });

  it('prefers zh display tags when available', () => {
    expect(
      getDisplayTags(
        {
          ...baseImage,
          tagTranslations: {
            zh: ['猫', '树'],
          },
        },
        'zh'
      )
    ).toEqual(['猫', '树']);
  });

  it('falls back to English tags when zh translations are unavailable', () => {
    expect(getDisplayTags(baseImage, 'zh')).toEqual(['cat', 'tree']);
    expect(getDisplayTags(baseImage, 'en')).toEqual(['cat', 'tree']);
  });

  it('requests zh tag translations through Electron', async () => {
    mockTranslateTags.mockResolvedValue(['猫', '树']);

    await expect(requestChineseTagTranslation(baseImage.tags)).resolves.toEqual(['猫', '树']);
    expect(mockTranslateTags).toHaveBeenCalledWith(['cat', 'tree'], 'zh');
  });

  it('returns an empty list when translation fails', async () => {
    mockTranslateTags.mockRejectedValue(new Error('translation failed'));

    await expect(requestChineseTagTranslation(baseImage.tags)).resolves.toEqual([]);
  });

  it('persists zh translations through the image API wrapper', async () => {
    const updatedImages: LocalImageData[] = [
      {
        ...baseImage,
        tagTranslations: {
          zh: ['猫', '树'],
        },
      },
    ];

    mockUpdateTagTranslation.mockResolvedValue(updatedImages);

    await expect(
      persistTagTranslation(baseImage.id, ['猫', '树'], [baseImage], categories)
    ).resolves.toEqual(updatedImages);

    expect(mockUpdateTagTranslation).toHaveBeenCalledWith(
      'image-1',
      'zh',
      ['猫', '树'],
      [baseImage],
      categories
    );
  });
});
