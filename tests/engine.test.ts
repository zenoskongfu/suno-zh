// @vitest-environment jsdom
import { afterEach, expect, test } from 'vitest';
import { TranslationEngine, type TranslationAdapter } from '../src/engine';
const dictionary: Record<string, string> = { Create: '创建', Library: '资料库' };
const adapter: TranslationAdapter = {
  isProtected: el => Boolean(el.closest('[contenteditable="true"],textarea,[data-user]')),
  text: (node, source) => node.parentElement?.closest('[data-ui]') ? dictionary[source] : undefined,
  attribute: (el, _key, source) => el.matches('[data-ui]') ? dictionary[source] : undefined,
};
let engine: TranslationEngine;
const settle = () => new Promise(resolve => setTimeout(resolve, 60));
afterEach(() => { engine?.destroy(); document.body.innerHTML = ''; });
function start(html: string) { document.body.innerHTML = html; engine = new TranslationEngine(document, adapter); engine.setEnabled(true); }
test('translates only UI and restores text and attributes without replacing elements', async () => {
  start('<button data-ui title="Create">Create</button><p data-user>Create</p><textarea>Create</textarea>');
  const button = document.querySelector('button')!;
  let clicks = 0; button.onclick = () => clicks++;
  await settle(); expect(button.textContent).toBe('创建'); expect(button.title).toBe('创建');
  button.click(); expect(clicks).toBe(1);
  expect(document.querySelector('p')!.textContent).toBe('Create');
  engine.setEnabled(false); expect(button.textContent).toBe('Create'); expect(button.title).toBe('Create');
});
test('supports dynamic menus, node reuse, external updates and conditional restore', async () => {
  start('<button data-ui>Create</button>'); await settle();
  const button = document.querySelector('button')!;
  button.firstChild!.nodeValue = 'Library'; await settle(); expect(button.textContent).toBe('资料库');
  document.body.insertAdjacentHTML('beforeend', '<div role="menu"><button data-ui>Create</button></div>');
  await settle(); expect(document.querySelector('[role=menu]')!.textContent).toBe('创建');
  button.firstChild!.nodeValue = 'User text'; engine.setEnabled(false);
  expect(button.textContent).toBe('User text');
});
test('stabilizes after its own mutations and repeated toggles', async () => {
  start('<button data-ui>Create</button>'); await settle();
  for (let i = 0; i < 4; i++) { engine.setEnabled(false); engine.setEnabled(true); }
  await settle(); const stats = { ...engine.stats }; await settle(); expect(engine.stats).toEqual(stats);
  document.querySelector('button')!.firstChild!.nodeValue = 'Library'; await settle();
  expect(engine.stats.writes - stats.writes).toBe(1);
});
test('restores a subtree moved into an editable region', async () => {
  start('<button data-ui>Create</button><div contenteditable="true"></div>'); await settle();
  document.querySelector('div')!.append(document.querySelector('button')!); await settle();
  expect(document.querySelector('button')!.textContent).toBe('Create');
});
test('small updates do not rescan a large song list', async () => {
  start('<button data-ui>Create</button>' + '<p data-user>Create</p>'.repeat(5000));
  await new Promise(resolve => setTimeout(resolve, 500));
  const before = engine.stats.visited;
  const beforeMs = engine.stats.workMs;
  document.querySelector('button')!.firstChild!.nodeValue = 'Library'; await settle();
  const delta = engine.stats.visited - before;
  expect(delta).toBeLessThan(10);
  expect([...document.querySelectorAll('p')].every(el => el.textContent === 'Create')).toBe(true);
  console.info(`5000 protected songs; small update visited ${delta} nodes; translation work ${(engine.stats.workMs - beforeMs).toFixed(2)} ms`);
});
test('detached nodes restore safely before reuse and can be translated again', async () => {
  start('<button data-ui>Create</button>'); await settle();
  const button = document.querySelector('button')!;
  button.remove(); await settle(); expect(button.textContent).toBe('Create');
  document.body.append(button); await settle(); expect(button.textContent).toBe('创建');
  engine.setEnabled(false); expect(button.textContent).toBe('Create');
});
test('attribute changes preserve new website content and newly protected areas restore', async () => {
  start('<section><button data-ui title="Create">Create</button></section>'); await settle();
  const button = document.querySelector('button')!;
  button.title = 'Library'; await settle(); expect(button.title).toBe('资料库');
  document.querySelector('section')!.setAttribute('contenteditable', 'true'); await settle();
  expect(button.textContent).toBe('Create'); expect(button.title).toBe('Library');
});
