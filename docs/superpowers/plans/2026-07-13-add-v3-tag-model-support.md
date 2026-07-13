# V3 Tag Model Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `wd-swinv2-tagger-v3` and `wd-eva02-large-tagger-v3` as supported local tagging models, wire them into install flows, and document the new options.

**Architecture:** Keep the existing Python tagger loading path unchanged because it already loads any model by name from matching `.onnx` and `.csv` files. Limit code changes to the model registry, installer download commands, and user-facing installation docs so the feature stays low-risk.

**Tech Stack:** TypeScript, React, Jest, Node.js filesystem assertions, shell install scripts, Python helper scripts, Markdown docs

---

### Task 1: Add regression tests for model availability and install hooks

**Files:**
- Create: `src/__tests__/config.test.ts`
- Create: `src/__tests__/installScripts.test.ts`
- Modify: `src/config.mts`
- Modify: `install.sh`
- Modify: `install.command`
- Modify: `install.bat`

- [ ] **Step 1: Write the failing config test**

```ts
import { defaultModel, supportModes } from '../config.mts';

describe('tag model configuration', () => {
  it('keeps the existing default model', () => {
    expect(defaultModel).toBe('wd-v1-4-moat-tagger-v2');
  });

  it('includes the new v3 tagger models in the supported list', () => {
    expect(supportModes).toEqual(expect.arrayContaining([
      'wd-v1-4-moat-tagger-v2',
      'wd-v1-4-convnext-tagger-v2',
      'wd-v1-4-convnextv2-tagger-v2',
      'wd-swinv2-tagger-v3',
      'wd-eva02-large-tagger-v3',
    ]));
  });
});
```

- [ ] **Step 2: Run the config test to verify it fails**

Run: `npx jest src/__tests__/config.test.ts --runInBand`
Expected: FAIL because `supportModes` does not include the two v3 models yet

- [ ] **Step 3: Write the failing install script coverage test**

```ts
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

describe('install scripts', () => {
  it.each([
    'install.sh',
    'install.command',
    'install.bat',
  ])('%s downloads both new v3 models', (file) => {
    const content = read(file);

    expect(content).toContain('wd-swinv2-tagger-v3');
    expect(content).toContain('wd-eva02-large-tagger-v3');
  });
});
```

- [ ] **Step 4: Run the install script test to verify it fails**

Run: `npx jest src/__tests__/installScripts.test.ts --runInBand`
Expected: FAIL because the installer scripts do not mention the v3 model names yet

- [ ] **Step 5: Implement the minimal production changes**

Update the supported model list in `src/config.mts`, then append new download commands to `install.sh`, `install.command`, and `install.bat` following the existing command/error-handling pattern already used for the v2 models.

- [ ] **Step 6: Re-run both focused tests**

Run: `npx jest src/__tests__/config.test.ts src/__tests__/installScripts.test.ts --runInBand`
Expected: PASS

### Task 2: Document the new model choices and runtime note

**Files:**
- Modify: `install.en.md`
- Modify: `install.zh.md`

- [ ] **Step 1: Write the failing documentation test**

Append this case to `src/__tests__/installScripts.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the documentation test to verify it fails**

Run: `npx jest src/__tests__/installScripts.test.ts --runInBand`
Expected: FAIL because the docs only mention the old moat model and do not mention the v3 runtime note

- [ ] **Step 3: Update the installation docs minimally**

Add a short note to both docs that:
- the app now supports `wd-swinv2-tagger-v3` and `wd-eva02-large-tagger-v3`
- `v3` models require a recent `onnxruntime` build (document as `>= 1.17.0`)
- `wd-eva02-large-tagger-v3` is larger/slower but can improve tagging quality

- [ ] **Step 4: Re-run the documentation test**

Run: `npx jest src/__tests__/installScripts.test.ts --runInBand`
Expected: PASS

### Task 3: Verify the final change set

**Files:**
- Modify: `src/__tests__/config.test.ts`
- Modify: `src/__tests__/installScripts.test.ts`
- Modify: `src/config.mts`
- Modify: `install.sh`
- Modify: `install.command`
- Modify: `install.bat`
- Modify: `install.en.md`
- Modify: `install.zh.md`

- [ ] **Step 1: Run the focused regression tests**

Run: `npx jest src/__tests__/config.test.ts src/__tests__/installScripts.test.ts --runInBand`
Expected: PASS

- [ ] **Step 2: Run the project lint check if it is affordable**

Run: `npm run lint`
Expected: exit code 0

- [ ] **Step 3: Inspect the final diff**

Run: `git diff -- src/config.mts src/__tests__/config.test.ts src/__tests__/installScripts.test.ts install.sh install.command install.bat install.en.md install.zh.md`
Expected: only the planned model support, installer, and documentation changes appear
