// ==UserScript==
// @name         Suno 中文助手
// @namespace    https://github.com/zenoskongfu/suno-zh
// @version      0.1.0
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
// @downloadURL  https://raw.githubusercontent.com/zenoskongfu/suno-zh/main/dist/suno-zh.user.js
// @updateURL    https://raw.githubusercontent.com/zenoskongfu/suno-zh/main/dist/suno-zh.user.js
// ==/UserScript==
"use strict";
(() => {
  // src/engine.ts
  var TranslationEngine = class {
    constructor(document2, adapter) {
      this.document = document2;
      this.adapter = adapter;
      this.observer = new document2.defaultView.MutationObserver((records) => {
        for (const record of records) {
          if (record.type === "childList") {
            if (record.target.nodeType === 1 && record.target.matches('button,[role="tab"],[role="menuitem"]')) this.pending.add(record.target);
            for (const node of record.addedNodes) this.pending.add(node);
          } else this.pending.add(record.target);
        }
        for (const node of this.edits.keys()) if (!node.isConnected) this.edits.delete(node);
        this.schedule();
      });
    }
    document;
    adapter;
    observer;
    edits = /* @__PURE__ */ new Map();
    pending = /* @__PURE__ */ new Set();
    tasks = [];
    timer;
    enabled = false;
    stats = { visited: 0, writes: 0, batches: 0 };
    setEnabled(enabled2) {
      if (enabled2 === this.enabled) return;
      this.enabled = enabled2;
      if (!enabled2) {
        this.observer.disconnect();
        clearTimeout(this.timer);
        this.timer = void 0;
        this.pending.clear();
        this.tasks = [];
        for (const [node, edits] of this.edits) for (const [key, edit] of edits) {
          if (this.read(node, key) === edit.translated) this.write(node, key, edit.original);
        }
        this.edits.clear();
        return;
      }
      this.observer.observe(this.document.body, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true,
        attributeFilter: ["title", "placeholder", "role", "href", "aria-label", "hidden", "contenteditable"]
      });
      this.pending.add(this.document.body);
      this.schedule();
    }
    destroy() {
      this.setEnabled(false);
    }
    schedule() {
      if (!this.enabled || this.timer !== void 0 || !this.pending.size && !this.tasks.length) return;
      this.timer = setTimeout(() => this.flush(), 0);
    }
    *walk(node) {
      if (!node.isConnected) return;
      if (node.nodeType === 1 && this.adapter.isProtected(node)) {
        for (const edited of this.edits.keys()) if (node.contains(edited)) this.restore(edited);
        return;
      }
      yield node;
      for (const child of [...node.childNodes]) yield* this.walk(child);
    }
    flush() {
      this.timer = void 0;
      if (!this.enabled) return;
      const roots = [...this.pending].filter((node) => {
        for (let parent = node.parentNode; parent; parent = parent.parentNode) if (this.pending.has(parent)) return false;
        return true;
      });
      this.pending.clear();
      this.tasks.push(...roots.map((root) => this.walk(root)));
      const start = performance.now();
      this.stats.batches++;
      while (this.tasks.length) {
        const next = this.tasks[0].next();
        if (next.done) this.tasks.shift();
        else if (next.value.isConnected) this.process(next.value);
        if (performance.now() - start >= 8) break;
      }
      this.schedule();
    }
    read(node, key) {
      return key === "#text" ? node.nodeValue : node.getAttribute(key);
    }
    write(node, key, value) {
      if (key === "#text") node.nodeValue = value;
      else node.setAttribute(key, value);
      this.stats.writes++;
    }
    restore(node) {
      const edits = this.edits.get(node);
      if (edits) {
        for (const [key, edit] of edits) if (this.read(node, key) === edit.translated) this.write(node, key, edit.original);
      }
      this.edits.delete(node);
    }
    process(node) {
      this.stats.visited++;
      if (node.nodeType !== 1 && node.nodeType !== 3) return;
      const element = node.nodeType === 1 ? node : node.parentElement;
      if (!element || this.adapter.isProtected(element)) {
        this.restore(node);
        return;
      }
      for (const key of node.nodeType === 3 ? ["#text"] : ["title", "placeholder"]) {
        const current = this.read(node, key);
        let previous = this.edits.get(node)?.get(key);
        if (previous && current !== previous.translated) {
          this.edits.get(node).delete(key);
          previous = void 0;
        }
        if (current === null) continue;
        const source = previous?.original ?? current;
        const translation = key === "#text" ? this.adapter.text(node, source) : this.adapter.attribute(element, key, source);
        if (translation === void 0 || translation === source) {
          if (previous && current === previous.translated) this.write(node, key, previous.original);
          this.edits.get(node)?.delete(key);
        } else {
          if (!this.edits.has(node)) this.edits.set(node, /* @__PURE__ */ new Map());
          this.edits.get(node).set(key, { original: source, translated: translation });
          if (current !== translation) this.write(node, key, translation);
        }
        if (this.edits.get(node)?.size === 0) this.edits.delete(node);
      }
    }
  };

  // src/adapter.ts
  var sunoAdapter = {
    isProtected: (el) => Boolean(el.closest('script,style,noscript,textarea,[contenteditable]:not([contenteditable="false"])')),
    text: () => void 0,
    attribute: () => void 0
  };

  // src/userscript.ts
  var engine = new TranslationEngine(document, sunoAdapter);
  var enabled = GM_getValue("chineseEnabled", true) !== false;
  var menu;
  function apply() {
    engine.setEnabled(enabled);
    if (menu !== void 0) GM_unregisterMenuCommand(menu);
    menu = GM_registerMenuCommand(enabled ? "切换为英文 / Show English" : "切换为中文 / Show Chinese", () => {
      enabled = !enabled;
      GM_setValue("chineseEnabled", enabled);
      apply();
    });
  }
  apply();
  window.addEventListener("pagehide", () => engine.destroy());
  window.addEventListener("pageshow", () => engine.setEnabled(enabled));
})();
