import 'server-only';
import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { SITE_URL } from './env';

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_TYPE = 'image/png';

// Manrope 800 — Cyrillic + Latin subsets share one family so Satori falls back per glyph.
const font = (f: string) => readFile(join(process.cwd(), 'src/assets/og', f));
const fonts = Promise.all([font('manrope-cyrillic-800-normal.woff'), font('manrope-latin-800-normal.woff')]);

export const coverUrl = (id: string) => `${SITE_URL}/covers/${id}.jpg`;

const INK = '#2a1f2d', ROSE = '#e2557a';
const HEART = 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';

/** Brand card for link previews: text on the left, one to three template covers fanned on the right. */
export async function ogCard({ title, sub, pill, covers }: { title: string; sub: string; pill: string; covers: string[] }) {
  const [cyr, lat] = await fonts;
  const tilt = covers.length === 1 ? [0] : covers.length === 2 ? [-7, 5] : [-9, 0, 8];
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: 'linear-gradient(135deg, #fbf6f8 0%, #fde6ee 100%)', fontFamily: 'Manrope', color: INK }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: 700, padding: '56px 0 56px 64px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 34 }}>
            <svg width="44" height="44" viewBox="0 0 24 24"><path d={HEART} fill={ROSE} /></svg>
            Dear Love
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', fontSize: 74, lineHeight: 1.08, letterSpacing: -2 }}>{title}</div>
            <div style={{ display: 'flex', fontSize: 31, lineHeight: 1.3, color: '#6b5a6e' }}>{sub}</div>
          </div>
          <div style={{ display: 'flex' }}>
            <div style={{ display: 'flex', background: ROSE, color: '#fff', fontSize: 30, padding: '16px 34px', borderRadius: 999 }}>{pill}</div>
          </div>
        </div>
        <div style={{ display: 'flex', position: 'relative', flex: 1 }}>
          {covers.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={src} src={src} width={300} height={420} alt=""
              style={{ position: 'absolute', left: covers.length === 1 ? 110 : 20 + i * 95, top: covers.length === 1 ? 105 : 90 + (i === 1 ? -10 : 0), width: 300, height: 420, objectFit: 'cover', borderRadius: 28, border: '6px solid #fff', boxShadow: '0 24px 50px rgba(42,31,45,.28)', transform: `rotate(${tilt[i]}deg)` }} />
          ))}
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: [{ name: 'Manrope', data: cyr, weight: 800, style: 'normal' }, { name: 'Manrope', data: lat, weight: 800, style: 'normal' }] },
  );
}

/** Card for a template's page: its cover, name and price. */
export async function templateOgCard(id: string) {
  const { getTemplate, formatMnt } = await import('@/templates/registry');
  const t = getTemplate(id);
  if (!t) return ogCard({ title: 'Хайртай хүндээ дижитал бэлэг', sub: 'Загвараа сонго, зураг дуугаа оруул, нэг линкээр илгээ', pill: 'dearlove.mn', covers: ['wrapped', 'locket', 'flight'].map(coverUrl) });
  // Manrope has no ₮ glyph, so spell it out; keep the subtitle to two lines
  const sub = t.tagline.length > 90 ? t.tagline.slice(0, 88).replace(/s+S*$/, '') + '…' : t.tagline;
  return ogCard({ title: t.name, sub, pill: `${formatMnt(t.price).replace('₮', '')} төгрөг · нэг удаа`, covers: [coverUrl(t.id)] });
}
