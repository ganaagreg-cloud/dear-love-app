'use client';
import { useState } from 'react';

/**
 * «Бидний дуу»: the buyer's own song as Spotify's official embed, opened from a small ♫ button.
 * We host no audio — Spotify plays it (the viewer taps play, as browsers require).
 */
export default function SongDock({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="dl-song" data-field="song">
      <button type="button" className="dl-song-btn" aria-expanded={open} aria-label="Бидний дуу" onClick={() => setOpen((o) => !o)}>{open ? '✕' : '♫'}</button>
      {open && (
        <iframe
          title="Бидний дуу" src={`https://open.spotify.com/embed/track/${id}`} width="300" height="152" loading="lazy"
          allow="autoplay; encrypted-media; clipboard-write; fullscreen; picture-in-picture"
        />
      )}
    </div>
  );
}
