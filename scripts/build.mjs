import { build } from 'esbuild';
import { readFile } from 'node:fs/promises';
const { version } = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const base = 'https://raw.githubusercontent.com/zenoskongfu/suno-zh/main/dist/suno-zh.user.js';
await build({
  entryPoints: ['src/userscript.ts'], bundle: true, outfile: 'dist/suno-zh.user.js',
  format: 'iife', target: 'es2022', charset: 'utf8', legalComments: 'none',
  banner: { js: `// ==UserScript==
// @name         Suno 中文助手
// @namespace    https://github.com/zenoskongfu/suno-zh
// @version      ${version}
// @description  Suno 常用创作界面汉化，可随时恢复英文，不翻译用户内容。
// @author       zenoskongfu
// @match        https://suno.com/*
// @match        https://www.suno.com/*
// @run-at       document-idle
// @noframes
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @homepageURL  https://github.com/zenoskongfu/suno-zh
// @supportURL   https://github.com/zenoskongfu/suno-zh/issues
// @downloadURL  ${base}
// @updateURL    ${base}
// ==/UserScript==` },
});
