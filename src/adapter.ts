import type { TranslationAdapter } from './engine';
export const sunoAdapter: TranslationAdapter = {
  isProtected: el => Boolean(el.closest('script,style,noscript,textarea,[contenteditable]:not([contenteditable="false"])')),
  text: () => undefined,
  attribute: () => undefined,
};
