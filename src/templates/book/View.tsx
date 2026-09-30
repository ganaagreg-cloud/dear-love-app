'use client';
import { useMemo, useRef } from 'react';
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

export default function BookView({ content, pin, editable }: { content: Content; pin?: string | number | null; editable?: boolean }) {
  const data = useMemo(() => toScrapbook(content), [content]);
  // react-pageflip can't re-render its children in place → remount when content changes
  const key = useMemo(() => JSON.stringify(data).length + ':' + hash(JSON.stringify(data)), [data]);
  // Scrapbook remounts on every content edit (see above) — this ref lives here, in the
  // parent that doesn't remount, so "which page was open" and "was the intro dismissed"
  // survive the remount instead of resetting to the cover on every keystroke/upload.
  const pos = useRef({ page: 0, introDismissed: false });
  return (
    <div className="dl-book-root">
      <Scrapbook key={key} data={data} pin={pin} editable={editable} pos={pos} />
    </div>
  );
}

function hash(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }
