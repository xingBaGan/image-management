const mockReadFileSync = jest.fn();
const mockWriteFile = jest.fn();
const mockYamlParse = jest.fn();
const mockLoggerInfo = jest.fn();
const mockLoggerError = jest.fn();

jest.mock('fs', () => ({
  __esModule: true,
  default: {
    readFileSync: mockReadFileSync,
  },
  readFileSync: mockReadFileSync,
}));

jest.mock('fs/promises', () => ({
  __esModule: true,
  default: {
    writeFile: mockWriteFile,
  },
  writeFile: mockWriteFile,
}));

jest.mock('yaml', () => ({
  __esModule: true,
  default: {
    parse: mockYamlParse,
  },
  parse: mockYamlParse,
}));

jest.mock('../../services/logService.cjs', () => ({
  logger: {
    info: mockLoggerInfo,
    error: mockLoggerError,
  },
}));

const flushAsyncWork = async (): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 0));
  await new Promise(resolve => setTimeout(resolve, 0));
};

describe('tagTranslate pipeline', () => {
  const originalLifecycleScript = process.env.npm_lifecycle_script;

  beforeEach(() => {
    process.env.npm_lifecycle_script = 'development';
    jest.resetModules();
    jest.clearAllMocks();
    mockReadFileSync.mockReturnValue('dictionary-yaml');
  });

  afterEach(() => {
    process.env.npm_lifecycle_script = originalLifecycleScript;
  });

  it('returns underscore canonical English from a Chinese dictionary hit', async () => {
    mockYamlParse.mockReturnValue([
      {
        groups: [
          {
            tags: {
              'white hair': '白发',
              white_hair: '白发',
            },
          },
        ],
      },
    ]);

    const { resolveTagInputPipeline } = require('../../services/tagTranslate.cts');
    const fallback = jest.fn();

    await expect(resolveTagInputPipeline('白发', 'en', fallback)).resolves.toBe('white_hair');
    expect(fallback).not.toHaveBeenCalled();
  });

  it('normalizes fallback English output into canonical tag format', async () => {
    mockYamlParse.mockReturnValue([]);

    const { resolveTagInputPipeline } = require('../../services/tagTranslate.cts');
    const fallback = jest.fn().mockResolvedValue(['Blue Eyes']);

    await expect(resolveTagInputPipeline('蓝眼', 'en', fallback)).resolves.toBe('blue_eyes');
    expect(fallback).toHaveBeenCalledWith('蓝眼', 'en');
  });

  it('logs cache flush failures and keeps later writes alive', async () => {
    mockYamlParse.mockReturnValue([]);
    mockWriteFile.mockRejectedValueOnce(new Error('disk full')).mockResolvedValueOnce(undefined);

    const { translateTagsPipeline } = require('../../services/tagTranslate.cts');

    await expect(translateTagsPipeline(['blue_eyes'], 'zh', async () => ['蓝眼'])).resolves.toEqual(['蓝眼']);
    await expect(translateTagsPipeline(['green_hair'], 'zh', async () => ['绿发'])).resolves.toEqual(['绿发']);

    await flushAsyncWork();

    expect(mockLoggerError).toHaveBeenCalledWith(
      '写入标签翻译缓存失败:',
      expect.objectContaining({
        error: expect.any(Error),
      })
    );
    expect(mockWriteFile).toHaveBeenCalledTimes(2);
  });
});
