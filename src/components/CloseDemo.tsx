'use client';
import { useRouter } from 'next/navigation';

/** «✕ Хаах» on the full demo page: back to where the viewer came from (the template page), leaving fullscreen first. */
export default function CloseDemo({ fallback }: { fallback: string }) {
  const router = useRouter();
  const close = () => {
    try { if (document.fullscreenElement) void document.exitFullscreen(); } catch { /* already out */ }
    const fromHere = document.referrer.startsWith(window.location.origin);
    if (fromHere && window.history.length > 1) router.back(); else router.push(fallback);
  };
  return <button type="button" className="back" onClick={close} aria-label="Хаах — буцах">✕ <span>Хаах</span></button>;
}
