'use client';
import { useEffect, useState } from 'react';
import { PreviewFrame } from './editor/PreviewFrame';
import type { Content } from '@/templates/types';

/**
 * The template page's «what the recipient sees» clip: a live, silent render of the demo
 * gift in a phone, stepping through the template's `tour` scenes on a loop (~15s).
 * Live instead of an MP4, so it never goes stale when a template changes.
 */
export default function TourEmbed({ templateId, content, tour }: { templateId: string; content: Content; tour?: (string | number)[] }) {
  const [i, setI] = useState(0);
  const scenes = tour?.length ? tour : [null];
  useEffect(() => {
    if (scenes.length < 2) return;
    const t = setInterval(() => setI((n) => (n + 1) % scenes.length), 2500);
    return () => clearInterval(t);
  }, [scenes.length]);
  return (
    <div className="tour">
      <PreviewFrame
        templateId={templateId} content={content} pin={scenes[i] ?? null} device="mobile" recipient thumb inert
        pad={0} className="tour-frame" title="Хүлээн авагчийн харах байдал (жишээ)"
      />
      {scenes.length > 1 && (
        <div className="tour-dots" aria-hidden>{scenes.map((_, k) => <i key={k} className={k === i ? 'on' : ''} />)}</div>
      )}
    </div>
  );
}
