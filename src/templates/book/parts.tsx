'use client';
import { forwardRef, useState, type ReactNode } from 'react';
import s from './Scrapbook.module.css';
import x from './Extras.module.css';

export const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

export function Photo({ src, className }: { src?: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={cx(s.photo, className)}>
      {src && !failed ? (
        <img src={src} alt="хайрын зураг" loading="lazy" decoding="async" draggable={false} onError={() => setFailed(true)} />
      ) : (
        <div className={x.photoEmpty} aria-hidden>
          <i><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="M21 16l-5-5-8 8" /></svg></i>
        </div>
      )}
    </div>
  );
}

export const Tape = ({ className }: { className?: string }) => <span className={cx(s.tape, className)} aria-hidden />;

export function Ransom({ className, children }: { className?: string; children: string }) {
  return (
    <div className={cx(s.ransomTitle, className)} aria-label={children}>
      {[...children].map((ch, i) =>
        ch === ' ' ? <span key={i} className={s.ransomSpace} /> : <span key={i} aria-hidden>{ch}</span>,
      )}
    </div>
  );
}

export const Clutter = ({ src, className }: { src: string; className?: string }) => (
  <img className={cx(s.pageClutter, className)} src={src} alt="" aria-hidden draggable={false} loading="lazy"
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
