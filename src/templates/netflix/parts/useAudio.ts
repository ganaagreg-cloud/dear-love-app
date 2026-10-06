'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

/** The «та-дам» sting. Put a royalty-free recording at public/assets/sfx/tadum.mp3 — until then the intro is silent. */
export const TADUM_SRC = '/assets/sfx/tadum.mp3';

/**
 * Sound for the whole gift. Browsers only let a page make sound after a tap, so `unlock()` is called from the
 * profile tap: it starts the background track silently, and `startMusic()` fades it in once the intro is over.
 * One mute switch (always on screen) silences both.
 */
export function useAudio(music: string) {
  const bgm = useRef<HTMLAudioElement | null>(null);
  const sfx = useRef<HTMLAudioElement | null>(null);
  const fade = useRef<number | undefined>(undefined);
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false); mutedRef.current = muted;

  const unlock = useCallback(() => {
    sfx.current ??= new Audio(TADUM_SRC);
    sfx.current.muted = mutedRef.current;
    if (music && !bgm.current) {
      const a = new Audio(music); a.loop = true; a.volume = 0; a.muted = mutedRef.current;
      bgm.current = a; a.play().catch(() => {});
    }
  }, [music]);

  const tadum = useCallback(() => {
    const a = sfx.current; if (!a) return;
    a.currentTime = 0; a.play().catch(() => { /* file not added yet, or blocked — stay silent */ });
  }, []);

  const startMusic = useCallback(() => {
    const a = bgm.current; if (!a) return;
    window.clearInterval(fade.current);
    a.play().catch(() => {});
    fade.current = window.setInterval(() => {
      a.volume = Math.min(0.5, a.volume + 0.025);
      if (a.volume >= 0.5) window.clearInterval(fade.current);
    }, 100);
  }, []);

  useEffect(() => {
    if (bgm.current) bgm.current.muted = muted;
    if (sfx.current) sfx.current.muted = muted;
  }, [muted]);
  useEffect(() => () => { window.clearInterval(fade.current); bgm.current?.pause(); sfx.current?.pause(); }, []);

  return { muted, toggleMute: () => setMuted((m) => !m), unlock, tadum, startMusic };
}
export type Audio_ = ReturnType<typeof useAudio>;
