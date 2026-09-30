'use client';
import { forwardRef, useState, type CSSProperties, type ReactNode } from 'react';
import s from './Scrapbook.module.css';
import x from './Extras.module.css';

export const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

export function Photo({ src, className, onClick, selected }: { src?: string; className?: string; onClick?: () => void; selected?: boolean }) {
  const [failed, setFailed] = useState(false);
  const empty = !src || failed;
  // The recipient never sees an empty frame — only the buyer (editable preview) gets the «+» tile.
  if (empty && !onClick) return null;
  const body = empty ? (
    // Paper scrap + washi-tape corners; the call-to-action only makes sense for the buyer.
    <div className={x.photoEmpty} aria-hidden>{onClick && <span>+ Зураг нэмэх</span>}</div>
  ) : (
    <img src={src} alt="хайрын зураг" loading="lazy" decoding="async" draggable={false} onError={() => setFailed(true)} />
  );
  if (onClick) {
    return (
      <button type="button" className={cx(s.photo, x.photoClickable, className)} onClick={onClick}
              data-empty={empty || undefined} data-selected={selected || undefined}
              aria-label={empty ? 'Зураг нэмэх' : 'Энэ зургийг солих'}>
        {body}
      </button>
    );
  }
  return <div className={cx(s.photo, className)}>{body}</div>;
}

export const Tape = ({ className }: { className?: string }) => <span className={cx(s.tape, className)} aria-hidden />;

/** Letter-tile title on one line: `--n` lets the CSS shrink every tile so the whole
 *  title fits its box, instead of wrapping mid-word (see .ransomTitle). */
export function Ransom({ className, children }: { className?: string; children: string }) {
  const chars = [...children];
  return (
    <div className={cx(s.ransomTitle, className)} aria-label={children} style={{ '--n': Math.max(chars.length, 6) } as CSSProperties}>
      {chars.map((ch, i) =>
        ch === ' ' ? <span key={i} className={s.ransomSpace} /> : <span key={i} aria-hidden>{ch}</span>,
      )}
    </div>
  );
}

export const Clutter = ({ src, className }: { src: string; className?: string }) => (
  <img className={cx(s.pageClutter, className)} src={src} alt="" aria-hidden data-bleed draggable={false} loading="lazy"
       onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
);

export const Sticker = ({ src, className }: { src: string; className?: string }) => (
  <img className={className} src={src} alt="" aria-hidden draggable={false} />
);

/** Multi-line text with <br/> (keeps the reference's LUCKY<br/>LUCKY markup). */
export const Lines = ({ text }: { text: string }) => (
  <>{text.split('\n').map((l, i, a) => (<span key={i} style={{ display: 'contents' }}>{l}{i < a.length - 1 && <br />}</span>))}</>
);

interface PageProps { n: number; hard?: boolean; className?: string; children: ReactNode }
/** react-pageflip needs the ref on the direct child — this is it. */
export const Page = forwardRef<HTMLElement, PageProps>(({ n, hard, className, children }, ref) => (
  <article ref={ref} className={cx(s.page, className)} data-density={hard ? 'hard' : 'soft'} data-page={n}>
    {children}
  </article>
));
Page.displayName = 'Page';
