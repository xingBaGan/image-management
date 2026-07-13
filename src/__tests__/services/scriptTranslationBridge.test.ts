import { jest } from '@jest/globals';

jest.mock('python-shell', () => ({
  PythonShell: {
    run: jest.fn(),
  },
}));

describe('script translateTags bridge', () => {
  const originalLifecycleScript = process.env.npm_lifecycle_script;
  const originalConsoleError = console.error;
  const originalConsoleLog = console.log;

  beforeEach(() => {
    process.env.npm_lifecycle_script = 'development';
    jest.resetModules();
    jest.clearAllMocks();
    console.error = jest.fn();
    console.log = jest.fn();
  });

  afterEach(() => {
    process.env.npm_lifecycle_script = originalLifecycleScript;
    console.error = originalConsoleError;
    console.log = originalConsoleLog;
  });

  it('returns translated tags when the Python helper emits a success payload', async () => {
    const { PythonShell } = require('python-shell');
    PythonShell.run.mockResolvedValue(['{"success": true, "tags": ["猫", "树"]}']);

    const { translateTags } = require('../../../script/script.cjs');

    await expect(translateTags(['cat', 'tree'], 'zh')).resolves.toEqual(['猫', '树']);
  });

  it('returns an empty list when the Python helper emits a malformed payload', async () => {
    const { PythonShell } = require('python-shell');
    PythonShell.run.mockResolvedValue(['{"success": true}']);

    const { translateTags } = require('../../../script/script.cjs');

    await expect(translateTags(['cat', 'tree'], 'zh')).resolves.toEqual([]);
  });

  it('returns an empty list when the Python helper fails', async () => {
    const { PythonShell } = require('python-shell');
    PythonShell.run.mockRejectedValue(new Error('python failed'));

    const { translateTags } = require('../../../script/script.cjs');

    await expect(translateTags(['cat', 'tree'], 'zh')).resolves.toEqual([]);
  });
});
