import fs from 'fs';
import path from 'path';

const root = process.cwd();

const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

describe('install scripts', () => {
  it.each([
    'install.sh',
    'install.command',
    'install.bat',
  ])('%s only downloads the default model during installation', (file) => {
    const content = read(file);

    expect(content).toContain('download_models.py');
    expect(content).not.toContain('wd-v1-4-convnext-tagger-v2');
    expect(content).not.toContain('wd-v1-4-convnextv2-tagger-v2');
    expect(content).not.toContain('wd-swinv2-tagger-v3');
    expect(content).not.toContain('wd-eva02-large-tagger-v3');
  });
});

describe('installation docs', () => {
  it.each([
    'install.en.md',
    'install.zh.md',
  ])('%s mentions the new v3 models and runtime note', (file) => {
    const content = read(file);

    expect(content).toContain('wd-swinv2-tagger-v3');
    expect(content).toContain('wd-eva02-large-tagger-v3');
    expect(content).toMatch(/onnxruntime/i);
  });
});

describe('download helper', () => {
  it('contains dedicated v3 model source definitions', () => {
    const content = read('script/download_models.py');

    expect(content).toContain('wd-swinv2-tagger-v3');
    expect(content).toContain('wd-eva02-large-tagger-v3');
    expect(content).toContain('selected_tags.csv');
    expect(content).toContain('model.onnx');
    expect(content).toContain('SmilingWolf');
  });

  it('can emit machine-readable download progress', () => {
    const content = read('script/download_models.py');

    expect(content).toContain('--progress-json');
    expect(content).toContain('--models-dir');
    expect(content).toContain('download_progress');
    expect(content).toContain('flush=True');
  });
});

describe('electron model download bridge', () => {
  it('exposes selected model status and downloader progress events', () => {
    const scriptBridge = read('script/script.cjs');
    const ipcService = read('electron/services/ipcService.cts');
    const preload = read('electron/preload.cts');

    expect(scriptBridge).toContain('getModelDownloadStatus');
    expect(scriptBridge).toContain('ensureModelDownloaded');
    expect(ipcService).toContain('get-model-download-status');
    expect(ipcService).toContain('ensure-model-downloaded');
    expect(ipcService).toContain('model-download-progress');
    expect(preload).toContain('getModelDownloadStatus');
    expect(preload).toContain('ensureModelDownloaded');
    expect(preload).toContain('onModelDownloadProgress');
  });
});
