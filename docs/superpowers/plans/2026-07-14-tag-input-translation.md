# Tag Input Translation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let Chinese users submit Chinese text in the tag editor and filter input while keeping canonical stored and filtered tags in English, and show Chinese tag explanations on hover without changing visible chip text.

**Architecture:** Extend the existing tag translation service into a bidirectional canonicalization layer shared by `MediaTags` and `SearchBar`. Keep `tags` as the English source of truth, add one new Electron IPC for resolving a single submitted tag into canonical English, and only touch submit-time UI behavior so existing filter and suggestion flows stay intact.

**Tech Stack:** TypeScript, React, Electron IPC, Jest, Testing Library, YAML-backed local tag dictionary

---

## File Structure

- `electron/services/tagTranslate.cts`
  Adds reverse dictionary lookup and a single-tag canonicalization pipeline that can resolve `zh -> en` using dictionary-first fallback translation.
- `electron/services/ipcService.cts`
  Exposes a new IPC handler for submit-time tag canonicalization.
- `electron/preload.cts`
  Publishes the new IPC method to the renderer.
- `src/types/index.ts`
  Extends `ElectronAPI` with the canonicalization method.
- `src/services/tagTranslationService.ts`
  Centralizes English-tag detection, hover-tooltip generation, and submit-time canonicalization helpers shared by UI components.
- `src/components/MediaTags.tsx`
  Canonicalizes submitted input on Enter, keeps visible tag chips in English, and adds translated hover text in Chinese mode.
- `src/components/Toolbar/SearchBar.tsx`
  Canonicalizes submitted input on Enter before adding a filter tag while leaving suggestion-click behavior untouched.
- `src/__tests__/services/tagTranslationService.test.ts`
  Covers service helpers and Electron bridge usage.
- `src/__tests__/components/MediaTags.test.tsx`
  Covers tag-editor submit behavior and hover tooltip behavior.
- `src/__tests__/components/SearchBar.test.tsx`
  Covers filter submit behavior with Chinese input.

### Task 1: Add failing service tests for canonical English resolution and hover tooltips

**Files:**
- Modify: `src/__tests__/services/tagTranslationService.test.ts`
- Modify: `src/services/tagTranslationService.ts`
- Modify: `src/types/index.ts`
- Modify: `electron/preload.cts`
- Modify: `electron/services/ipcService.cts`
- Modify: `electron/services/tagTranslate.cts`

- [ ] **Step 1: Write the failing service tests**

Append tests like these to `src/__tests__/services/tagTranslationService.test.ts`:

```ts
import {
  getTagHoverText,
  resolveCanonicalTagInput,
} from '@/services/tagTranslationService';

const mockResolveTagInput = jest.fn() as jest.MockedFunction<ElectronAPI['resolveTagInput']>;

beforeEach(() => {
  window.electron = {
    translateTags: mockTranslateTags,
    resolveTagInput: mockResolveTagInput,
    imageAPI: {
      updateTagTranslation: mockUpdateTagTranslation,
    },
  } as unknown as ElectronAPI;
});

it('returns canonical English input unchanged without invoking Electron', async () => {
  await expect(resolveCanonicalTagInput('blue_eyes')).resolves.toBe('blue_eyes');
  expect(mockResolveTagInput).not.toHaveBeenCalled();
});

it('resolves Chinese input through the Electron canonicalization bridge', async () => {
  mockResolveTagInput.mockResolvedValue('cat');

  await expect(resolveCanonicalTagInput('猫')).resolves.toBe('cat');
  expect(mockResolveTagInput).toHaveBeenCalledWith('猫', 'en');
});

it('falls back to the original text when canonicalization fails', async () => {
  mockResolveTagInput.mockRejectedValue(new Error('bridge failed'));

  await expect(resolveCanonicalTagInput('猫')).resolves.toBe('猫');
});

it('returns translated hover text only in Chinese mode when it differs from the canonical tag', () => {
  expect(getTagHoverText('cat', '猫', 'zh')).toBe('猫');
  expect(getTagHoverText('cat', 'cat', 'zh')).toBeUndefined();
  expect(getTagHoverText('cat', '猫', 'en')).toBeUndefined();
});
```

- [ ] **Step 2: Run the focused service test to verify it fails**

Run: `npx jest src/__tests__/services/tagTranslationService.test.ts --runInBand`
Expected: FAIL because `resolveCanonicalTagInput`, `getTagHoverText`, and `window.electron.resolveTagInput` do not exist yet

- [ ] **Step 3: Write the minimal production code**

Add the renderer-side helpers in `src/services/tagTranslationService.ts`:

```ts
const chineseCharPattern = /[\u3400-\u9fff]/;

export function looksCanonicalEnglishTag(input: string): boolean {
  const trimmed = input.trim();
  return !!trimmed && englishTagPattern.test(trimmed);
}

export async function resolveCanonicalTagInput(input: string): Promise<string> {
  const trimmed = input.trim();
  if (!trimmed || looksCanonicalEnglishTag(trimmed)) {
    return trimmed;
  }

  try {
    const resolved = await window.electron.resolveTagInput(trimmed, 'en');
    return resolved.trim() || trimmed;
  } catch (error) {
    console.error('Error resolving canonical tag input:', error);
    return trimmed;
  }
}

export function getTagHoverText(tag: string, translatedTag: string | undefined, language: string): string | undefined {
  if (!isChineseLanguage(language)) {
    return undefined;
  }
  if (!translatedTag || translatedTag === tag) {
    return undefined;
  }
  return translatedTag;
}
```

Expose the new bridge through Electron:

```ts
// src/types/index.ts
resolveTagInput: (input: string, targetLang: 'en') => Promise<string>;

// electron/preload.cts
resolveTagInput: (input: string, targetLang: 'en') => ipcRenderer.invoke('resolve-tag-input', input, targetLang),
```

Add the IPC handler and reverse-lookup entrypoint:

```ts
// electron/services/ipcService.cts
ipcMain.handle('resolve-tag-input', async (_event, input: string, targetLang: string) => {
  return await resolveTagInputPipeline(input, targetLang, (missing, lang) => translateTags([missing], lang));
});
```

```ts
// electron/services/tagTranslate.cts
function reverseDictionaryLookup(raw: string): string | null {
  const normalized = raw.trim().toLowerCase();
  for (const [candidate, translated] of loadDictionary().entries()) {
    if (translated.trim().toLowerCase() === normalized) {
      return candidate;
    }
  }
  return null;
}

export async function resolveTagInputPipeline(
  input: string,
  targetLang: string,
  fallback: (input: string, targetLang: string) => Promise<string[]>
): Promise<string> {
  const trimmed = input.trim();
  if (!trimmed) return '';

  const reverseHit = reverseDictionaryLookup(trimmed);
  if (reverseHit) return reverseHit;

  const translated = await fallback(trimmed, targetLang);
  return translated[0]?.trim() || trimmed;
}
```

- [ ] **Step 4: Re-run the focused service test**

Run: `npx jest src/__tests__/services/tagTranslationService.test.ts --runInBand`
Expected: PASS

### Task 2: Add failing tag editor tests, then implement Chinese submit canonicalization and hover text

**Files:**
- Create: `src/__tests__/components/MediaTags.test.tsx`
- Modify: `src/components/MediaTags.tsx`
- Modify: `src/services/tagTranslationService.ts`

- [ ] **Step 1: Write the failing `MediaTags` tests**

Create `src/__tests__/components/MediaTags.test.tsx` with:

```tsx
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import MediaTags from '@/components/MediaTags';
import { resolveCanonicalTagInput } from '@/services/tagTranslationService';

jest.mock('@/services/tagTranslationService', () => ({
  resolveCanonicalTagInput: jest.fn(),
  getTagHoverText: jest.requireActual('@/services/tagTranslationService').getTagHoverText,
}));

jest.mock('@/contexts/LanguageContext', () => ({
  useLocale: () => ({
    t: (key: string) => key,
    language: 'zh',
    setLanguage: jest.fn(),
  }),
}));

const mockResolveCanonicalTagInput = resolveCanonicalTagInput as jest.MockedFunction<typeof resolveCanonicalTagInput>;

describe('MediaTags', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('submits the canonical English tag when the user presses Enter with Chinese input', async () => {
    const onTagsUpdate = jest.fn();
    mockResolveCanonicalTagInput.mockResolvedValue('cat');

    render(
      <MediaTags
        tags={['tree']}
        displayTags={['树']}
        mediaId="image-1"
        onTagsUpdate={onTagsUpdate}
      />
    );

    const input = screen.getByPlaceholderText('tagInput');
    fireEvent.change(input, { target: { value: '猫' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(onTagsUpdate).toHaveBeenCalledWith('image-1', ['tree', 'cat']);
    });
  });

  it('keeps the visible chip text in English and exposes the Chinese translation as the title', () => {
    render(
      <MediaTags
        tags={['cat']}
        displayTags={['猫']}
        mediaId="image-1"
        onTagsUpdate={jest.fn()}
      />
    );

    const chip = screen.getByText('cat');
    expect(chip).toBeInTheDocument();
    expect(chip).toHaveAttribute('title', '猫');
  });
});
```

- [ ] **Step 2: Run the focused `MediaTags` test to verify it fails**

Run: `npx jest src/__tests__/components/MediaTags.test.tsx --runInBand`
Expected: FAIL because `MediaTags` currently stores raw Chinese input and renders `displayTags` as visible text instead of using it as hover text

- [ ] **Step 3: Write the minimal `MediaTags` implementation**

Update submit handling and chip rendering in `src/components/MediaTags.tsx`:

```tsx
const handleInputKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === 'Enter' && inputValue.trim()) {
    e.preventDefault();
    const newTag = await resolveCanonicalTagInput(inputValue);
    if (newTag && !selectedTags.includes(newTag)) {
      const newTags = Array.from(new Set([...selectedTags, newTag]));
      setSelectedTags(newTags);
      onTagsUpdate(mediaId, newTags);
    }
    setInputValue('');
  }
};
```

Render chips with English text and translated hover text:

```tsx
{selectedTags.map((tag, index) => {
  const hoverText = getTagHoverText(tag, displayTags?.[index], language);

  return (
    <div
      key={`${tag}-${index}`}
      className="flex gap-1 items-center px-2 py-1 h-7 text-sm text-blue-800 bg-blue-100 rounded-full dark:bg-blue-900 dark:text-blue-200 group"
      title={hoverText}
    >
      <span>{tag}</span>
      <button
        onClick={() => removeTag(tag)}
        className="opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-500 dark:hover:text-red-400 focus:outline-none"
        aria-label={t('deleteTag', { tag })}
      >
        <X size={14} />
      </button>
    </div>
  );
})}
```

- [ ] **Step 4: Re-run the focused `MediaTags` test**

Run: `npx jest src/__tests__/components/MediaTags.test.tsx --runInBand`
Expected: PASS

### Task 3: Add failing filter-input tests, then implement Chinese submit canonicalization on Enter

**Files:**
- Create: `src/__tests__/components/SearchBar.test.tsx`
- Modify: `src/components/Toolbar/SearchBar.tsx`
- Modify: `src/services/tagTranslationService.ts`

- [ ] **Step 1: Write the failing `SearchBar` test**

Create `src/__tests__/components/SearchBar.test.tsx` with:

```tsx
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import SearchBar from '@/components/Toolbar/SearchBar';
import { resolveCanonicalTagInput } from '@/services/tagTranslationService';

jest.mock('@/services/tagService', () => ({
  getTagFrequency: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/services/tagTranslationService', () => ({
  resolveCanonicalTagInput: jest.fn(),
}));

jest.mock('@/contexts/LanguageContext', () => ({
  useLocale: () => ({
    t: (key: string) => key,
    language: 'zh',
    setLanguage: jest.fn(),
  }),
}));

const mockResolveCanonicalTagInput = resolveCanonicalTagInput as jest.MockedFunction<typeof resolveCanonicalTagInput>;

describe('SearchBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('resolves Chinese input to English on Enter before invoking onSearch', async () => {
    const onSearch = jest.fn();
    const setTags = jest.fn();
    mockResolveCanonicalTagInput.mockResolvedValue('cat');

    render(
      <SearchBar
        onSearch={onSearch}
        searchButtonRef={{ current: document.createElement('button') }}
        tags={[]}
        setTags={setTags}
      />
    );

    fireEvent.click(screen.getByTitle('search(Ctrl+F)'));
    const input = screen.getByPlaceholderText('searchImages');
    fireEvent.change(input, { target: { value: '猫' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(setTags).toHaveBeenCalledWith(['cat']);
      expect(onSearch).toHaveBeenCalledWith(['cat']);
    });
  });
});
```

- [ ] **Step 2: Run the focused `SearchBar` test to verify it fails**

Run: `npx jest src/__tests__/components/SearchBar.test.tsx --runInBand`
Expected: FAIL because `SearchBar` currently passes raw input through on Enter

- [ ] **Step 3: Write the minimal `SearchBar` implementation**

Update the Enter branch in `src/components/Toolbar/SearchBar.tsx`:

```tsx
const handleInputKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === 'Enter' && inputValue.trim()) {
    const newTag = await resolveCanonicalTagInput(inputValue);
    if (!newTag) {
      setInputValue('');
      return;
    }
    const nextTags = Array.from(new Set([...tags, newTag]));
    setTags(nextTags);
    setInputValue('');
    onSearch(nextTags);
    setSelectedTags(Array.from(new Set([...selectedTags, newTag])));
  }
};
```

Do not modify `handleSuggestionClick`; suggestion clicks should remain English-only in this iteration.

- [ ] **Step 4: Re-run the focused `SearchBar` test**

Run: `npx jest src/__tests__/components/SearchBar.test.tsx --runInBand`
Expected: PASS

### Task 4: Verify the end-to-end regression surface and inspect the final diff

**Files:**
- Modify: `electron/services/tagTranslate.cts`
- Modify: `electron/services/ipcService.cts`
- Modify: `electron/preload.cts`
- Modify: `src/types/index.ts`
- Modify: `src/services/tagTranslationService.ts`
- Modify: `src/components/MediaTags.tsx`
- Modify: `src/components/Toolbar/SearchBar.tsx`
- Modify: `src/__tests__/services/tagTranslationService.test.ts`
- Create: `src/__tests__/components/MediaTags.test.tsx`
- Create: `src/__tests__/components/SearchBar.test.tsx`

- [ ] **Step 1: Run the focused regression suite**

Run: `npx jest src/__tests__/services/tagTranslationService.test.ts src/__tests__/components/MediaTags.test.tsx src/__tests__/components/SearchBar.test.tsx --runInBand`
Expected: PASS

- [ ] **Step 2: Run the broader related tests**

Run: `npx jest src/__tests__/hooks/useTagTranslation.test.tsx --runInBand`
Expected: PASS to confirm the existing lazy `en -> zh` translation flow still works

- [ ] **Step 3: Inspect the final diff**

Run: `git diff -- electron/services/tagTranslate.cts electron/services/ipcService.cts electron/preload.cts src/types/index.ts src/services/tagTranslationService.ts src/components/MediaTags.tsx src/components/Toolbar/SearchBar.tsx src/__tests__/services/tagTranslationService.test.ts src/__tests__/components/MediaTags.test.tsx src/__tests__/components/SearchBar.test.tsx`
Expected: only the planned canonicalization bridge, tag hover behavior, filter submit behavior, and targeted tests appear
