'use client';
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import s from './Scrapbook.module.css';
import x from './Extras.module.css';
import { cx } from './parts';
import { renderPages } from './pages';
import { scrapbookData as defaults, type ScrapbookData } from './scrapbookData';
import { auditVisiblePages } from './layoutAudit';

const HTMLFlipBook = lazy(() => import('react-pageflip'));

const TOTAL = 12;
const pad2 = (n: number) => String(n).padStart(2, '0');

const FLIP_CONFIG = {
  width: 480, height: 660, size: 'stretch' as const,
  minWidth: 282, maxWidth: 520, minHeight: 388, maxHeight: 715,
  startPage: 0, drawShadow: true, flippingTime: 1100,
  usePortrait: true, startZIndex: 20, autoSize: true,
  maxShadowOpacity: 0.72, showCover: true,
  mobileScrollSupport: true, clickEventForward: true, useMouseEvents: true,
  swipeDistance: 20, showPageCorners: true, disableFlipByClick: false,
  style: {},
};

const HEART_PATH =
  'M51 12.8c0-.1-.1-.1-.1-.2 0 .1-.1.1-.1.2C31-10.7 0 .2 0 28.9c0 27.6 40.7 56.9 50.9 58.8 10.1-1.8 50.9-31.1 50.9-58.8C101.7.2 70.7-10.7 51 12.8z';

function RadiatingHearts({ intro = false, stage = false }: { intro?: boolean; stage?: boolean }) {
  return (
    <div className={cx(s.radiatingHearts, intro && s.introHearts, stage && s.stageHearts)} aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} className={s.radiatingHeart} viewBox="0 0 101.7 87.6" focusable="false"
             style={{ '--heart-delay': `${-(i + 1)}s` } as CSSProperties}>
          <path d={HEART_PATH} />
        </svg>
      ))}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FlipApi = { pageFlip: () => any };

type Pos = { current: { page: number; introDismissed: boolean; pin?: string | number | null; selected?: number | null } };

export default function Scrapbook({ data = defaults, pin = null, editable = false, pos }: {
  data?: ScrapbookData; pin?: string | number | null; editable?: boolean; pos?: Pos;
}) {
  const book = useRef<FlipApi | null>(null);
  // `pos` survives the remount this component takes on every content edit (see View.tsx) —
  // seed local state from it so a non-pinned edit (e.g. uploading a photo) resumes where the
  // buyer was instead of snapping back to the closed cover every time.
  const [page, setPage] = useState(pos?.current.page ?? 0);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [apiReady, setApiReady] = useState(false);

  // intro → arrive state machine
  const [introVisible, setIntroVisible] = useState(!pos?.current.introDismissed);
  const [entering, setEntering] = useState(false);
  const t = useRef<number | undefined>(undefined);
  const openBook = () => {
    setIntroVisible(false);
    if (pos) pos.current.introDismissed = true;
    setEntering(true);
    window.clearTimeout(t.current);
    t.current = window.setTimeout(() => setEntering(false), 1500);
  };
  useEffect(() => () => window.clearTimeout(t.current), []);

  // The tile the buyer last picked keeps its pencil/outline, across the remount the
  // resulting upload triggers (hence mirrored into the parent-owned `pos`).
  const [selected, setSelected] = useState<number | null>(pos?.current.selected ?? null);
  const onPick = useCallback((slot: number) => {
    setSelected(slot);
    if (pos) pos.current.selected = slot;
    window.parent?.postMessage({ type: 'dear:pick-photo', slot }, window.location.origin);
  }, [pos]);

  useEffect(() => {
    if (!apiReady) return;
    // A pin only wins when it *changed* (the buyer switched editor section) — this effect
    // also re-runs on every remount (i.e. every content edit), and re-applying an unchanged
    // pin there snapped the book back to the section's page (the cover, for section 1)
    // after e.g. picking a photo on page 5. Otherwise resume `pos.current.page` —
    // FLIP_CONFIG.startPage is hardcoded to 0, so without this the book would visually
    // reopen on the cover on every remount.
    const pinChanged = typeof pin === 'number' && (!pos || pin !== pos.current.pin);
    const target = pinChanged ? pin : pos?.current.page;
    if (pos) pos.current.pin = pin;
    if (typeof target !== 'number') return;
    setIntroVisible(false);
    if (pos) { pos.current.introDismissed = true; pos.current.page = target; }
    // turnToPage() is an instant jump (no animation) — flip() is animated and, for
    // targets far from the current page while the book is still on its closed cover,
    // only completes its first internal step before stopping (verified: flip(6),
    // flip(10), and flip(11) from a fresh mount all landed on page 2, the natural
    // "cover just opened" spread, regardless of the requested target). An instant
    // jump is also the semantically correct choice here regardless of that bug,
    // since Book remounts on every keystroke — an animated multi-second flip would
    // replay constantly while a buyer is still typing.
    book.current?.pageFlip()?.turnToPage(target);
  }, [pin, apiReady, pos]);

  const prev = useCallback(() => book.current?.pageFlip()?.flipPrev('top'), []);
  const readAgain = useCallback(() => book.current?.pageFlip()?.turnToPage(0), []);
  const next = useCallback(() => book.current?.pageFlip()?.flipNext('top'), []);

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    const el = e.target as HTMLElement;
    if (el.closest('input, textarea, button, a, [contenteditable="true"]')) return;
    if (introVisible) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
  };

  const pages = useMemo(() => renderPages(data, editable ? onPick : undefined, selected), [data, editable, onPick, selected]);
  // Same numbering as the editor's step tabs (a section's previewPage + 1). In landscape an
  // inner spread shows two pages, so name both instead of only the left one.
  const spread = orientation === 'landscape' && page > 0 && page < TOTAL - 1;
  const first = spread && page % 2 === 0 ? page - 1 : page;
  const shown = spread ? `${pad2(first + 1)}–${pad2(first + 2)}` : pad2(Math.min(page + 1, TOTAL));
  const atEnd = page >= TOTAL - 1;
  const edge = orientation === 'landscape' ? (page === 0 ? 'front' : page >= TOTAL - 1 ? 'back' : undefined) : undefined;

  const shell = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!apiReady) return;
    const id = window.setTimeout(() => auditVisiblePages(shell.current), 400);
    return () => window.clearTimeout(id);
  }, [apiReady, page, orientation, pages]);

  return (
    <section
      ref={shell}
      className={s.scrapbookShell}
      data-entering={entering}
      tabIndex={0}
      onKeyDown={onKeyDown}
      style={{ '--heart-color': data.heartColor } as CSSProperties}
      aria-label="Дурсамжийн ном"
    >
      <RadiatingHearts stage />

      <div className={cx(s.intro, introVisible ? s.introVisible : s.introHidden)} aria-hidden={!introVisible}>
        <RadiatingHearts intro />
        <button type="button" className={s.introNote} onClick={openBook} tabIndex={introVisible ? 0 : -1} autoFocus={!editable /* never steal the caret from the editor */}>
          <span>Чамд зориулсан</span>
          <strong>бэлэг</strong>
          <small>нээх <b>→</b></small>
        </button>
      </div>

      <header className={s.readerBar}>
        <div><strong>Дурсамжийн ном</strong><span>{editable ? 'Доод сумаар хуудас эргүүлнэ' : 'Хуудасны булангаас чирж эргүүлнэ'}</span></div>
        <span className={s.readerCount}>{shown} / {TOTAL}</span>
      </header>

      <div className={cx(s.bookStage, orientation === 'portrait' && s.bookStagePortrait)}>
        <div className={x.flipHost} data-edge={edge}>
          <Suspense fallback={<div className={s.bookSkeleton} />}>
            <HTMLFlipBook
              ref={book}
              className={s.flipBook}
              {...FLIP_CONFIG}
              useMouseEvents={!editable}
              onFlip={(e: { data: number }) => { setPage(e.data); if (pos) pos.current.page = e.data; }}
              onChangeOrientation={(e: { data: 'portrait' | 'landscape' }) => setOrientation(e.data)}
              onInit={(e: { data: { page: number; mode: 'portrait' | 'landscape' } }) => { setOrientation(e.data.mode); setApiReady(true); }}
            >
              {pages}
            </HTMLFlipBook>
          </Suspense>
        </div>
      </div>

      <nav className={s.readerControls} aria-label="Хуудаснууд">
        <button type="button" onClick={prev} disabled={page === 0} aria-label="Өмнөх хуудас">←</button>
        {atEnd ? (
          <button type="button" className={s.readerAgain} onClick={readAgain}>↺ Дахин унших</button>
        ) : (
          <div className={s.progressTrack}>
            <span style={{ transform: `scaleX(${Math.max(0.08, (page + 1) / TOTAL)})` }} />
          </div>
        )}
        <button type="button" onClick={next} disabled={page >= TOTAL - 1} aria-label="Дараагийн хуудас">→</button>
      </nav>
    </section>
  );
}
