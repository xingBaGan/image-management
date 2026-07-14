import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import YAML from 'yaml';
import { app } from 'electron';
import { logger } from './logService.cjs';

interface LogMeta {
  [key: string]: unknown;
}

interface SplitTag {
  left: string;
  value: string;
  right: string;
}

type Translations = Record<string, string>;

const BRACKET_PAIRS: Array<[string, string]> = [
  ['(', ')'],
  ['[', ']'],
  ['{', '}'],
];

const LORA_RE = /^<(lora|lyco|hypernet):[^>]+>$/i;
const EMBEDDING_RE = /^embedding:/i;

function splitTag(raw: string): SplitTag {
  let left = '';
  let right = '';
  let value = raw;

  let changed = true;
  while (changed) {
    changed = false;
    for (const [open, close] of BRACKET_PAIRS) {
      if (value.length >= 2 && value.startsWith(open) && value.endsWith(close)) {
        left += open;
        right = close + right;
        value = value.slice(1, -1);
        changed = true;
        break;
      }
    }
  }
  return { left, value, right };
}

function isSpecialTag(raw: string): boolean {
  const t = raw.trim();
  return LORA_RE.test(t) || EMBEDDING_RE.test(t);
}

// Underscore/space/hyphen variants used to look up a tag in the dictionary.
function lookupKeys(raw: string): string[] {
  const trimmed = raw.trim().toLowerCase();
  const tagOnly = trimmed.includes(':') ? trimmed.slice(0, trimmed.indexOf(':')) : trimmed;
  const keys = new Set<string>();
  keys.add(trimmed);
  keys.add(tagOnly);
  keys.add(tagOnly.replace(/_/g, ' '));
  keys.add(tagOnly.replace(/-/g, ' '));
  keys.add(tagOnly.replace(/ /g, '_'));
  return Array.from(keys);
}

// The vendored YAML is bundled next to the Python helpers; script/**/* is
// already included in electron-builder's extraResources.
function getDictionaryPath(): string {
  const isDev = !process.env.npm_lifecycle_script
    ? false
    : process.env.npm_lifecycle_script.includes('development');
  const base = isDev ? path.join(__dirname, '..', '..', 'script') : path.join(process.resourcesPath, 'script');
  return path.join(base, 'tag-dict', 'zh_CN.yaml');
}

// Walk the Physton group_tags YAML structure and flatten every `tags:` block
// into an { en -> translation } map. The upstream schema is:
//   - name: <category>
//     groups:
//       - name: <subcategory>
//         color: <css color>
//         tags:
//           <english>: <translation>
// We simply harvest every string->string pair we find under any `tags:` key.
function harvestPairs(node: unknown, out: Map<string, string>): void {
  if (!node) return;
  if (Array.isArray(node)) {
    for (const item of node) harvestPairs(item, out);
    return;
  }
  if (typeof node !== 'object') return;

  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    if (key === 'tags' && value && typeof value === 'object' && !Array.isArray(value)) {
      for (const [en, tr] of Object.entries(value as Record<string, unknown>)) {
        if (typeof en !== 'string' || !en.trim()) continue;
        if (typeof tr !== 'string' || !tr.trim()) continue; // skip empty (embedding placeholders)
        for (const k of lookupKeys(en)) {
          if (!out.has(k)) out.set(k, tr);
        }
      }
      continue;
    }
    harvestPairs(value, out);
  }
}

let dictionary: Map<string, string> | null = null;
function loadDictionary(): Map<string, string> {
  if (dictionary) return dictionary;
  const yamlPath = getDictionaryPath();
  const map = new Map<string, string>();
  try {
    const text = fs.readFileSync(yamlPath, 'utf8');
    const parsed = YAML.parse(text);
    harvestPairs(parsed, map);
    logger.info('已加载标签词典', { entries: map.size, path: yamlPath } as LogMeta);
  } catch (err) {
    logger.error('加载标签词典失败:', { error: err, path: yamlPath } as LogMeta);
  }
  dictionary = map;
  return map;
}

let cachePath: string | null = null;
let cacheData: Translations | null = null;
let cacheWriteQueue: Promise<void> = Promise.resolve();

function getCachePath(): string {
  if (cachePath) return cachePath;
  cachePath = path.join(app.getPath('userData'), 'tag-translation-cache.json');
  return cachePath;
}

function loadCacheSync(): Translations {
  if (cacheData) return cacheData;
  const p = getCachePath();
  try {
    const raw = fs.readFileSync(p, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      cacheData = parsed as Translations;
      return cacheData;
    }
  } catch {
    // First launch or corrupt cache; start fresh.
  }
  cacheData = {};
  return cacheData;
}

function cacheKey(text: string, from: string, to: string): string {
  return crypto.createHash('md5').update(`${from}|${to}|${text}`).digest('hex');
}

async function flushCache(): Promise<void> {
  const p = getCachePath();
  const snapshot = JSON.stringify(cacheData ?? {});
  await fsPromises.writeFile(p, snapshot, 'utf8');
}

function scheduleFlush(): void {
  cacheWriteQueue = cacheWriteQueue.then(flushCache, flushCache);
}

export type ArgosFallback = (tags: string[], targetLang: string) => Promise<string[]>;

function reverseDictionaryLookup(raw: string): string | null {
  const normalized = raw.trim().toLowerCase();
  if (!normalized) return null;

  for (const [candidate, translated] of loadDictionary().entries()) {
    if (translated.trim().toLowerCase() === normalized) {
      return candidate;
    }
  }

  return null;
}

// Public entrypoint: translate an array of English tags into the target
// locale using the dict-first, cache-second, argos-third pipeline.
export async function translateTagsPipeline(
  tags: string[],
  targetLang: string,
  fallback: ArgosFallback
): Promise<string[]> {
  if (!Array.isArray(tags) || tags.length === 0) return [];

  const dict = loadDictionary();
  const cache = loadCacheSync();
  const fromLang = 'en';

  const results: (string | null)[] = new Array(tags.length).fill(null);
  const missingIdx: number[] = [];
  const missingValue: string[] = [];
  const missingSplit: SplitTag[] = [];

  for (let i = 0; i < tags.length; i++) {
    const raw = tags[i];

    if (isSpecialTag(raw)) {
      results[i] = raw;
      continue;
    }

    const split = splitTag(raw);
    const inner = split.value;
    if (!inner) {
      results[i] = raw;
      continue;
    }

    const cached = cache[cacheKey(inner, fromLang, targetLang)];
    if (cached) {
      results[i] = `${split.left}${cached}${split.right}`;
      continue;
    }

    let dictHit: string | null = null;
    for (const k of lookupKeys(inner)) {
      const hit = dict.get(k);
      if (hit) {
        dictHit = hit;
        break;
      }
    }
    if (dictHit) {
      results[i] = `${split.left}${dictHit}${split.right}`;
      continue;
    }

    missingIdx.push(i);
    missingValue.push(inner);
    missingSplit.push(split);
  }

  if (missingValue.length > 0) {
    let translated: string[] = [];
    try {
      translated = await fallback(missingValue, targetLang);
    } catch (err) {
      logger.error('后备翻译失败:', { error: err } as LogMeta);
      translated = [];
    }

    let cacheChanged = false;
    for (let j = 0; j < missingIdx.length; j++) {
      const i = missingIdx[j];
      const t = translated[j];
      if (t && t.trim()) {
        cache[cacheKey(missingValue[j], fromLang, targetLang)] = t;
        cacheChanged = true;
        results[i] = `${missingSplit[j].left}${t}${missingSplit[j].right}`;
      } else {
        results[i] = tags[i];
      }
    }
    if (cacheChanged) scheduleFlush();
  }

  return results.map((r, i) => r ?? tags[i]);
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
