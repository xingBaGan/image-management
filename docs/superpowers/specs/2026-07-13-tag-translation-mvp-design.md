# Tag Translation MVP Design

## Summary

This MVP adds on-demand Chinese tag translation for individual images without changing the existing English tag flow.

When the UI language is Chinese and a user opens an image that has English tags but no saved Chinese translation, the app will translate that image's tags locally, persist the result with the image record, and reuse it on future opens. When the UI language is English, the app will continue showing the original English tags and will not trigger translation.

## Goals

- Reuse the existing `LanguageToggle` / `LanguageContext` behavior to decide whether translated tags should be shown.
- Translate tags lazily when a user opens an image, not during import or auto-tagging.
- Persist translated Chinese tags with the image data so they survive app restarts.
- Keep the original English `tags` array as the source of truth for editing, search, and compatibility.
- Avoid retranslating images that already have a saved Chinese translation.

## Non-Goals

- Multi-language support beyond Chinese.
- Translating tags in list or grid thumbnails.
- Chinese-tag search behavior.
- Batch translation for all images.
- Editing translated Chinese tags directly.
- Replacing the existing English tags with translated values.
- Global shared translation dictionary deduplication across images.

## Current Constraints

- The current language toggle is binary (`en` / `zh`) and already persists UI language state in local storage.
- Tag display and editing currently use `image.tags` directly in the image info sidebar.
- The app already has a Python-backed local model integration path for image tagging through Electron IPC.
- Image tag updates are already persisted through the Electron DAO layer.

These constraints make it practical to build the MVP as an additional image-level persisted field plus a new lazy translation path, without changing the existing tagging pipeline.

## Recommended Approach

Use image-level stored translations instead of replacing the English tag list or introducing a global translation dictionary.

This keeps the MVP small and aligned with current behavior:

- English tags remain the canonical editable data.
- Chinese translations become an optional display layer.
- Translation work only happens when a Chinese-speaking user actually opens a given image.
- Persisted results make the feature feel fast after the first use.

## Data Model

Add an optional translation container to the media types used by both the renderer and Electron layers.

Recommended shape:

```ts
tagTranslations?: {
  zh?: string[];
};
```

Optional metadata can be added if implementation needs lightweight invalidation:

```ts
tagTranslationMeta?: {
  zhUpdatedAt?: string;
  zhSourceCount?: number;
};
```

For the MVP, `tagTranslations.zh` is enough. The metadata block is optional and should only be added if the implementation needs a simple way to detect stale translations after English tag edits.

## Translation Source of Truth

- `image.tags` stays as the canonical English tag list.
- `image.tagTranslations?.zh` stores the translated Chinese display values.
- All existing tag editing actions continue to update `image.tags`.
- The UI chooses whether to display `tags` or `tagTranslations.zh` based on the current app language.

This separation prevents regressions in search, manual editing, import/export compatibility, and existing database records.

## User Flow

### English mode

- The UI displays `image.tags`.
- Opening an image does not trigger translation.

### Chinese mode

- When a user opens an image, the app checks whether `image.tagTranslations?.zh` exists and is non-empty.
- If it exists, the UI displays the saved Chinese translation immediately.
- If it does not exist and `image.tags` contains English tags, the app requests a local translation for that image.
- After translation succeeds, the app persists the Chinese tags into the image record and updates the currently displayed image in memory.
- Future opens reuse the saved translation and do not retranslate.

## Trigger Point

Translation should be triggered when an image becomes the active detail target, not during import and not during background auto-tagging.

Preferred trigger:

- When the currently opened image in the detail / viewer flow changes and the current UI language is `zh`.

This keeps the feature narrow and makes the translation work correspond to explicit user intent.

## Frontend Changes

### Language-aware tag display

The tag UI should distinguish between:

- canonical editable tags
- displayed tags

Recommended component contract:

```ts
interface MediaTagsProps {
  tags: string[];
  displayTags?: string[];
  mediaId: string;
  onTagsUpdate: (mediaId: string, newTags: string[]) => void;
}
```

Behavior:

- `tags` continues to power editing and copy behavior for the MVP.
- `displayTags` is optional and only affects visible labels.
- In English mode, `displayTags` is omitted and the UI shows `tags`.
- In Chinese mode, `displayTags` is set to `image.tagTranslations?.zh ?? image.tags`.

This avoids breaking the current tag editing behavior while still letting the user visually confirm the translation result.

### Translation request orchestration

Add a small renderer-side helper responsible for:

- checking whether the current image needs translation
- avoiding duplicate requests while the same image is open
- invoking Electron translation IPC
- updating the in-memory image state after persistence succeeds

This helper should only run when:

- current language is `zh`
- image has English tags
- image has no saved Chinese translation

## Electron / Backend Changes

### New IPC path

Add a dedicated IPC method for translation persistence instead of reusing `update-tags`.

Recommended new methods:

- `translate-image-tags(mediaId, tags, targetLang)`
- `update-tag-translation(mediaId, lang, translatedTags)`

Responsibilities:

- translation IPC performs local translation
- persistence IPC updates the image record with `tagTranslations.zh`

Keeping these separate preserves the meaning of the current `update-tags` path, which should continue to mean "edit the canonical English tags."

### DAO update

Extend the image DAO and backing persistence schema to support the new `tagTranslations` field.

The DAO update should:

- update only the translation field for the target image
- leave `tags` untouched
- return the updated image data to the renderer if convenient

## Local Translation Engine

For MVP, use a local Python translation helper invoked in the same style as the existing image tagging script.

Recommended new script:

- `script/tag_translator.py`

Recommended bridge addition:

- a new function in `script/script.cjs` similar to `tagImage`, such as `translateTags(tags, targetLang)`

Recommended first engine:

- `Argos Translate` for local offline English-to-Chinese translation

Why this is a good MVP fit:

- local and offline
- Python integration matches the existing project pattern
- simple enough to prove the product value before optimizing model/runtime choices

## Persistence Rules

- Save Chinese translations with the image record as soon as translation succeeds.
- Do not save empty translations on failure.
- Do not overwrite English tags.
- Do not trigger retranslation if `tagTranslations.zh` already exists and is non-empty.

For the MVP, translation invalidation is explicit:

- when English `tags` are manually updated, clear `tagTranslations.zh`
- the app does not immediately retranslate in the background
- the next time the image is opened in Chinese mode, the app translates again on demand

This keeps the saved Chinese display from drifting away from the edited English source data while preserving the lazy-translation behavior.

## Error Handling

If translation fails:

- keep showing the English tags
- do not persist any empty or partial value
- optionally log the error in Electron
- avoid spamming repeated requests during the same open session

The feature should fail soft. A translation error must not block image viewing, tag editing, or the rest of the sidebar.

## Testing Strategy

### Renderer tests

- Chinese mode with saved translation shows translated tags.
- English mode shows original English tags.
- Chinese mode with no saved translation triggers a translation request when an image is opened.
- Translation is not requested again for an image that already has saved `tagTranslations.zh`.

### Electron / DAO tests

- updating a tag translation persists `tagTranslations.zh` without mutating `tags`
- existing image records without `tagTranslations` still load correctly

### Manual verification

- open an image in English mode and confirm no translation is requested
- switch to Chinese mode and open an untranslated image
- confirm Chinese tags appear after a short delay
- restart the app and confirm the same image still shows Chinese tags
- edit English tags and confirm `tagTranslations.zh` is cleared
- reopen the image in Chinese mode and confirm translation is regenerated

## MVP Acceptance Criteria

- English mode behavior is unchanged from today.
- Chinese mode shows saved Chinese translations when available.
- Opening an untranslated image in Chinese mode triggers local translation once.
- Successful translations are persisted with the image data and survive restart.
- The original English `tags` remain intact and editable.
- Existing search and English tag workflows continue to work.

## Risks and Follow-up

### Known MVP compromises

- the same English tag repeated across many images may be translated multiple times across records
- Chinese translation is display-only and not searchable
- translation quality for short tag phrases may require a later terminology dictionary

### Natural next steps after MVP proves value

- add a shared tag translation dictionary cache
- add explicit retranslate action
- support Japanese / Korean / French / German using the same field pattern
- allow translated-tag search as a secondary search path
