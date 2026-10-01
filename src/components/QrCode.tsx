'use client';
import { useEffect, useState } from 'react';

const HEART = 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';

/** Renders `url` as a QR with a heart in the middle (error-correction H keeps it scannable) and offers a PNG download. */
export default function QrCode({ url, filename = 'dear-love-qr' }: { url: string; filename?: string }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    let dead = false;
    (async () => {
      const QR = (await import('qrcode')).default;
      const S = 1024;
      const canvas = document.createElement('canvas');
      await QR.toCanvas(canvas, url, { errorCorrectionLevel: 'H', margin: 2, width: S, color: { dark: '#2a1f2d', light: '#ffffff' } });
      const g = canvas.getContext('2d');
      if (g) {
        const c = S / 2, r = S * 0.1;
        g.fillStyle = '#fff'; g.beginPath(); g.arc(c, c, r * 1.25, 0, Math.PI * 2); g.fill();
        g.save(); g.translate(c - r, c - r); g.scale((r * 2) / 24, (r * 2) / 24); g.fillStyle = '#e2557a'; g.fill(new Path2D(HEART)); g.restore();
      }
      if (!dead) setSrc(canvas.toDataURL('image/png'));
    })().catch(() => {});
    return () => { dead = true; };
  }, [url]);

  if (!src) return <div className="qr-box" aria-busy="true" />;
  return (
    <div className="qr-box">
      <img src={src} alt="Бэлгийн линкийн QR код" width={216} height={216} />
      <a className="btn btn-sm" href={src} download={`${filename}.png`}>QR зураг татах</a>
    </div>
  );
}
