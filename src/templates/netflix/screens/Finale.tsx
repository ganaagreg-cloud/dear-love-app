'use client';
import { useRef, useState } from 'react';
import type { LoveData } from '../data';

const MAX_JUMPS = 6;

/**
 * 6 · The big question. «Тийм» and «За... асуу» both mean yes. The small, quiet «Үгүй» jumps to a random spot
 * on the screen when you reach for it (at most 6 times, always on-screen), then turns into «...за за, тийм 🙂» — also a yes.
 */
export default function Finale({ data, backdrop, frozen, onYes }: { data: LoveData; backdrop: string; frozen: boolean; onYes: () => void }) {
  const box = useRef<HTMLElement>(null);
  const [jumps, setJumps] = useState(0);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const last = useRef(0);
  const caught = jumps >= MAX_JUMPS;

  const jump = (e: React.SyntheticEvent) => {
    if (frozen || caught) return;
    const now = Date.now(); if (now - last.current < 250) return; // pointerenter + pointerdown fire together on touch
    last.current = now;
    e.preventDefault();
    const b = box.current?.getBoundingClientRect(), t = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (!b) return;
    const pad = 12, top = 90; // keep clear of the progress/mute row
    const x = pad + Math.random() * Math.max(1, b.width - t.width - pad * 2);
    const y = top + Math.random() * Math.max(1, b.height - t.height - top - pad);
    setPos({ x, y }); setJumps((j) => j + 1);
  };

  return (
    <section className="lf-screen lf-finale" ref={box}>
      {backdrop && <img className="lf-pimg lf-dim kb kb1" src={backdrop} alt="" />}
      <div className="lf-pshade" />
      <div className="lf-finale-body">
        <h1 className="lf-finale-q" data-field="final.question">{data.final.question}</h1>
        <div className="lf-finale-actions">
          <button type="button" className="lf-btn lf-btn-play" onClick={onYes} data-field="final.yes">{data.final.yes}</button>
          <button type="button" className="lf-btn lf-btn-ghost" onClick={onYes} data-field="final.yes2">{data.final.yes2}</button>
        </div>
      </div>
      {data.final.no && (
        <button
          type="button" className={`lf-no ${caught ? 'caught' : ''}`} data-field={caught ? 'final.no2' : 'final.no'}
          style={pos && !caught ? { position: 'absolute', left: pos.x, top: pos.y } : undefined}
          onPointerEnter={jump} onPointerDown={jump} onTouchStart={jump} onClick={() => { if (caught || frozen) onYes(); }}
        >
          {caught ? data.final.no2 : data.final.no}
        </button>
      )}
    </section>
  );
}
