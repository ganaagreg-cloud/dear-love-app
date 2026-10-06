'use client';
import { useEffect } from 'react';

/** 2 · The logo, letter by letter, with the «та-дам» (≤ 2.5s). `still` = the editor's frozen frame. */
export default function Intro({ onDone, still = false }: { onDone: () => void; still?: boolean }) {
  useEffect(() => {
    if (still) return;
    const t = window.setTimeout(onDone, 2500);
    return () => window.clearTimeout(t);
  }, [onDone, still]);
  return (
    <section className={`lf-screen lf-intro ${still ? 'still' : ''}`} aria-label="LoveFlix">
      <div className="lf-intro-logo" aria-hidden>
        {[...'LOVEFLIX'].map((ch, i) => <span key={i} style={{ animationDelay: `${0.25 + i * 0.09}s` }}>{ch}</span>)}
      </div>
    </section>
  );
}
