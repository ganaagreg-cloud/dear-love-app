'use client';
import { useMemo } from 'react';
import '@fontsource/unbounded/600.css';
import '@fontsource/unbounded/700.css';
import '@fontsource/unbounded/800.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';
import './wrapped.css';
import Wrapped, { type WrappedData } from './Wrapped';
import type { Content } from '../types';

const s = (v: unknown, d = '') => (typeof v === 'string' && v.trim() ? v : d);
const a = (v: unknown) => (Array.isArray(v) ? (v as string[]) : []);

export function toWrapped(c: Content): WrappedData {
  const titles = a(c.songTitles), artists = a(c.songArtists), places = a(c.places), counts = a(c.placeCounts);
  const theme = s(c.theme, 'neon') as WrappedData['theme'];
  return {
    theme: ['neon', 'sunset', 'berry', 'midnight'].includes(theme) ? theme : 'neon',
    year: s(c.year, String(new Date().getFullYear())), you: s(c.you, 'Би'), them: s(c.them, 'Чи'), startDate: s(c.startDate),
    topPhoto: s(c.topPhoto), topCaption: s(c.topCaption),
    songs: Array.from({ length: 5 }, (_, i) => ({ title: titles[i] || '', artist: artists[i] || '' })),
    places: Array.from({ length: 5 }, (_, i) => ({ name: places[i] || '', count: counts[i] || '' })),
    words: a(c.words),
    persona: { emoji: s(c.personaEmoji, '🐶'), title: s(c.personaTitle, 'Алтан ретривер'), text: s(c.personaText) },
    photos: a(c.photos), message: s(c.message), music: s(c.music),
  };
}

export default function WrappedView({ content }: { content: Content }) {
  const data = useMemo(() => toWrapped(content), [content]);
  return <Wrapped key={JSON.stringify(data).length} data={data} />;
}
