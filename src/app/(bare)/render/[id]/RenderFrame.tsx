'use client';
import { useEffect, useState } from 'react';
import TemplateView from '@/templates/TemplateView';
import { useFieldHighlight } from '@/templates/fieldHighlight';
import type { Content } from '@/templates/types';

/** Mini-map thumbnails must never make a sound — the big preview next to them already does. */
let muted = false;
function muteForever() {
  if (muted) return; muted = true;
  HTMLMediaElement.prototype.play = function () { this.muted = true; return Promise.resolve(); };
  const AC = window.AudioContext;
  if (AC) window.AudioContext = class extends AC {
    constructor(o?: AudioContextOptions) { super(o); void super.suspend(); }
    resume() { return Promise.resolve(); }
  };
}

export default function RenderFrame({ templateId, initial }: { templateId: string; initial: Content }) {
  const [content, setContent] = useState<Content | null>(null);
  const [pin, setPin] = useState<string | number | null>(null);
  // «recipient» = render exactly what the receiver gets (no «+ add photo» tiles, no edit affordances)
  const [recipient, setRecipient] = useState(false);
  // the editor turns on click-to-edit (hover outline, pencil, click → open field)
  const [edit, setEdit] = useState(false);
  useFieldHighlight(edit && !recipient);
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === 'dear:content' && e.data.content && typeof e.data.content === 'object') {
        setContent(e.data.content);
        setPin(e.data.pin ?? null);
        setRecipient(e.data.recipient === true);
        setEdit(e.data.edit === true);
        if (e.data.thumb === true) muteForever();
      }
    };
    window.addEventListener('message', onMsg);
    window.parent?.postMessage({ type: 'dear:ready' }, window.location.origin);
    return () => window.removeEventListener('message', onMsg);
  }, []);
  return <TemplateView templateId={templateId} content={content ?? initial} pin={pin} editable={!recipient} />;
}
