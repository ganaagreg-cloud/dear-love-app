'use client';
import { useEffect, useMemo, useState } from 'react';
import type { Content } from '../types';

let htmlPromise: Promise<string> | null = null;
const loadHtml = () => (htmlPromise ??= fetch('/tpl/locket/template.html').then((r) => r.text()));

const str = (v: unknown) => (typeof v === 'string' ? v : '');
const arr = (v: unknown) => (Array.isArray(v) ? (v as string[]) : []);

/** Maps the flat editor content onto the CONFIG object the locket page expects. */
export function toLocketConfig(c: Content) {
  const photos = arr(c.memoryPhotos), caps = arr(c.memoryCaptions);
  const paras = str(c.letterBody).split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const T = (k: string) => str(c[`text.${k}`]);
  return {
    to: str(c.to) || 'My love',
    from: str(c.from),
    startDate: str(c.startDate) || new Date().toISOString().slice(0, 10),
    milestone: Number(c.milestone) || 1000,
    music: str(c.music),
    locketPhotos: [arr(c.locketPhotos)[0] || '', arr(c.locketPhotos)[1] || ''],
    memories: Array.from({ length: 5 }, (_, i) => ({ src: photos[i] || '', caption: caps[i] || '' })),
    chapters: arr(c.chapters),
    text: {
      prologue: T('prologue'), ch1: T('ch1'), ch2: T('ch2'), ch3: T('ch3'), ch4: T('ch4'),
      locketCap: T('locketCap'), finale: T('finale'), question: T('question'), answer: T('answer'),
    },
    letterTitle: str(c.letterTitle),
    letter: [str(c.letterGreeting), ...paras, ...(str(c.letterSignoff) ? ['@' + str(c.letterSignoff)] : []), '@{from}'].filter(Boolean),
  };
}

/** JSON that is safe to drop inside a <script> tag. */
const scriptJson = (o: unknown) => JSON.stringify(o).replace(/</g, '\\u003c').replace(/\u2028|\u2029/g, '');

export default function LocketView({ content }: { content: Content }) {
  const [html, setHtml] = useState<string | null>(null);
  useEffect(() => { loadHtml().then(setHtml); }, []);
  const doc = useMemo(
    () => (html ? html.replace('/*__CONFIG__*/null', scriptJson(toLocketConfig(content))) : null),
    [html, content],
  );
  if (!doc) return <div style={{ position: 'fixed', inset: 0, background: '#07060d' }} />;
  return (
    <iframe
      title="Locket story"
      srcDoc={doc}
      allow="autoplay; fullscreen"
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', border: 0, background: '#07060d' }}
    />
  );
}
