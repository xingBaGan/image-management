import { jest } from '@jest/globals';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';

jest.mock('python-shell', () => ({
  PythonShell: {
    run: jest.fn(),
  },
}));

function createFakeArgosPackage(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fake-argos-'));
  const packageDir = path.join(root, 'argostranslate');
  fs.mkdirSync(packageDir, { recursive: true });

  fs.writeFileSync(path.join(packageDir, '__init__.py'), '');
  fs.writeFileSync(
    path.join(packageDir, 'translate.py'),
    `TRANSLATIONS = {
    ('en', 'zh'): {'cat': '猫', 'tree': '树'},
    ('zh', 'en'): {'猫': 'cat', '树': 'tree'},
}

class Translation:
    def __init__(self, from_code, to_code):
        self.from_code = from_code
        self.to_code = to_code

class Language:
    def __init__(self, code):
        self.code = code

    def get_translation(self, other):
        if (self.code, other.code) in TRANSLATIONS:
            return Translation(self.code, other.code)
        return None

def get_installed_languages():
    return [Language('en'), Language('zh')]

def translate(text, from_code, to_code):
    return TRANSLATIONS[(from_code, to_code)][text]
`
  );
  fs.writeFileSync(
    path.join(packageDir, 'package.py'),
    `def get_available_packages():
    return []

def install_from_path(_download_path):
    return None
`
  );

  return root;
}

function runTranslatorScript(tags: string[], targetLanguage: string) {
  const fakeArgosRoot = createFakeArgosPackage();
  const pythonPath = process.platform === 'win32' ? 'python' : 'python3';

  return spawnSync(
    pythonPath,
    [path.join(process.cwd(), 'script', 'tag_translator.py'), JSON.stringify(tags), targetLanguage],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        PYTHONPATH: fakeArgosRoot,
      },
      encoding: 'utf8',
    }
  );
}

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

  it('passes zh to the Python helper for English tag translation', async () => {
    const { PythonShell } = require('python-shell');
    PythonShell.run.mockResolvedValue(['{"success": true, "tags": ["猫"]}']);

    const { translateTags } = require('../../../script/script.cjs');

    await translateTags(['cat'], 'zh');

    expect(PythonShell.run).toHaveBeenCalledWith(
      'tag_translator.py',
      expect.objectContaining({
        args: ['["cat"]', 'zh'],
      })
    );
  });

  it('passes en to the Python helper for Chinese input canonicalization fallback', async () => {
    const { PythonShell } = require('python-shell');
    PythonShell.run.mockResolvedValue(['{"success": true, "tags": ["cat"]}']);

    const { translateTags } = require('../../../script/script.cjs');

    await expect(translateTags(['猫'], 'en')).resolves.toEqual(['cat']);
    expect(PythonShell.run).toHaveBeenCalledWith(
      'tag_translator.py',
      expect.objectContaining({
        args: ['["猫"]', 'en'],
      })
    );
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

describe('tag_translator.py', () => {
  it('translates English tags to Chinese with a dynamic target language', () => {
    const result = runTranslatorScript(['cat', 'tree'], 'zh');

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout.trim())).toEqual({
      success: true,
      tags: ['猫', '树'],
    });
  });

  it('translates Chinese tags back to canonical English for dictionary misses', () => {
    const result = runTranslatorScript(['猫', '树'], 'en');

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout.trim())).toEqual({
      success: true,
      tags: ['cat', 'tree'],
    });
  });
});
