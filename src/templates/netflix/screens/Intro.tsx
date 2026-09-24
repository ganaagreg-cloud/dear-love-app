'use client';
import type { ScreenProps } from './types';

export default function Intro({ data }: ScreenProps) {
  return (
    <section className="lf-screen lf-intro">
      <div className="lf-n-wrap">
        <svg viewBox="0 0 120 200" className="lf-n-svg" aria-label="LoveFlix эхлэл">
          <defs>
            <linearGradient id="lfN" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff5b6a" />
              <stop offset="100%" stopColor={data.accent} />
            </linearGradient>
          </defs>
          <rect className="lf-n-bar lf-n-left" x="14" y="10" width="26" height="180" fill="url(#lfN)" />
          <rect className="lf-n-bar lf-n-right" x="80" y="10" width="26" height="180" fill="url(#lfN)" />
          <polygon className="lf-n-diag" points="14,10 40,10 106,190 80,190" fill="url(#lfN)" />
        </svg>
        <div className="lf-n-heart">♥</div>
      </div>
      <div className="lf-intro-word">LoveFlix</div>
    </section>
  );
}
