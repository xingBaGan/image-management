const mockTranslateTags = jest.fn();
const mockResolveTagInputPipeline = jest.fn();
const mockLoggerError = jest.fn();

jest.mock('../../../script/script.cjs', () => ({
  translateTags: mockTranslateTags,
}));

jest.mock('../../services/logService.cjs', () => ({
  logger: {
    error: mockLoggerError,
    info: jest.fn(),
  },
}));

jest.mock('../../services/tagTranslate.cjs', () => ({
  resolveTagInputPipeline: mockResolveTagInputPipeline,
}));

const { handleResolveTagInput } = require('../../services/resolveTagInput.cts');

describe('ipcService resolve-tag-input handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns trimmed input and skips pipeline work for unsupported target languages', async () => {
    await expect(handleResolveTagInput(' 猫 ', 'zh')).resolves.toBe('猫');
    expect(mockResolveTagInputPipeline).not.toHaveBeenCalled();
  });

  it('delegates supported English canonicalization requests to the resolver pipeline', async () => {
    mockResolveTagInputPipeline.mockResolvedValue('cat');
    await expect(handleResolveTagInput('猫', 'en')).resolves.toBe('cat');
    expect(mockResolveTagInputPipeline).toHaveBeenCalledWith('猫', 'en', expect.any(Function));
  });
});
