'use client';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import type { Content } from '@/templates/types';

export const DEVICES = { desktop: { w: 1366, h: 820 }, mobile: { w: 390, h: 844 } } as const;
export type Device = keyof typeof DEVICES;

type Props = {
  templateId: string;
  content: Content;
  pin: string | number | null;
  device: Device;
  /** Wait this long after a content change before re-rendering the preview. */
  debounceMs?: number;
  /** Render exactly what the recipient sees (no edit affordances). */
  recipient?: boolean;
  /** Inner padding kept around the scaled device. */
  pad?: number;
  className?: string;
  style?: CSSProperties;
  title?: string;
  /** Non-interactive thumbnail (mini-map). */
  inert?: boolean;
};

/**
 * A live template preview: an iframe of /render/<id>, fed over postMessage and scaled to
 * fit its container like a device on a desk. Several can be on screen at once — each only
 * answers its own iframe's «ready».
 */
export const PreviewFrame = forwardRef<HTMLIFrameElement | null, Props>(function PreviewFrame(
  { templateId, content, pin, device, debounceMs = 700, recipient = false, pad = 36, className, style, title = 'Шууд харагдац', inert },
  ref,
) {
  const frame = useRef<HTMLIFrameElement>(null);
  useImperativeHandle(ref, () => frame.current as HTMLIFrameElement, []);
  const latest = useRef(content); latest.current = content;

  const post = useCallback(
    () => frame.current?.contentWindow?.postMessage({ type: 'dear:content', content: latest.current, pin, recipient }, window.location.origin),
    [pin, recipient],
  );
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin === window.location.origin && e.data?.type === 'dear:ready' && e.source === frame.current?.contentWindow) post();
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [post]);
  // pin/recipient changes apply at once; typing is debounced
  useEffect(() => { post(); }, [post]);
  useEffect(() => { const t = setTimeout(post, debounceMs); return () => clearTimeout(t); }, [content, post, debounceMs]);

  /* scale the device to fit */
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);
  const d = DEVICES[device];
  useLayoutEffect(() => {
    const el = box.current; if (!el) return;
    const fit = () => setScale(Math.max(0.05, Math.min((el.clientWidth - pad) / d.w, (el.clientHeight - pad) / d.h, 1)));
    fit();
    const ro = new ResizeObserver(fit); ro.observe(el);
    return () => ro.disconnect();
  }, [d.w, d.h, pad]);

  return (
    <div ref={box} className={`pf ${className ?? ''}`} style={style}>
      <div className="ed-device" data-device={device} style={{ width: d.w * scale, height: d.h * scale }}>
        <iframe
          ref={frame} title={title} src={`/render/${templateId}`} onLoad={post} allow="autoplay; encrypted-media"
          tabIndex={inert ? -1 : undefined} aria-hidden={inert || undefined}
          style={{ width: d.w, height: d.h, transform: `scale(${scale})`, pointerEvents: inert ? 'none' : undefined }}
        />
      </div>
    </div>
  );
});
