// ==UserScript==
// @name         Suno 中文助手
// @namespace    https://github.com/zenoskongfu/suno-zh
// @version      0.1.1
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
        for (const node of this.edits.keys()) if (!node.isConnected) this.restore(node);
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
    stats = { visited: 0, writes: 0, batches: 0, workMs: 0, maxBatchMs: 0 };
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
      const elapsed = performance.now() - start;
      this.stats.workMs += elapsed;
      this.stats.maxBatchMs = Math.max(this.stats.maxBatchMs, elapsed);
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

  // src/dictionary.ts
  var navigation = {
    Explore: "探索",
    Create: "创作",
    Library: "资料库",
    Studio: "工作室",
    Home: "首页"
  };
  var library = {
    Songs: "歌曲",
    Playlists: "播放列表",
    Workspaces: "工作区",
    Voices: "声音",
    Lyrics: "歌词",
    Styles: "风格",
    Filters: "筛选",
    Search: "搜索",
    "Search songs": "搜索歌曲",
    "Search your songs": "搜索你的歌曲",
    "Search library": "搜索资料库",
    "Search your library": "搜索你的资料库",
    "Newest First": "最新优先",
    "Oldest First": "最早优先",
    "Newest first": "最新优先",
    "Oldest first": "最早优先",
    "Recently Created": "最近创建",
    "Recently created": "最近创建",
    "Recently Updated": "最近更新",
    "Create Playlist": "创建播放列表",
    "Create playlist": "创建播放列表",
    "New Playlist": "新建播放列表",
    "New playlist": "新建播放列表",
    "New Workspace": "新建工作区",
    "New workspace": "新建工作区",
    "My Workspace": "我的工作区",
    "My Workspaces": "我的工作区",
    "All Songs": "全部歌曲",
    "All songs": "全部歌曲"
  };
  var creation = {
    Simple: "简单",
    Advanced: "高级",
    Sounds: "音效",
    Custom: "自定义",
    Audio: "音频",
    Voice: "声音",
    Inspo: "灵感",
    Lyrics: "歌词",
    Styles: "风格",
    "More Options": "更多选项",
    "More options": "更多选项",
    "Advanced Options": "高级选项",
    "Advanced options": "高级选项",
    "Song Description": "歌曲描述",
    "Song description": "歌曲描述",
    "Song Title": "歌曲标题",
    "Song title": "歌曲标题",
    Title: "标题",
    "Vocal Gender": "人声性别",
    "Vocal gender": "人声性别",
    Male: "男声",
    Female: "女声",
    Duration: "时长",
    "Max Mode": "Max 模式",
    Weirdness: "实验程度",
    "Style Influence": "风格影响力",
    "Style influence": "风格影响力",
    Variety: "多样性",
    Personalize: "个性化",
    Instrumental: "纯音乐",
    "Auto Lyrics": "自动歌词",
    "Write Lyrics": "写歌词",
    "Write lyrics": "写歌词",
    "Add Lyrics": "添加歌词",
    "Add lyrics": "添加歌词",
    "Add Styles": "添加风格",
    "Add styles": "添加风格",
    "Exclude Styles": "排除风格",
    "Exclude styles": "排除风格",
    "Audio Influence": "音频影响力",
    Create: "创作",
    "Upload Audio": "上传音频",
    "Upload audio": "上传音频",
    "Add Audio": "添加音频",
    "Add audio": "添加音频",
    "Add Persona": "添加角色",
    "Save to": "保存到",
    "Song Settings": "歌曲设置",
    "Clear All": "全部清除"
  };
  var filters = {
    Filters: "筛选",
    Liked: "已喜欢",
    Disliked: "不喜欢",
    Public: "公开",
    Private: "私密",
    Uploads: "已上传",
    "Full song": "完整歌曲",
    "Full Song": "完整歌曲",
    Cover: "翻唱",
    Voices: "声音",
    Downloads: "下载",
    "Hide Disliked": "隐藏不喜欢的歌曲",
    "Hide Stems": "隐藏分轨",
    "Hide disliked": "隐藏不喜欢的歌曲",
    "Hide stems": "隐藏分轨",
    "Clear Filters": "清除筛选",
    "Clear filters": "清除筛选",
    Reset: "重置",
    Apply: "应用",
    All: "全部"
  };
  var menus = {
    Publish: "发布",
    Manage: "管理",
    Share: "分享",
    "Add to Queue": "加入播放队列",
    "Add to queue": "加入播放队列",
    "Add to Playlist": "加入播放列表",
    "Add to playlist": "加入播放列表",
    "Song Radio": "歌曲电台",
    Report: "举报",
    Download: "下载",
    Edit: "编辑",
    "Edit Song Details": "编辑歌曲信息",
    Rename: "重命名",
    "Move to Workspace": "移至工作区",
    "Move to workspace": "移至工作区",
    "Move to Trash": "移至回收站",
    "Move to trash": "移至回收站",
    "Copy Link": "复制链接",
    "Copy link": "复制链接",
    "Get Stems": "获取分轨",
    "Remix / Edit": "混音 / 编辑",
    Remix: "混音",
    Extend: "续写",
    "Reuse Prompt": "复用提示词",
    "Create Cover": "创建翻唱",
    "Make Public": "设为公开",
    "Make Private": "设为私密"
  };
  var dialogs = {
    Cancel: "取消",
    Save: "保存",
    Close: "关闭",
    Done: "完成",
    Confirm: "确认",
    "Copy Link": "复制链接",
    "Copy link": "复制链接",
    "Create Playlist": "创建播放列表",
    "Create playlist": "创建播放列表",
    "New Playlist": "新建播放列表",
    "Add to Playlist": "加入播放列表",
    "Move to Workspace": "移至工作区",
    Share: "分享",
    Download: "下载"
  };
  function lookup(dictionary, value) {
    const trimmed = value.trim().replace(/\s+/g, " ");
    const translated = dictionary[trimmed];
    if (typeof translated !== "string" || !Object.hasOwn(dictionary, trimmed)) return;
    return value.replace(value.trim(), translated);
  }

  // src/adapter.ts
  var protectedSelector = 'script,style,noscript,textarea,pre,code,[contenteditable]:not([contenteditable="false"]),.clip-title-wrapper,a[href^="/song/"],a[href^="/s/"],a[href^="/@"],a[href^="/playlist/"],a[href^="/workspace/"],[data-testid*="song-title"],[data-testid*="song-card"],[data-testid*="song-row"]';
  var actionSelector = 'button,[role="button"],[role="tab"],[role="option"],[role="menuitem"],label,h1,h2,h3';
  var canonicalRoutes = /* @__PURE__ */ new Set(["/discover", "/create", "/me", "/studio"]);
  function isAction(element) {
    return Boolean(element.closest(actionSelector));
  }
  function onPage(element, path) {
    const pathname = element.ownerDocument.location.pathname;
    return pathname === path || path === "/me" && pathname.startsWith("/me/");
  }
  var createRoots = /* @__PURE__ */ new WeakMap();
  function inCreateForm(element) {
    const doc = element.ownerDocument;
    if (!createRoots.has(doc)) {
      let form = null;
      const modes = doc.querySelector('[role="tablist"][aria-label="Create form mode"]');
      for (let root = modes?.parentElement; root && root !== doc.body; root = root.parentElement) {
        if (root.querySelector('[aria-label="Lyrics editor"], [data-testid="create-form-styles-wrapper"]')) {
          form = root;
          break;
        }
      }
      createRoots.set(doc, form);
      queueMicrotask(() => createRoots.delete(doc));
    }
    return createRoots.get(doc)?.contains(element) ?? false;
  }
  function filterPopup(element) {
    const popup = element.closest('[role="listbox"]');
    if (!popup?.id) return false;
    return [...element.ownerDocument.querySelectorAll('button[role="combobox"][aria-label^="Filters"]')].some((button) => button.getAttribute("aria-controls") === popup.id);
  }
  function contextMenuAction(element) {
    return element.closest('.context-menu-item > button[aria-label], [role="menuitem"]');
  }
  function selectDictionary(element) {
    const link = element.closest("a[href]");
    if (link && canonicalRoutes.has(link.getAttribute("href"))) {
      if (link.matches('[role="tab"]')) return library;
      return navigation;
    }
    if (element.closest('[role="tablist"] a[role="tab"]') && onPage(element, "/me")) return library;
    if (filterPopup(element)) return filters;
    if (contextMenuAction(element)) return menus;
    if (element.closest('[role="dialog"]') && isAction(element)) return dialogs;
    if (element.closest('[role="tablist"][aria-label="Create form mode"]') || inCreateForm(element)) return creation;
    if (onPage(element, "/me") && element.closest('button[role="combobox"][aria-label^="Filters"],button[aria-label="Create Playlist"],button[aria-label="New Playlist"],button[aria-label="New Workspace"]')) return library;
  }
  var sunoAdapter = {
    isProtected(element) {
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
        return source.replace(/^Filters(?=\s*\(\d+\)$)/, "筛选") === source ? void 0 : source.replace(/^Filters(?=\s*\(\d+\)$)/, "筛选");
      }
    },
    attribute(element, name, source) {
      if (name === "placeholder" && element.matches("input") && onPage(element, "/me")) return lookup(library, source);
      if (name === "title" && isAction(element)) {
        const dict = selectDictionary(element);
        return dict ? lookup(dict, source) : void 0;
      }
    }
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
