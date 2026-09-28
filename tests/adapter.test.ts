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
test('a user item rendered as a button is not mistaken for library UI', async () => {
  start('<button>Styles</button><div class="clip-title-wrapper"><button>Filters</button></div>');
  await settle(); expect(document.body.textContent).toBe('StylesFilters');
});
test('input value is untouched; only known library placeholder is translated', async () => {
  start('<input placeholder="Search songs" value="Create"><button title="Filters">Filters</button>');
  await settle(); expect(document.querySelector('input')!.value).toBe('Create');
  expect(document.querySelector('input')!.placeholder).toBe('搜索歌曲');
  engine.setEnabled(false); expect(document.querySelector('input')!.placeholder).toBe('Search songs');
});
test('repurposing a navigation link as a song title restores the original text', async () => {
  start('<a href="/create">Create</a>'); await settle();
  const link = document.querySelector('a')!;
  link.href = '/song/example'; await settle(); expect(link.textContent).toBe('Create');
});
test('library subpage tabs are localized', async () => {
  start('<div role="tablist"><a role="tab" href="/me/playlists">Playlists</a><a role="tab" href="/me/workspaces">Workspaces</a></div>', '/me/playlists');
  await settle(); expect(document.body.textContent).toBe('播放列表工作区');
});
test.each(['/song/synthetic', '/me'])('embedded composer translates on %s without touching song content', async path => {
  start('<section><span role="tablist" aria-label="Create form mode"><button role="tab" aria-label="Advanced">Advanced</button></span><button>Audio</button><button>Voice</button><button>Inspo</button><h2>Lyrics</h2><div role="textbox" aria-label="Lyrics editor" contenteditable="true">Audio Voice Inspo</div><div data-testid="create-form-styles-wrapper"><textarea>Styles</textarea></div><h2>Styles</h2><button>Create</button></section><article><h1>Audio</h1><p>Voice Inspo Lyrics</p><a href="/song/other">Create</a></article>', path);
  await settle();
  const section = document.querySelector('section')!;
  expect([...section.querySelectorAll('button')].map(button => button.textContent)).toEqual(['高级', '音频', '声音', '灵感', '创作']);
  expect([...section.querySelectorAll('h2')].map(heading => heading.textContent)).toEqual(['歌词', '风格']);
  expect(document.querySelector('[contenteditable]')!.textContent).toBe('Audio Voice Inspo');
  expect(document.querySelector('textarea')!.value).toBe('Styles');
  expect(document.querySelector('article')!.textContent).toBe('AudioVoice Inspo LyricsCreate');
  engine.setEnabled(false);
  expect([...section.querySelectorAll('button')].map(button => button.textContent)).toEqual(['Advanced', 'Audio', 'Voice', 'Inspo', 'Create']);
});
test('mode tabs translate before the editor mounts without granting scope to unrelated content', async () => {
  start('<section><span role="tablist" aria-label="Create form mode"><button role="tab" aria-label="Simple">Simple</button></span></section><article><h2>Lyrics</h2><textarea>Styles</textarea></article>', '/song/synthetic');
  await settle();
  expect(document.querySelector('button')!.textContent).toBe('简单');
  expect(document.querySelector('article h2')!.textContent).toBe('Lyrics');
});
