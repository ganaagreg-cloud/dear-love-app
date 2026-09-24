'use client';
import type { CSSProperties } from 'react';

export default function Collage({ photos }: { photos: string[] }) {
  return (
    <div className="collage" aria-hidden>
      {photos.map((src, i) => (
        <span key={i} className="collage-item" style={{ '--i': i } as CSSProperties}>
          <img src={src} alt="" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
        </span>
      ))}
    </div>
  );
}
