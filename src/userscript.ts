import { TranslationEngine } from './engine';
import { sunoAdapter } from './adapter';
declare function GM_getValue(key: string, fallback: boolean): boolean;
declare function GM_setValue(key: string, value: boolean): void;
declare function GM_registerMenuCommand(label: string, callback: () => void): number;
declare function GM_unregisterMenuCommand(id: number): void;
const engine = new TranslationEngine(document, sunoAdapter);
let enabled = GM_getValue('chineseEnabled', true) !== false;
let menu: number | undefined;
function apply() {
  engine.setEnabled(enabled);
  if (menu !== undefined) GM_unregisterMenuCommand(menu);
  menu = GM_registerMenuCommand(enabled ? '切换为英文 / Show English' : '切换为中文 / Show Chinese', () => {
    enabled = !enabled;
    GM_setValue('chineseEnabled', enabled);
    apply();
  });
}
apply();
window.addEventListener('pagehide', () => engine.destroy());
window.addEventListener('pageshow', () => engine.setEnabled(enabled));
