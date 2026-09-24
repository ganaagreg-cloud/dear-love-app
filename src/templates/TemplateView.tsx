'use client';
import dynamic from 'next/dynamic';
import type { Content } from './types';

const VIEWS = {
  locket: dynamic(() => import('./locket/View'), { ssr: false }),
  book: dynamic(() => import('./book/View'), { ssr: false }),
  netflix: dynamic(() => import('./netflix/View'), { ssr: false }),
  quest: dynamic(() => import('./quest/View'), { ssr: false }),
  wrapped: dynamic(() => import('./wrapped/View'), { ssr: false }),
  flight: dynamic(() => import('./flight/View'), { ssr: false }),
} as const;

export default function TemplateView({ templateId, content }: { templateId: string; content: Content }) {
  const View = VIEWS[templateId as keyof typeof VIEWS];
  if (!View) return null;
  return <View content={content} />;
}
