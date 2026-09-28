import { expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
test('userscript is restricted to Suno and has install metadata', () => {
  const build = readFileSync('scripts/build.mjs', 'utf8');
  expect(build).toContain('// @match        https://suno.com/*');
  expect(build).not.toContain('// @match        *://*/*');
  expect(build).toContain('// @noframes');
});
