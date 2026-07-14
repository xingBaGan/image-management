import fs from 'fs';
import path from 'path';

const configPath = path.join(process.cwd(), 'src/config.mts');
const configContent = fs.readFileSync(configPath, 'utf8');
const utilsPath = path.join(process.cwd(), 'src/utils.ts');
const utilsContent = fs.readFileSync(utilsPath, 'utf8');

describe('tag model configuration', () => {
  it('keeps the existing default model', () => {
    expect(configContent).toContain("export const defaultModel = 'wd-v1-4-moat-tagger-v2';");
  });

  it('includes the new v3 tagger models in the supported list', () => {
    expect(configContent).toContain("'wd-v1-4-moat-tagger-v2'");
    expect(configContent).toContain("'wd-v1-4-convnext-tagger-v2'");
    expect(configContent).toContain("'wd-v1-4-convnextv2-tagger-v2'");
    expect(configContent).toContain("'wd-swinv2-tagger-v3'");
    expect(configContent).toContain("'wd-eva02-large-tagger-v3'");
  });

  it('uses the selected model when auto-tagging imported media', () => {
    expect(utilsContent).toContain('const modelName = settings.modelName || defaultModel;');
    expect(utilsContent).toContain('await ensureModelReady(modelName)');
    expect(utilsContent).toContain('tagImage(file.path, modelName)');
    expect(utilsContent).not.toContain('tagImage(file.path, defaultModel)');
  });
});
