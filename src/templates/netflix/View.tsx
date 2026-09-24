'use client';
import { useMemo } from 'react';
import '@fontsource/oswald/500.css';
import '@fontsource/oswald/600.css';
import '@fontsource/oswald/700.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';
import './loveflix.css';
import LoveFlix from './LoveFlix';
import { COPY, type Copy, type Occasion, type Pronoun } from './copy';
import type { LoveData } from './data';
import type { Content } from '../types';

const str = (v: unknown, d = '') => (typeof v === 'string' ? v : d);
const pad = (v: unknown, n: number) => Array.from({ length: n }, (_, i) => (Array.isArray(v) ? (v[i] as string) || '' : ''));

export function toLoveData(c: Content): LoveData {
  const occasion = (str(c.occasion) in COPY ? str(c.occasion) : 'anniversary') as Occasion;
  const base = COPY[occasion] as unknown as Record<string, string | readonly string[]>;
  const overrides: Record<string, string | string[]> = {};
  for (const [k, v] of Object.entries(c)) {
    if (!k.startsWith('ov.')) continue;
    const key = k.slice(3);
    if (typeof v === 'string' && v.trim()) overrides[key] = v.trim();
    if (Array.isArray(v) && v.some((x) => x?.trim())) {
      const def = (base[key] as readonly string[]) ?? [];
      overrides[key] = def.map((d, i) => v[i]?.trim() || d);
    }
  }
  return {
    occasion,
    pronoun: (['she', 'he', 'they'].includes(str(c.pronoun)) ? str(c.pronoun) : 'she') as Pronoun,
    partnerName: str(c.partnerName),
    yourName: str(c.yourName),
    accent: str(c.accent, '#E50914'),
    funnyNoButton: c.funnyNoButton === true,
    previewPlaceholders: true,
    songName: str(c.songName),
    profilePhoto: str(c.profilePhoto),
    heroPhoto: str(c.heroPhoto),
    cwPhotos: pad(c.cwPhotos, 4),
    hitPhotos: pad(c.hitPhotos, 4),
    ep1Bg: str(c.ep1Bg), ep2Bg: str(c.ep2Bg), climaxBg: str(c.climaxBg),
    overrides: overrides as Partial<Copy>,
  };
}

export default function NetflixView({ content }: { content: Content }) {
  const data = useMemo(() => toLoveData(content), [content]);
  return (
    <div style={{ minHeight: '100dvh', background: '#141414' }}>
      <LoveFlix data={data} />
    </div>
  );
}
