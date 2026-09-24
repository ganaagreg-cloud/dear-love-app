'use client';
import { useEffect, useState } from 'react';
import TemplateView from '@/templates/TemplateView';
import type { Content } from '@/templates/types';

export default function RenderFrame({ templateId, initial }: { templateId: string; initial: Content }) {
  const [content, setContent] = useState<Content | null>(null);
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === 'dear:content' && e.data.content && typeof e.data.content === 'object') setContent(e.data.content);
    };
    window.addEventListener('message', onMsg);
    window.parent?.postMessage({ type: 'dear:ready' }, window.location.origin);
    return () => window.removeEventListener('message', onMsg);
  }, []);
  return <TemplateView templateId={templateId} content={content ?? initial} />;
}
