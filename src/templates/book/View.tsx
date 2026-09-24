'use client';
import { useMemo } from 'react';
import './book.css';
import Scrapbook from './Scrapbook';
import { scrapbookData, type ScrapbookData } from './scrapbookData';
import type { Content } from '../types';
import { spotifyId } from '../sanitize';

const str = (v: unknown, d = '') => (typeof v === 'string' ? v : d);

export function toScrapbook(c: Content): ScrapbookData {
  const texts = { ...scrapbookData.texts } as Record<string, string>;
  for (const k of Object.keys(texts)) if (typeof c[`texts.${k}`] === 'string') texts[k] = c[`texts.${k}`] as string;
  return {
    partnerName: str(c.partnerName),
    heartColor: str(c.heartColor, scrapbookData.heartColor),
    photos: Array.isArray(c.photos) ? (c.photos as string[]).filter(Boolean) : [],
    spotifyTrackId: spotifyId(str(c.spotify)),
    songName: str(c.songName, scrapbookData.songName),
    songNote: str(c.songNote),
    keepsakeDate: str(c.keepsakeDate, scrapbookData.keepsakeDate),
    texts: texts as ScrapbookData['texts'],
  };
}

export default function BookView({ content }: { content: Content }) {
  const data = useMemo(() => toScrapbook(content), [content]);
  // react-pageflip can't re-render its children in place → remount when content changes
  const key = useMemo(() => JSON.stringify(data).length + ':' + hash(JSON.stringify(data)), [data]);
  return (
    <div className="dl-book-root">
      <Scrapbook key={key} data={data} />
    </div>
  );
}

function hash(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }
