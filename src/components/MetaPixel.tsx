'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { pageView, track } from '@/lib/pixel';

/** PageView on every shop page (client navigations included). No-op unless NEXT_PUBLIC_META_PIXEL_ID is set. */
export default function MetaPixel() {
  const path = usePathname();
  useEffect(() => { pageView(); }, [path]);
  return null;
}

/** Fires one standard event when mounted (e.g. ViewContent on a template's page). */
export function PixelEvent({ event, params }: { event: 'ViewContent'; params: Record<string, unknown> }) {
  const key = JSON.stringify(params);
  useEffect(() => { track(event, JSON.parse(key)); }, [event, key]);
  return null;
}
