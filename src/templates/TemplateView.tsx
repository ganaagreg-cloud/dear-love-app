'use client';
import dynamic from 'next/dynamic';
import type { Content } from './types';
import SongDock from './SongDock';
import './songdock.css';
import { spotifyId } from './sanitize';

const VIEWS = {
  locket: dynamic(() => import('./locket/View'), { ssr: false }),
  book: dynamic(() => import('./book/View'), { ssr: false }),
  netflix: dynamic(() => import('./netflix/View'), { ssr: false }),
  quest: dynamic(() => import('./quest/View'), { ssr: false }),
  wrapped: dynamic(() => import('./wrapped/View'), { ssr: false }),
  flight: dynamic(() => import('./flight/View'), { ssr: false }),
} as const;

export default function TemplateView({ templateId, content, pin, editable }: {
  templateId: string; content: Content; pin?: string | number | null; editable?: boolean;
}) {
  const View = VIEWS[templateId as keyof typeof VIEWS];
  if (!View) return null;
  // Book has its own Spotify card; every other template gets the shared ♫ button when the buyer added a song
  const song = templateId === 'book' ? '' : spotifyId(typeof content.song === 'string' ? content.song : '');
  return (
    <div style={{ display: 'contents', overflowWrap: 'anywhere' }}>
      <View content={content} pin={pin ?? null} editable={editable} />
      {song && <SongDock id={song} />}
    </div>
  );
}
