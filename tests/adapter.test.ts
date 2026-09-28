// @vitest-environment jsdom
import { afterEach, expect, test } from 'vitest';
import { TranslationEngine } from '../src/engine';
import { sunoAdapter } from '../src/adapter';
let engine: TranslationEngine;
const settle = () => new Promise(resolve => setTimeout(resolve, 80));
function start(html: string, path = '/me') {
  history.replaceState({}, '', path); document.body.innerHTML = html;
  engine = new TranslationEngine(document, sunoAdapter); engine.setEnabled(true);
}
afterEach(() => { engine?.destroy(); document.body.innerHTML = ''; });
test('navigation and library tabs use routes, not arbitrary text', async () => {
  start('<a href="/create">Create</a><div role="tablist"><a role="tab" href="/me">Songs</a></div><a href="/song/example">Create</a><p>Create</p>');
  await settle(); expect(document.body.textContent).toBe('创作歌曲CreateCreate');
});
test('creation form excludes lyrics and styles and leaves results untouched', async () => {
  start('<section><span role="tablist" aria-label="Create form mode"><button role="tab" aria-label="Advanced">Advanced</button></span><div role="textbox" aria-label="Lyrics editor" contenteditable="true">Create</div><div data-testid="create-form-styles-wrapper"><textarea>Styles</textarea></div><span>Weirdness</span><button>Create</button></section><article><a href="/song/test">Weirdness</a></article>', '/create');
  await settle(); expect(document.querySelector('button')!.textContent).toBe('高级');
  expect(document.querySelector('[contenteditable]')!.textContent).toBe('Create');
  expect(document.querySelector('textarea')!.value).toBe('Styles');
  expect(document.querySelector('section > span:last-of-type')!.textContent).toBe('实验程度');
  expect(document.querySelector('article')!.textContent).toBe('Weirdness');
});
test('filter popup is translated only when bound to the filter trigger', async () => {
  start('<button role="combobox" aria-label="Filters (2)" aria-controls="filters-123">Filters (2)</button><div role="listbox" id="filters-123"><div role="option">Public</div><div role="option">Hide Stems</div></div><div role="listbox"><div role="option">Public</div></div>');
  await settle(); expect(document.querySelector('button')!.textContent).toBe('筛选 (2)');
  expect(document.querySelector('#filters-123')!.textContent).toBe('公开隐藏分轨');
  expect(document.querySelectorAll('[role=listbox]')[1].textContent).toBe('Public');
});
test('context actions translate but arbitrary song labels stay intact', async () => {
  start('<a href="/song/a"><span>Download</span></a><div class="context-menu-item"><button aria-label="Download"><span>Download</span></button></div>');
  await settle(); expect(document.querySelector('a')!.textContent).toBe('Download');
  expect(document.querySelector('button')!.textContent).toBe('下载');
});
test('input value is untouched; only known library placeholder is translated', async () => {
  start('<input placeholder="Search songs" value="Create"><button title="Filters">Filters</button>');
  await settle(); expect(document.querySelector('input')!.value).toBe('Create');
  expect(document.querySelector('input')!.placeholder).toBe('搜索歌曲');
  engine.setEnabled(false); expect(document.querySelector('input')!.placeholder).toBe('Search songs');
});
