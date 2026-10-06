'use client';
/**
 * Field ↔ preview mapping — the preview (template) side.
 *
 * Templates only mark their editable elements:
 *   <h1 data-field="title">…</h1>             one field
 *   <p data-field="memoryTexts.2">…</p>      one item of a list / images field
 * The editor talks to this module over postMessage:
 *   → { type: 'dear:focus-field', field, label }   highlight (field = null clears)
 *   → { type: 'dear:badges', map }                  «Хаана юу байна» numbers (map = null hides)
 *   ← { type: 'dear:field-click', field }           the buyer clicked an element (edit mode)
 * If the element isn't on screen (another page/scene), the template's `reveal` callback
 * (see useReveal) brings it into view; otherwise it is scrolled into view.
 * Same-origin child iframes (Locket's story) are searched too.
 */
import { useEffect } from 'react';

export type Reveal = (el: Element | null, field: string) => void;
let revealFn: Reveal | null = null;

/** Template hook: how to navigate to an element that is off-page / not rendered yet. */
export function useReveal(fn: Reveal) {
  useEffect(() => {
    revealFn = fn;
    return () => { if (revealFn === fn) revealFn = null; };
  }, [fn]);
}

/* ── DOM helpers (main document + same-origin iframes) ── */
function docs(): Document[] {
  const out = [document];
  document.querySelectorAll('iframe').forEach((f) => {
    try { if (f.contentDocument?.body) out.push(f.contentDocument); } catch { /* cross-origin (Spotify) */ }
  });
  return out;
}
const esc = (s: string) => CSS.escape(s);
/** Exact element(s) for a field id; for a bare list key, its items. */
function findAll(field: string): Element[] {
  for (const d of docs()) {
    const exact = [...d.querySelectorAll(`[data-field="${esc(field)}"]`)];
    if (exact.length) return exact;
  }
  for (const d of docs()) {
    const items = [...d.querySelectorAll(`[data-field^="${esc(field)}."]`)].filter((e) => /^\d+$/.test(e.getAttribute('data-field')!.slice(field.length + 1)));
    if (items.length) return items;
  }
  return [];
}
/** Rect in this (render) document's viewport, adding the offset of a nested iframe. */
function rectOf(el: Element): DOMRect {
  const r = el.getBoundingClientRect();
  const win = el.ownerDocument.defaultView;
  const frame = win && win !== window ? (win.frameElement as HTMLElement | null) : null;
  if (!frame) return r;
  const f = frame.getBoundingClientRect();
  return new DOMRect(r.left + f.left, r.top + f.top, r.width, r.height);
}
function visible(el: Element) {
  const r = rectOf(el);
  if (r.width < 2 || r.height < 2) return false;
  if (r.bottom < 0 || r.right < 0 || r.top > innerHeight || r.left > innerWidth) return false;
  const cs = el.ownerDocument.defaultView!.getComputedStyle(el);
  return cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0.05;
}
const baseKey = (field: string) => field.replace(/(\.\d+)+$/, '');

/* ── overlay layer ── */
const CSS_TEXT = `
#dear-fx{position:fixed;inset:0;pointer-events:none;z-index:2147483646;font:600 12px/1.2 system-ui,-apple-system,'Segoe UI',sans-serif}
#dear-fx .hl{position:fixed;border:2px solid #ff4f8b;border-radius:8px;box-shadow:0 0 0 4px rgba(255,79,139,.18),0 0 24px 4px rgba(255,79,139,.45);transition:all .18s ease;animation:dearPulse .9s ease-out 1}
#dear-fx .hv{position:fixed;border:2px dashed rgba(255,79,139,.75);border-radius:8px;transition:all .12s ease}
#dear-fx .lb{position:fixed;background:#ff4f8b;color:#fff;padding:5px 9px;border-radius:999px;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,.25);max-width:80vw;overflow:hidden;text-overflow:ellipsis;transition:all .18s ease}
#dear-fx .bd{position:fixed;min-width:22px;height:22px;padding:0 6px;border-radius:11px;background:#2a1f2d;color:#fff;display:grid;place-items:center;font-size:12px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3)}
@keyframes dearPulse{0%{box-shadow:0 0 0 0 rgba(255,79,139,.7),0 0 24px 4px rgba(255,79,139,.45)}100%{box-shadow:0 0 0 18px rgba(255,79,139,0),0 0 24px 4px rgba(255,79,139,.45)}}
html.dear-edit [data-field]{cursor:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path d='M3 21l3.5-1 11-11-2.5-2.5-11 11L3 21z' fill='%23ff4f8b' stroke='white' stroke-width='1.5'/><path d='M15 6.5l2.5 2.5 2-2a1.8 1.8 0 0 0-2.5-2.5z' fill='%232a1f2d' stroke='white' stroke-width='1.5'/></svg>") 3 21,pointer}
`;
function layer() {
  let fx = document.getElementById('dear-fx');
  if (!fx) {
    const st = document.createElement('style'); st.id = 'dear-fx-css'; st.textContent = CSS_TEXT; document.head.appendChild(st);
    fx = document.createElement('div'); fx.id = 'dear-fx'; fx.setAttribute('aria-hidden', 'true'); document.body.appendChild(fx);
  }
  return fx;
}
function place(node: HTMLElement, r: DOMRect, pad = 4) {
  node.style.left = `${r.left - pad}px`; node.style.top = `${r.top - pad}px`;
  node.style.width = `${r.width + pad * 2}px`; node.style.height = `${r.height + pad * 2}px`;
}

/**
 * Runs once per render frame (RenderFrame). `edit` = the buyer is editing (hover outlines,
 * pencil cursor, click → open field). Highlight and badges work whenever the editor asks.
 */
export function useFieldHighlight(edit: boolean) {
  useEffect(() => {
    const parent = window.parent;
    if (!parent || parent === window) return;
    const origin = window.location.origin;
    const fx = layer();
    let focus: { field: string; label: string; since: number; revealed: boolean } | null = null;
    let hover: Element | null = null;
    let badges: Record<string, number> | null = null;
    const nodes = { hl: [] as HTMLElement[], lb: document.createElement('div'), hv: document.createElement('div'), bd: [] as HTMLElement[] };
    nodes.lb.className = 'lb'; nodes.hv.className = 'hv';

    const draw = () => {
      /* focused field: box(es) + label */
      let targets: Element[] = [];
      if (focus) {
        const all = findAll(focus.field);
        targets = all.filter(visible);
        if (!targets.length && !focus.revealed) {
          focus.revealed = true;
          if (revealFn) revealFn(all[0] ?? null, focus.field);
          else all[0]?.scrollIntoView({ block: 'center', behavior: 'smooth' });
        } else if (!targets.length && all[0] && performance.now() - focus.since > 700) {
          all[0].scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      }
      while (nodes.hl.length < targets.length) { const n = document.createElement('div'); n.className = 'hl'; nodes.hl.push(n); }
      nodes.hl.forEach((n, i) => {
        if (i < targets.length) { if (!n.isConnected) fx.appendChild(n); place(n, rectOf(targets[i])); }
        else n.remove();
      });
      if (focus && targets.length) {
        const r = rectOf(targets[0]);
        nodes.lb.textContent = `✎ ${focus.label}`;
        if (!nodes.lb.isConnected) fx.appendChild(nodes.lb);
        // dense text (Locket's letter paper) marks its box data-hl-label="outside": the label goes above/below
        // that whole box instead of sitting on top of the line the buyer is reading
        const host = targets[0].closest('[data-hl-label="outside"]');
        const hr = host ? rectOf(host) : r;
        const above = hr.top > 34;
        nodes.lb.style.left = `${Math.max(6, Math.min(hr.left - 4, innerWidth - nodes.lb.offsetWidth - 6))}px`;
        nodes.lb.style.top = `${above ? hr.top - 32 : hr.bottom + 8}px`;
      } else nodes.lb.remove();

      /* hover outline (edit mode) */
      if (edit && hover && hover.isConnected && !(focus && targets.includes(hover))) {
        if (!nodes.hv.isConnected) fx.appendChild(nodes.hv);
        place(nodes.hv, rectOf(hover));
      } else nodes.hv.remove();

      /* «Хаана юу байна» badges */
      const marks: { r: DOMRect; n: number }[] = [];
      if (badges) {
        const seen = new Set<string>();
        for (const d of docs()) for (const el of d.querySelectorAll('[data-field]')) {
          const f = el.getAttribute('data-field')!;
          const n = badges[f] ?? badges[baseKey(f)];
          if (!n || !visible(el)) continue;
          const r = rectOf(el), k = `${n}:${Math.round(r.left / 12)}:${Math.round(r.top / 12)}`;
          if (seen.has(k)) continue; seen.add(k);
          marks.push({ r, n });
        }
      }
      while (nodes.bd.length < marks.length) { const n = document.createElement('div'); n.className = 'bd'; nodes.bd.push(n); }
      nodes.bd.forEach((b, i) => {
        if (i >= marks.length) { b.remove(); return; }
        if (!b.isConnected) fx.appendChild(b);
        b.textContent = String(marks[i].n);
        b.style.left = `${Math.max(2, marks[i].r.left - 8)}px`; b.style.top = `${Math.max(2, marks[i].r.top - 8)}px`;
      });
    };
    let raf = 0;
    const loop = () => { draw(); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);

    const onMsg = (e: MessageEvent) => {
      if (e.origin !== origin || e.source !== parent) return;
      if (e.data?.type === 'dear:focus-field') {
        const field = typeof e.data.field === 'string' ? e.data.field : null;
        if (!field) { focus = null; return; }
        if (focus?.field === field) return;
        focus = { field, label: String(e.data.label || field), since: performance.now(), revealed: false };
        nodes.hl.forEach((n) => n.remove()); // restart the pulse
        nodes.hl = [];
      }
      if (e.data?.type === 'dear:badges') badges = e.data.map && typeof e.data.map === 'object' ? e.data.map : null;
    };
    window.addEventListener('message', onMsg);

    /* edit mode: hover outline, pencil cursor, click → open the field in the editor */
    const cleanups: (() => void)[] = [];
    const wire = (d: Document) => {
      d.documentElement.classList.toggle('dear-edit', edit);
      if (!edit) return;
      const target = (e: Event) => (e.target instanceof d.defaultView!.Element ? e.target.closest('[data-field]') : null);
      const over = (e: Event) => { hover = target(e); };
      const out = (e: Event) => { if (target(e) === hover) hover = null; };
      // In the editor the preview never navigates on its own: only the step numbers on the left change
      // the page (and «▶ Бүтнээр» plays it). So every tap is swallowed; a tap on a field opens it.
      const block = (e: Event) => {
        const t = e.target instanceof d.defaultView!.Element ? e.target : null;
        if (t?.closest('[data-pick]')) return; // Book photo tiles open the file picker themselves
        e.preventDefault(); e.stopPropagation();
        const el = target(e);
        if (el && e.type === 'click') parent.postMessage({ type: 'dear:field-click', field: el.getAttribute('data-field') }, origin);
      };
      const NAV_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', ' ', 'Enter']);
      const key = (e: Event) => { if (NAV_KEYS.has((e as KeyboardEvent).key)) { e.preventDefault(); e.stopPropagation(); } };
      d.addEventListener('keydown', key, true);
      d.addEventListener('pointerover', over, true); d.addEventListener('pointerout', out, true);
      for (const t of ['pointerdown', 'mousedown', 'touchstart', 'click']) d.addEventListener(t, block, { capture: true, passive: false });
      cleanups.push(() => {
        d.documentElement.classList.remove('dear-edit');
        d.removeEventListener('keydown', key, true);
        d.removeEventListener('pointerover', over, true); d.removeEventListener('pointerout', out, true);
        for (const t of ['pointerdown', 'mousedown', 'touchstart', 'click']) d.removeEventListener(t, block, true);
      });
    };
    const wired = new Set<Document>();
    const wireAll = () => { for (const d of docs()) if (!wired.has(d)) { wired.add(d); wire(d); } };
    wireAll();
    const rewire = setInterval(wireAll, 800); // child iframes (Locket) load later

    return () => {
      cancelAnimationFrame(raf); clearInterval(rewire);
      window.removeEventListener('message', onMsg);
      cleanups.forEach((c) => c());
      fx.replaceChildren();
    };
  }, [edit]);
}
