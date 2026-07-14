# Tag Input Translation Design

## Summary

This change extends the existing English-tag data model with two new Chinese-friendly input behaviors while preserving the current English-first storage and filter logic.

When the UI language is Chinese:

- tag chips continue to display the canonical English tag text
- hovering a tag chip shows the Chinese translation for that tag when available
- entering Chinese into the tag editor resolves to an English canonical tag before saving
- entering Chinese into the filter input resolves to an English canonical tag when the user presses Enter, then reuses the existing filter flow unchanged

The canonical `tags` array remains English-only and continues to be the source of truth for persistence, search, filtering, and compatibility.

## Goals

- Preserve the current English canonical tag model.
- Keep visible tag chip text in English, even in Chinese UI mode.
- Show the current language translation as hover text on tag chips.
- Let users type Chinese into the tag editor and save the resolved English tag.
- Let users type Chinese into the filter input and apply filtering with the resolved English tag on Enter.
- Reuse the existing local tag dictionary and translation service.
- Avoid breaking the current English typing, search, and filter behavior.

## Non-Goals

- Real-time translation while the user is still typing.
- Replacing visible tag chip text with Chinese.
- Changing suggestion list matching to be Chinese-aware in this iteration.
- Multi-language support beyond the current English/Chinese path.
- Reworking existing filter semantics.

## Confirmed UX Decisions

- Tag chips keep showing English canonical tags.
- In Chinese mode, hovering a tag chip should reveal the Chinese explanation when available.
- Chinese input in the filter bar is only translated when the user presses Enter.
- The current suggestion click behavior remains unchanged.

## Recommended Approach

Resolve Chinese input into English only at submit time, not while the user types.

This keeps the implementation small and protects the current input and filtering flow:

- English input continues to pass through unchanged.
- Chinese input uses a new resolver that attempts dictionary-first reverse lookup.
- When the dictionary does not contain a reverse match, the app falls back to the existing translation bridge to translate Chinese into English.
- Once an English canonical tag is produced, all current save and filter code paths run as they do today.

## Translation Resolution Pipeline

Add a shared renderer-facing helper for canonicalizing tag input:

1. Trim the submitted text.
2. If the text already looks like an English canonical tag, return it unchanged.
3. If the text contains Chinese or otherwise does not look canonical:
   - first try a local reverse dictionary lookup (`zh -> en`)
   - if no match is found, call a translation bridge that translates submitted text into English
4. Normalize the final canonical tag for dedupe using the same string that will be persisted and filtered.

The dictionary-first step keeps common tag terms fast and deterministic. The fallback translation step handles terms not present in the vendored dictionary.

## Electron / Translation Layer Changes

The existing Electron translation pipeline already supports:

- dictionary lookup for `en -> zh`
- cache-backed fallback translation when the dictionary misses

This feature extends that layer with bidirectional resolution support:

- build and store a reverse dictionary index from the same vendored YAML
- expose a renderer API for resolving arbitrary submitted tag text into English canonical form

Recommended shape:

- keep `translate-tags` for the current array-based display translation flow
- add a new IPC entry dedicated to input canonicalization, for example `resolve-tag-input`

Responsibilities:

- accept one submitted string and a target canonical language (`en`)
- perform reverse dictionary lookup when possible
- fallback to translation service when needed
- return a single resolved English tag string or the original input if resolution fails

Failure behavior should remain soft:

- if resolution fails, keep the original submitted value rather than blocking the user
- log the failure for debugging

## Frontend Changes

### MediaTags

The tag editor should canonicalize input before saving:

- on Enter, resolve the submitted text into an English canonical tag
- dedupe against the existing English `selectedTags`
- persist through the existing `onTagsUpdate(mediaId, newTags)` flow

Visible chips should still render the English canonical tag text.

For hover text:

- when the current language is Chinese, use the translated value as the chip `title`
- prefer `displayTags[index]` when it exists and differs from the English tag
- omit the tooltip when there is no translated value

This preserves the current visible layout while adding the requested hover explanation.

### SearchBar

The filter input should preserve the current Enter-to-add flow:

- on Enter, resolve the submitted text into an English canonical tag
- add the resolved English tag to `tags`
- call the existing `onSearch(newTags)` with the English tag array

This means the filter engine itself does not need to change.

Suggestion clicks stay on the current English options path in this iteration.

## Shared Service Changes

Add a small service module or extend the current tag translation service with helpers such as:

- `looksCanonicalEnglishTag(input): boolean`
- `resolveCanonicalTagInput(input): Promise<string>`
- `getTagTooltip(tag, translatedTag, language): string | undefined`

These helpers keep the UI components thin and ensure both tag editing and filter input use the same canonicalization rules.

## Testing Strategy

### Service tests

- canonical English input returns unchanged
- Chinese input resolves through reverse dictionary lookup when available
- dictionary misses fall back to the translation bridge
- failures fall back to the original input

### Component tests

- `MediaTags` saves English when Chinese input is submitted
- `MediaTags` renders English text and Chinese hover title in Chinese mode
- `SearchBar` resolves Chinese input to English on Enter before calling `onSearch`
- existing English input behavior remains unchanged

## Acceptance Criteria

- Existing English tag storage remains unchanged.
- Existing English filter behavior remains unchanged.
- In Chinese mode, tag chips still show English text.
- In Chinese mode, translated hover text appears when available.
- Chinese input in the tag editor is saved as English canonical tags.
- Chinese input in the filter input is translated to English when the user presses Enter, then filtered through the existing logic.

## Risks

- Free-form Chinese phrases may translate to English strings that do not perfectly match existing canonical tag conventions.
- Reverse dictionary matching can be ambiguous if multiple English tags share the same Chinese translation.

For this iteration, the simplest acceptable behavior is:

- first exact reverse dictionary match wins
- fallback translation result is accepted as the canonical tag when no dictionary hit exists

This keeps the scope aligned with the request while leaving room for later normalization improvements.
