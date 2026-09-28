export interface TranslationAdapter {
  isProtected(element: Element): boolean;
  text(node: Text, source: string): string | undefined;
  attribute(element: Element, name: string, source: string): string | undefined;
}
interface Edit { original: string; translated: string }
export class TranslationEngine {
  private observer: MutationObserver;
  private edits = new Map<Node, Map<string, Edit>>();
  private pending = new Set<Node>();
  private tasks: Generator<Node>[] = [];
  private timer: ReturnType<typeof setTimeout> | undefined;
  private enabled = false;
  readonly stats = { visited: 0, writes: 0, batches: 0 };

  constructor(private document: Document, private adapter: TranslationAdapter) {
    this.observer = new document.defaultView!.MutationObserver(records => {
      for (const record of records) {
        if (record.type === 'childList') {
          // The containing control may have changed from UI to user content.
          if (record.target.nodeType === 1 && (record.target as Element).matches('button,[role="tab"],[role="menuitem"]')) this.pending.add(record.target);
          for (const node of record.addedNodes) this.pending.add(node);
        } else this.pending.add(record.target);
      }
      for (const node of this.edits.keys()) if (!node.isConnected) this.edits.delete(node);
      this.schedule();
    });
  }
  setEnabled(enabled: boolean) {
    if (enabled === this.enabled) return;
    this.enabled = enabled;
    if (!enabled) {
      this.observer.disconnect();
      clearTimeout(this.timer); this.timer = undefined;
      this.pending.clear(); this.tasks = [];
      for (const [node, edits] of this.edits) for (const [key, edit] of edits) {
        if (this.read(node, key) === edit.translated) this.write(node, key, edit.original);
      }
      this.edits.clear();
      return;
    }
    this.observer.observe(this.document.body, {
      subtree: true, childList: true, characterData: true, attributes: true,
      attributeFilter: ['title', 'placeholder', 'role', 'href', 'aria-label', 'hidden', 'contenteditable'],
    });
    this.pending.add(this.document.body); this.schedule();
  }
  destroy() { this.setEnabled(false); }
  private schedule() {
    if (!this.enabled || this.timer !== undefined || (!this.pending.size && !this.tasks.length)) return;
    this.timer = setTimeout(() => this.flush(), 0);
  }
  private *walk(node: Node): Generator<Node> {
    if (!node.isConnected) return;
    if (node.nodeType === 1 && this.adapter.isProtected(node as Element)) {
      // A previously translated subtree can be repurposed by the website.
      for (const edited of this.edits.keys()) if (node.contains(edited)) this.restore(edited);
      return;
    }
    yield node;
    for (const child of [...node.childNodes]) yield* this.walk(child);
  }
  private flush() {
    this.timer = undefined;
    if (!this.enabled) return;
    const roots = [...this.pending].filter(node => {
      for (let parent = node.parentNode; parent; parent = parent.parentNode) if (this.pending.has(parent)) return false;
      return true;
    });
    this.pending.clear();
    this.tasks.push(...roots.map(root => this.walk(root)));
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
  private read(node: Node, key: string) { return key === '#text' ? node.nodeValue : (node as Element).getAttribute(key); }
  private write(node: Node, key: string, value: string) {
    if (key === '#text') node.nodeValue = value;
    else (node as Element).setAttribute(key, value);
    this.stats.writes++;
  }
  private restore(node: Node) {
    const edits = this.edits.get(node);
    if (edits) for (const [key, edit] of edits) if (this.read(node, key) === edit.translated) this.write(node, key, edit.original);
    this.edits.delete(node);
  }
  private process(node: Node) {
    this.stats.visited++;
    if (node.nodeType !== 1 && node.nodeType !== 3) return;
    const element = node.nodeType === 1 ? node as Element : node.parentElement;
    if (!element || this.adapter.isProtected(element)) { this.restore(node); return; }
    for (const key of node.nodeType === 3 ? ['#text'] : ['title', 'placeholder']) {
      const current = this.read(node, key);
      let previous = this.edits.get(node)?.get(key);
      if (previous && current !== previous.translated) {
        this.edits.get(node)!.delete(key); previous = undefined;
      }
      if (current === null) continue;
      const source = previous?.original ?? current;
      const translation = key === '#text' ? this.adapter.text(node as Text, source) : this.adapter.attribute(element, key, source);
      if (translation === undefined || translation === source) {
        if (previous && current === previous.translated) this.write(node, key, previous.original);
        this.edits.get(node)?.delete(key);
      } else {
        if (!this.edits.has(node)) this.edits.set(node, new Map());
        this.edits.get(node)!.set(key, { original: source, translated: translation });
        if (current !== translation) this.write(node, key, translation);
      }
      if (this.edits.get(node)?.size === 0) this.edits.delete(node);
    }
  }
}
