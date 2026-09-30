/**
 * Dev-only layout guard for the scrapbook pages. Every page is a 480×660 artboard and
 * every collage element (photo, note, sticker, ticket…) must stay at least MARGIN
 * artboard-px inside it. Elements marked `data-bleed` (paper clutter, crumples, vinyl,
 * maps) are background sheets that intentionally run off the edge and are skipped.
 *
 * Measures the rotated bounding box, so a tilted polaroid counts its corners too.
 */
const ARTBOARD_W = 480;
const MARGIN = 8;
const warned = new Set<string>();

const label = (el: Element) =>
  (typeof el.className === 'string' && el.className
    ? el.className.split(' ')[0].replace(/^.*?__/, '') // CSS-module hash → readable name
    : el.tagName.toLowerCase());

export function auditVisiblePages(root: HTMLElement | null) {
  if (process.env.NODE_ENV === 'production' || !root) return;
  root.querySelectorAll<HTMLElement>('article[data-page]').forEach((page) => {
    const pr = page.getBoundingClientRect();
    if (!pr.width) return; // not on screen right now
    const k = pr.width / ARTBOARD_W, m = MARGIN * k;
    for (const el of Array.from(page.children)) {
      if (el.hasAttribute('data-bleed') || getComputedStyle(el).position !== 'absolute') continue;
      const r = el.getBoundingClientRect();
      const over = {
        left: pr.left + m - r.left, right: r.right - (pr.right - m),
        top: pr.top + m - r.top, bottom: r.bottom - (pr.bottom - m),
      };
      const sides = Object.entries(over).filter(([, v]) => v > 0.5 * k).map(([side, v]) => `${side} ${Math.round(v / k)}px`);
      if (!sides.length) continue;
      const msg = `[book] page ${page.dataset.page}: .${label(el)} overflows the ${MARGIN}px safe area (${sides.join(', ')})`;
      if (!warned.has(msg)) { warned.add(msg); console.warn(msg); }
    }
  });
}
