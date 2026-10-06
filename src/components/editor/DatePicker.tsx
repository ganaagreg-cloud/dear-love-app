'use client';
import { useEffect, useRef, useState } from 'react';
import './datepicker.css';

/* dates: shown and typed as YYYY.MM.DD (how dates are written in Mongolian), stored as ISO */
const isoOk = (iso: string) => {
  const d = new Date(`${iso}T00:00:00Z`);
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) && !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === iso;
};
const dotted = (iso: string) => (iso ? iso.replace(/-/g, '.') : '');
const pad = (n: number) => String(n).padStart(2, '0');
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

const MONTHS = ['1-р сар', '2-р сар', '3-р сар', '4-р сар', '5-р сар', '6-р сар', '7-р сар', '8-р сар', '9-р сар', '10-р сар', '11-р сар', '12-р сар'];
const WEEK = ['Да', 'Мя', 'Лх', 'Пү', 'Ба', 'Бя', 'Ня'];

/** A small Mongolian calendar: days → (tap the title) years → months. `max` greys out everything after it. */
function Calendar({ value, max, onPick, onClose }: { value: string; max?: string; onPick: (v: string) => void; onClose: () => void }) {
  const now = new Date();
  const start = isoOk(value) ? value : max && max < iso(now.getFullYear(), now.getMonth(), now.getDate()) ? max : iso(now.getFullYear(), now.getMonth(), now.getDate());
  const [y, setY] = useState(Number(start.slice(0, 4)));
  const [m, setM] = useState(Number(start.slice(5, 7)) - 1);
  const [view, setView] = useState<'days' | 'months' | 'years'>('days');
  const [block, setBlock] = useState(Math.floor(Number(start.slice(0, 4)) / 12) * 12);
  const maxY = max ? Number(max.slice(0, 4)) : 9999, maxM = max ? Number(max.slice(5, 7)) - 1 : 11;
  const today = iso(now.getFullYear(), now.getMonth(), now.getDate());

  const first = (new Date(y, m, 1).getDay() + 6) % 7; // Monday-first
  const count = new Date(y, m + 1, 0).getDate();
  const cells = [...Array.from({ length: first }, () => 0), ...Array.from({ length: count }, (_, i) => i + 1)];
  const canNext = y < maxY || (y === maxY && m < maxM);
  const step = (dm: number) => { const t = m + dm; setY(y + Math.floor(t / 12)); setM(((t % 12) + 12) % 12); };

  return (
    <div className="dp" role="dialog" aria-label="Огноо сонгох" onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } }}>
      <div className="dp-head">
        {view === 'days' && <button type="button" className="dp-nav" onClick={() => step(-1)} aria-label="Өмнөх сар">‹</button>}
        {view === 'years' && <button type="button" className="dp-nav" onClick={() => setBlock(block - 12)} aria-label="Өмнөх жилүүд">‹</button>}
        {view === 'months' && <button type="button" className="dp-nav" onClick={() => setY(y - 1)} aria-label="Өмнөх жил">‹</button>}
        <button type="button" className="dp-title" onClick={() => { setBlock(Math.floor(y / 12) * 12); setView(view === 'days' ? 'years' : 'days'); }} aria-live="polite">
          {view === 'days' ? `${y} оны ${MONTHS[m]}` : view === 'months' ? `${y} он` : `${block} – ${block + 11}`}
          <i aria-hidden>▾</i>
        </button>
        {view === 'days' && <button type="button" className="dp-nav" onClick={() => step(1)} disabled={!canNext} aria-label="Дараах сар">›</button>}
        {view === 'years' && <button type="button" className="dp-nav" onClick={() => setBlock(block + 12)} disabled={block + 12 > maxY} aria-label="Дараах жилүүд">›</button>}
        {view === 'months' && <button type="button" className="dp-nav" onClick={() => setY(y + 1)} disabled={y >= maxY} aria-label="Дараах жил">›</button>}
      </div>

      {view === 'days' && (
        <>
          <div className="dp-week" aria-hidden>{WEEK.map((w) => <span key={w}>{w}</span>)}</div>
          <div className="dp-grid">
            {cells.map((d, i) => {
              if (!d) return <span key={i} />;
              const v = iso(y, m, d), off = !!max && v > max;
              return (
                <button
                  type="button" key={i} disabled={off} aria-pressed={v === value} aria-label={`${y} оны ${MONTHS[m]} ${d}`}
                  className={`${v === value ? 'on' : ''} ${v === today ? 'today' : ''}`} onClick={() => { onPick(v); onClose(); }}
                >{d}</button>
              );
            })}
          </div>
        </>
      )}
      {view === 'years' && (
        <div className="dp-pick">
          {Array.from({ length: 12 }, (_, k) => block + k).map((yy) => (
            <button type="button" key={yy} disabled={yy > maxY} className={yy === y ? 'on' : ''} onClick={() => { setY(yy); setView('months'); }}>{yy}</button>
          ))}
        </div>
      )}
      {view === 'months' && (
        <div className="dp-pick">
          {MONTHS.map((name, k) => (
            <button type="button" key={name} disabled={y === maxY && k > maxM} className={k === m ? 'on' : ''} onClick={() => { setM(k); setView('days'); }}>{name}</button>
          ))}
        </div>
      )}
      <div className="dp-foot">
        <button type="button" onClick={() => { onPick(''); onClose(); }}>Арилгах</button>
        {(!max || today <= max) && <button type="button" onClick={() => { onPick(today); onClose(); }}>Өнөөдөр</button>}
      </div>
    </div>
  );
}

/** Type the date (ЖЖЖЖ.СС.ӨӨ) or pick it in the calendar. `max` (ISO) = the latest day allowed — e.g. today for an anniversary. */
export function DateInput({ value, onChange, max, pickOnly = false }: { value: string; onChange: (v: string) => void; max?: string; pickOnly?: boolean }) {
  const [text, setText] = useState(dotted(value));
  const [bad, setBad] = useState<'format' | 'future' | false>(false);
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  // follow outside changes (calendar pick, clear) without fighting a half-typed date
  useEffect(() => { setText((t) => (t.replace(/\./g, '-') === value ? t : dotted(value))); setBad(false); }, [value]);
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
  }, [open]);

  const type = (raw: string) => {
    const d = raw.replace(/\D/g, '').slice(0, 8);
    setText([d.slice(0, 4), d.slice(4, 6), d.slice(6, 8)].filter(Boolean).join('.'));
    setBad(false);
    if (!d) onChange('');
    else if (d.length === 8) {
      const v = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}`;
      if (!isoOk(v)) setBad('format');
      else if (max && v > max) setBad('future');
      else onChange(v);
    }
  };
  return (
    <div className="ed-date-wrap" ref={wrap}>
      <div className="ed-date">
        <input
          className={`ed-input ${pickOnly ? 'ed-date-pick' : ''}`} inputMode={pickOnly ? 'none' : 'numeric'} placeholder={pickOnly ? 'Огноо сонгох' : 'ЖЖЖЖ.СС.ӨӨ'} value={text} aria-invalid={bad ? true : undefined}
          readOnly={pickOnly} onClick={pickOnly ? () => setOpen(true) : undefined}
          onChange={(e) => type(e.target.value)} onBlur={() => { if (!pickOnly && text && text.length < 10) setBad('format'); }}
        />
        <button type="button" className={`ed-date-btn ${open ? 'on' : ''}`} onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Хуанлиас сонгох" title="Хуанлиас сонгох">📅</button>
        {value && <button type="button" className="ed-date-btn" onClick={() => { setText(''); onChange(''); setBad(false); }} aria-label="Арилгах" title="Арилгах">✕</button>}
      </div>
      {open && <Calendar value={value} max={max} onPick={onChange} onClose={() => setOpen(false)} />}
      {bad === 'future' && <p className="ed-help err">Энэ өдөр хараахан ирээгүй байна — өнөөдрөөс өмнөх өдрийг сонгоно уу.</p>}
      {bad === 'format' && <p className="ed-help err">Огноог ЖЖЖЖ.СС.ӨӨ хэлбэрээр бичнэ үү. Жишээ нь: 2024.01.10</p>}
    </div>
  );
}
