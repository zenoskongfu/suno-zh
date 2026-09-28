import type { TranslationAdapter } from './engine';
import { navigation, library, creation, filters, menus, dialogs, lookup, type Dictionary } from './dictionary';
const protectedSelector = 'script,style,noscript,textarea,pre,code,[contenteditable]:not([contenteditable="false"]),.clip-title-wrapper,a[href^="/song/"],a[href^="/s/"],a[href^="/@"],a[href^="/playlist/"],a[href^="/workspace/"],[data-testid*="song-title"],[data-testid*="song-card"],[data-testid*="song-row"]';
const actionSelector = 'button,[role="button"],[role="tab"],[role="option"],[role="menuitem"],label,h1,h2,h3';
const canonicalRoutes = new Set(['/discover', '/create', '/me', '/studio']);
function isAction(element: Element) { return Boolean(element.closest(actionSelector)); }
function onPage(element: Element, path: string) {
  const pathname = element.ownerDocument.location.pathname;
  return pathname === path || (path === '/me' && pathname.startsWith('/me/'));
}
const createRoots = new WeakMap<Document, { modes: Element; root: Element }>();
function inCreateForm(element: Element) {
  const cached = createRoots.get(element.ownerDocument);
  if (cached?.modes.isConnected && cached.root.contains(cached.modes)) return cached.root.contains(element);
  // Locate the smallest common ancestor of the mode selector and form inputs.
  const modes = element.ownerDocument.querySelector('[role="tablist"][aria-label="Create form mode"]');
  for (let root = modes?.parentElement; root && root !== element.ownerDocument.body; root = root.parentElement) {
    if (root.querySelector('[aria-label="Lyrics editor"], [data-testid="create-form-styles-wrapper"],textarea')) {
      createRoots.set(element.ownerDocument, { modes: modes!, root });
      return root.contains(element);
    }
  }
  return false;
}
function filterPopup(element: Element) {
  const popup = element.closest('[role="listbox"]');
  if (!popup?.id) return false;
  return [...element.ownerDocument.querySelectorAll('button[role="combobox"][aria-label^="Filters"]')]
    .some(button => button.getAttribute('aria-controls') === popup.id);
}
function contextMenuAction(element: Element) {
  return element.closest('.context-menu-item > button[aria-label], [role="menuitem"]');
}
function selectDictionary(element: Element): Dictionary | undefined {
  const link = element.closest('a[href]');
  if (link && canonicalRoutes.has(link.getAttribute('href')!)) {
    if (link.matches('[role="tab"]')) return library;
    return navigation;
  }
  if (element.closest('[role="tablist"] a[role="tab"]') && onPage(element, '/me')) return library;
  if (filterPopup(element)) return filters;
  if (contextMenuAction(element)) return menus;
  if (element.closest('[role="dialog"]') && isAction(element)) return dialogs;
  if (onPage(element, '/create') && inCreateForm(element)) return creation;
  if (onPage(element, '/me') && element.closest('button[role="combobox"][aria-label^="Filters"],button[aria-label="Create Playlist"],button[aria-label="New Playlist"],button[aria-label="New Workspace"]')) return library;
}
export const sunoAdapter: TranslationAdapter = {
  isProtected(element) {
    // Context-menu actions can live inside song cards. Only their button subtree is eligible.
    if (contextMenuAction(element) && !element.closest('[contenteditable]:not([contenteditable="false"])')) return false;
    return Boolean(element.closest(protectedSelector));
  },
  text(node, source) {
    const element = node.parentElement;
    if (!element) return;
    const dict = selectDictionary(element);
    if (!dict) return;
    const direct = lookup(dict, source);
    if (direct) return direct;
    if (dict === library && element.closest('button[role="combobox"][aria-label^="Filters"]')) {
      return source.replace(/^Filters(?=\s*\(\d+\)$)/, '筛选') === source ? undefined : source.replace(/^Filters(?=\s*\(\d+\)$)/, '筛选');
    }
  },
  attribute(element, name, source) {
    // Input values and aria-label identifiers are deliberately untouched.
    if (name === 'placeholder' && element.matches('input') && onPage(element, '/me')) return lookup(library, source);
    if (name === 'title' && isAction(element)) {
      const dict = selectDictionary(element);
      return dict ? lookup(dict, source) : undefined;
    }
  },
};
