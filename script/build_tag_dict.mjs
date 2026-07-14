// Refresh vendored tag translation dictionaries from
// Physton/sd-webui-prompt-all-in-one. Run with `node script/build_tag_dict.mjs`.
// The files are consumed directly by electron/services/tagTranslate.cts.

import fs from 'node:fs/promises';
import path from 'node:path';

const LOCALES = ['zh_CN']; // add more (ja_JP, ko_KR, ...) as needed
const OUT_DIR = path.resolve('script/tag-dict');

await fs.mkdir(OUT_DIR, { recursive: true });

for (const code of LOCALES) {
  const url = `https://raw.githubusercontent.com/Physton/sd-webui-prompt-all-in-one/main/group_tags/${code}.yaml`;
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`skip ${code}: HTTP ${res.status}`);
    continue;
  }
  const outPath = path.join(OUT_DIR, `${code}.yaml`);
  await fs.writeFile(outPath, await res.text(), 'utf8');
  console.log(`wrote ${outPath}`);
}
