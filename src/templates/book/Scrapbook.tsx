'use client';
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import s from './Scrapbook.module.css';
import x from './Extras.module.css';
import { cx } from './parts';
import { renderPages } from './pages';
import { scrapbookData as defaults, type ScrapbookData } from './scrapbookData';

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

export default function Scrapbook({ data = defaults }: { data?: ScrapbookData }) {
  const book = useRef<FlipApi | null>(null);
  const [page, setPage] = useState(0);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');

  // intro → arrive state machine
  const [introVisible, setIntroVisible] = useState(true);
  const [entering, setEntering] = useState(false);
  const t = useRef<number | undefined>(undefined);
  const openBook = () => {
    setIntroVisible(false);
    setEntering(true);
    window.clearTimeout(t.current);
    t.current = window.setTimeout(() => setEntering(false), 1500);
  };
  useEffect(() => () => window.clearTimeout(t.current), []);

  const prev = useCallback(() => book.current?.pageFlip()?.flipPrev('top'), []);
  const next = useCallback(() => book.current?.pageFlip()?.flipNext('top'), []);

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    const el = e.target as HTMLElement;
    if (el.closest('input, textarea, button, a, [contenteditable="true"]')) return;
    if (introVisible) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
  };

  const pages = useMemo(() => renderPages(data), [data]);
  const shown = Math.min(page + 1, TOTAL);

  return (
    <section
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
        <button type="button" className={s.introNote} onClick={openBook} tabIndex={introVisible ? 0 : -1} autoFocus>
          <span>Чамд зориулсан</span>
          <strong>бэлэг</strong>
          <small>нээх <b>→</b></small>
        </button>
      </div>

      <header className={s.readerBar}>
        <div><strong>Дурсамжийн ном</strong><span>Хуудасны булангаас чирж эргүүлнэ</span></div>
        <span className={s.readerCount}>{pad2(shown)} / {TOTAL}</span>
      </header>

      <div className={cx(s.bookStage, orientation === 'portrait' && s.bookStagePortrait)}>
        <div className={x.flipHost}>
          <Suspense fallback={<div className={s.bookSkeleton} />}>
            <HTMLFlipBook
              ref={book}
              className={s.flipBook}
              {...FLIP_CONFIG}
              onFlip={(e: { data: number }) => setPage(e.data)}
              onChangeOrientation={(e: { data: 'portrait' | 'landscape' }) => setOrientation(e.data)}
              onInit={(e: { data: { page: number; mode: 'portrait' | 'landscape' } }) => setOrientation(e.data.mode)}
            >
              {pages}
            </HTMLFlipBook>
          </Suspense>
        </div>
      </div>

      <nav className={s.readerControls} aria-label="Хуудаснууд">
        <button type="button" onClick={prev} disabled={page === 0} aria-label="Өмнөх хуудас">←</button>
        <div className={s.progressTrack}>
          <span style={{ transform: `scaleX(${Math.max(0.08, (page + 1) / TOTAL)})` }} />
        </div>
        <button type="button" onClick={next} disabled={page >= TOTAL - 1} aria-label="Дараагийн хуудас">→</button>
      </nav>
    </section>
  );
}
