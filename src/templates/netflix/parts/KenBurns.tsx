'use client';
import { useEffect, useState } from 'react';

/**
 * A slow-zoom photo trailer: photos crossfade every `every` ms and each one drifts (Ken Burns).
 * Photos can be marked editable with `field` (data-field, e.g. «trailerPhotos.2»).
 */
export default function KenBurns({ photos, every = 3000, field }: { photos: { src: string; i: number }[]; every?: number; field?: string }) {
  const [idx, setIdx] = useState(0);
  const [prev, setPrev] = useState(-1);
  useEffect(() => {
    if (photos.length < 2) return;
    const t = window.setInterval(() => setIdx((i) => { setPrev(i); return (i + 1) % photos.length; }), every);
    return () => window.clearInterval(t);
  }, [photos.length, every]);
  if (!photos.length) return <div className="lf-kb lf-kb-empty" />;
  const cur = idx % photos.length;
  return (
    <div className="lf-kb" aria-hidden>
      {photos.map((p, k) => (
        <img
          key={p.src + k} src={p.src} alt="" data-field={field ? `${field}.${p.i}` : undefined}
          className={`lf-kb-img ${k === cur ? 'on' : ''} ${k === cur || k === prev ? `kb kb${k % 4}` : ''}`}
          style={{ animationDuration: `${every * 2}ms` }}
        />
      ))}
    </div>
  );
}
