import { logger } from './logService.cjs';
import { resolveTagInputPipeline } from './tagTranslate.cjs';

interface LogMeta {
  [key: string]: unknown;
}

const { translateTags } = require('../../script/script.cjs') as {
  translateTags: (tags: string[], targetLang: string) => Promise<string[]>;
};

export async function handleResolveTagInput(input: string, targetLang: string): Promise<string> {
  const trimmed = input.trim();
  if (targetLang !== 'en') {
    logger.error('不支持的标签输入规范化目标语言:', { targetLang } as LogMeta);
    return trimmed;
  }

  return await resolveTagInputPipeline(trimmed, targetLang, (missing, lang) => translateTags([missing], lang));
}
