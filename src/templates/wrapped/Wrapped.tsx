'use client';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';

export type WrappedData = {
  theme: 'neon' | 'sunset' | 'berry' | 'midnight';
  year: string; you: string; them: string; startDate: string;
  topPhoto: string; topCaption: string;
  songs: { title: string; artist: string }[];
  places: { name: string; count: string }[];
  words: string[];
  persona: { emoji: string; title: string; text: string };
  photos: string[];
  message: string;
  music: string;
};

const THEMES: Record<WrappedData['theme'], string[]> = {
  neon: ['#c6ff3d', '#ff4fb8', '#3d3dff', '#ff7a1a', '#16e0bd'],
  sunset: ['#ff6b4a', '#ffb03a', '#ff3e7f', '#7b2cff', '#ffd6a0'],
  berry: ['#ff3e7f', '#7a2cff', '#18c7b5', '#ffd23f', '#ff9ec7'],
  midnight: ['#1b1740', '#3a1f6b', '#0d3b4d', '#4a0f3d', '#221a4f'],
};
const lum = (hex: string) => {
  const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const DUR = 7000;

function useCount(to: number, run: boolean, ms = 1600) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!run) { setV(0); return; }
    let raf = 0; const t0 = performance.now();
    const tick = (t: number) => { const p = Math.min(1, (t - t0) / ms); setV(Math.round(to * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, run, ms]);
  return v;
}

function Photo({ src, alt, className, style }: { src: string; alt?: string; className?: string; style?: CSSProperties }) {
  const [bad, setBad] = useState(false);
  return (
    <div className={`wr-photo ${className ?? ''}`} style={style}>
      {src && !bad ? <img src={src} alt={alt || 'хайрын зураг'} onError={() => setBad(true)} /> : <span>♥</span>}
    </div>
  );
}

function Typed({ text, run }: { text: string; run: boolean }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!run) { setN(0); return; }
    if (n >= text.length) return;
    const t = setTimeout(() => setN((x) => x + 1), /[.,!?\n]/.test(text[n - 1] ?? '') ? 160 : 28);
    return () => clearTimeout(t);
  }, [n, run, text]);
  return <>{text.slice(0, n)}<i className="wr-caret" /></>;
}

export default function Wrapped({ data, pin }: { data: WrappedData; pin?: string | number | null }) {
  const pal = THEMES[data.theme] ?? THEMES.neon;
  const days = useMemo(() => {
    const s = Date.parse(data.startDate + 'T00:00:00');
    return Number.isFinite(s) ? Math.max(1, Math.floor((Date.now() - s) / 864e5) + 1) : 0;
  }, [data.startDate]);

  const songs = data.songs.filter((s) => s.title.trim());
  const places = data.places.filter((p) => p.name.trim());
  const words = data.words.filter((w) => w.trim());

  /* slide list — sections with no content are skipped */
  type S = { id: string; node: (on: boolean) => ReactNode; long?: boolean };
  const slides: S[] = [];
  if (days) slides.push({ id: 'days', node: (on) => <DaysSlide days={days} on={on} /> });
  slides.push({ id: 'top', node: () => (
    <div className="wr-center">
      <p className="wr-kicker">{data.year} оны №1 мөч</p>
      <Photo src={data.topPhoto} alt={data.topCaption} className="wr-top-photo" />
      <h2 className="wr-h2">{data.topCaption}</h2>
    </div>
  ) });
  if (songs.length) slides.push({ id: 'songs', node: () => (
    <div className="wr-list-wrap">
      <p className="wr-kicker">Бидний топ дуунууд</p>
      <h2 className="wr-h1 sm">Бидний саундтрек</h2>
      <ol className="wr-list">
        {songs.map((s, i) => (
          <li key={i} style={{ '--d': `${0.25 + i * 0.18}s` } as CSSProperties}>
            <b>{i + 1}</b><span><strong>{s.title}</strong><small>{s.artist}</small></span>
            <em className="wr-eq"><i /><i /><i /><i /></em>
          </li>
        ))}
      </ol>
    </div>
  ) });
  if (places.length) slides.push({ id: 'places', node: () => (
    <div className="wr-list-wrap">
      <p className="wr-kicker">Топ газрууд</p>
      <h2 className="wr-h1 sm">Бид болсон газрууд</h2>
      <ol className="wr-list places">
        {places.map((p, i) => (
          <li key={i} style={{ '--d': `${0.25 + i * 0.18}s` } as CSSProperties}>
            <b>{i + 1}</b><span><strong>{p.name}</strong>{p.count && <small>{p.count}</small>}</span><em className="wr-pin">📍</em>
          </li>
        ))}
      </ol>
    </div>
  ) });
  if (words.length) slides.push({ id: 'words', node: () => (
    <div className="wr-center">
      <p className="wr-kicker">Бидний хамгийн их хэлдэг үгс</p>
      <div className="wr-words">
        {words.map((w, i) => (
          <span key={i} style={{ '--d': `${0.3 + i * 0.22}s`, '--s': `${[3.4, 2.4, 2, 2.8, 1.7, 2.2, 1.6, 2.5][i % 8]}`, '--r': `${[-6, 5, -3, 8, -8, 3, 6, -4][i % 8]}deg`, background: pal[(i + 1) % pal.length] } as CSSProperties}>{w}</span>
        ))}
      </div>
    </div>
  ) });
  slides.push({ id: 'persona', node: () => (
    <div className="wr-center">
      <p className="wr-kicker">Чиний хайрын төрөл бол…</p>
      <div className="wr-badge"><svg viewBox="0 0 200 200"><path d="M100 0l22 36 41-12-6 42 40 18-30 30 18 38-42 4-8 42-35-24-35 24-8-42-42-4 18-38-30-30 40-18-6-42 41 12z" /></svg><span>{data.persona.emoji}</span></div>
      <h2 className="wr-h1">{data.persona.title}</h2>
      <p className="wr-body">{data.persona.text}</p>
    </div>
  ) });
  if (data.photos.some(Boolean)) slides.push({ id: 'photos', node: () => (
    <div className="wr-center">
      <p className="wr-kicker">{data.year} оны зургууд</p>
      <div className="wr-grid">
        {data.photos.filter(Boolean).slice(0, 6).map((p, i) => (
          <Photo key={i} src={p} style={{ '--d': `${0.2 + i * 0.15}s`, '--r': `${[-4, 3, -2, 5, -5, 2][i]}deg` } as CSSProperties} />
        ))}
      </div>
    </div>
  ) });
  slides.push({ id: 'msg', long: true, node: (on) => (
    <div className="wr-msg">
      <p className="wr-kicker">Бас нэг зүйл</p>
      <p className="wr-letter"><Typed text={data.message} run={on} /></p>
      <p className="wr-sign">— {data.you}</p>
    </div>
  ) });
  slides.push({ id: 'summary', long: true, node: () => (
    <div className="wr-summary">
      <div className="wr-card">
        <div className="wr-card-top">
          <Photo src={data.topPhoto} alt={data.topCaption} className="wr-card-photo" />
          <div><small>{data.year} · Wrapped</small><strong>{data.them} &amp; {data.you}</strong></div>
        </div>
        <div className="wr-card-grid">
          {songs.length > 0 && <div><small>Топ дуу</small>{songs.slice(0, 3).map((s, i) => <p key={i}>{i + 1} {s.title}</p>)}</div>}
          {places.length > 0 && <div><small>Топ газар</small>{places.slice(0, 3).map((p, i) => <p key={i}>{i + 1} {p.name}</p>)}</div>}
          {days > 0 && <div><small>Хамтдаа</small><p className="big">{days.toLocaleString('en-US')} өдөр</p></div>}
          <div><small>Хайрын төрөл</small><p className="big sm">{data.persona.emoji} {data.persona.title}</p></div>
        </div>
        <div className="wr-card-foot">♥ Хайраар бүтээв · {data.year}</div>
      </div>
    </div>
  ) });

  const pinnedIndex = pin === '__intro__' ? -1 : pin ? slides.findIndex((sl) => sl.id === pin) : -1;
  const [i, setI] = useState(pin === '__intro__' || pinnedIndex >= 0 ? pinnedIndex : -1);
  const [paused, setPaused] = useState(false);
  const [prog, setProg] = useState(0);
  const audio = useRef<HTMLAudioElement | null>(null);
  const last = slides.length - 1;

  const go = useCallback((n: number) => { setI(Math.max(0, Math.min(last, n))); setProg(0); }, [last]);
  const start = () => {
    if (data.music) {
      audio.current ??= Object.assign(new Audio(data.music), { loop: true, volume: 0.7 });
      audio.current.play().catch(() => {});
    }
    go(0);
  };
  useEffect(() => () => audio.current?.pause(), []);

  // Switching sections in the editor changes `pin` without editing any field, so `content`
  // (and therefore WrappedView's remount key) doesn't change — the initializer above only
  // covers the first mount. Re-apply `pin` reactively so pure section-switching works too.
  useEffect(() => {
    if (!pin) return;
    if (pin === '__intro__') { setI(-1); return; }
    const idx = slides.findIndex((sl) => sl.id === pin);
    // Target slide missing (e.g. the buyer cleared its content) — fall back to the
    // cover, same as the initializer above, rather than silently keeping stale content
    // from whichever slide was showing before. `go()` clamps to index 0, so the
    // fallback needs a direct `setI(-1)`, not `go(-1)`.
    if (idx >= 0) go(idx); else setI(-1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  // auto-advance
  useEffect(() => {
    if (i < 0 || paused || i === last || pin) return;
    let raf = 0, t0 = performance.now() - prog * DUR;
    const dur = slides[i]?.long ? DUR * 2.2 : DUR;
    t0 = performance.now() - prog * dur;
    const tick = (t: number) => {
      const p = (t - t0) / dur;
      if (p >= 1) { go(i + 1); return; }
      setProg(p); raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, paused]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (i < 0 && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); start(); return; }
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); go(i + 1); }
      if (e.key === 'ArrowLeft') go(i - 1);
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });

  const downAt = useRef(0);
  const onDown = () => { downAt.current = Date.now(); setPaused(true); };
  const onUp = (e: React.PointerEvent) => {
    setPaused(false);
    if (Date.now() - downAt.current > 300) return; // it was a hold
    if ((e.target as HTMLElement).closest('button')) return;
    const x = e.clientX / window.innerWidth;
    go(x < 0.3 ? i - 1 : i + 1);
  };

  const bg = i < 0 ? pal[0] : pal[i % pal.length];
  const dark = lum(bg) < 0.35;
  const accent = pal[(Math.max(i, 0) + 2) % pal.length];

  return (
    <div className="wr-root" style={{ '--bg': bg, '--fg': dark ? '#fff' : '#0b0b10', '--accent': accent, '--accent-fg': lum(accent) < 0.35 ? '#fff' : '#0b0b10' } as CSSProperties}>
      <div className="wr-stage">
        <div className="wr-shapes" key={'s' + i} aria-hidden>
          <i className="c1" style={{ background: pal[(Math.max(i, 0) + 1) % pal.length] }} />
          <i className="c2" style={{ background: pal[(Math.max(i, 0) + 3) % pal.length] }} />
          <svg className="squiggle" viewBox="0 0 300 60"><path d="M0 30 Q 25 0 50 30 T 100 30 T 150 30 T 200 30 T 250 30 T 300 30" /></svg>
          <b className="star">✦</b>
        </div>

        {i < 0 ? (
          <div className="wr-intro">
            <p className="wr-kicker">{data.them}, энэ чамд</p>
            <h1 className="wr-mega">Бидний<br />{data.year}<br />он</h1>
            <p className="wr-body">{data.you} бидний өдөр, дуу, газар бүрийг эргэн санаад чамд зориулж үүнийг хийлээ.</p>
            <button className="wr-cta" onClick={start}>Эхэлье ▶</button>
            <small className="wr-hint">Баруун талд дарж урагшилна · удаан дарж зогсооно</small>
          </div>
        ) : (
          <>
            <div className="wr-bars">
              {slides.map((_, k) => <span key={k}><i style={{ transform: `scaleX(${k < i ? 1 : k === i ? (i === last ? 1 : prog) : 0})` }} /></span>)}
            </div>
            <div className="wr-top-bar"><span className="wr-avatar">♥</span><b>{data.them} &amp; {data.you}</b><small>{data.year} · Wrapped</small></div>
            <div className="wr-slide" key={slides[i].id} onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={() => setPaused(false)}>
              {slides[i].node(true)}
            </div>
            {i === last && <button className="wr-cta wr-replay" onClick={() => go(0)}>↺ Дахин үзэх</button>}
          </>
        )}
      </div>
    </div>
  );
}

function DaysSlide({ days, on }: { days: number; on: boolean }) {
  const n = useCount(days, on);
  const hours = useCount(days * 24, on, 2200);
  return (
    <div className="wr-center">
      <p className="wr-kicker">Бид одоогоор хамтдаа</p>
      <div className="wr-num">{n.toLocaleString('en-US')}</div>
      <h2 className="wr-h1">өдрийг өнгөрөөлөө</h2>
      <p className="wr-body">Энэ бол бие биеэ сонгосон <b>{hours.toLocaleString('en-US')}</b> цаг.<br />Магадгүй хосуудын топ 0.001%.</p>
    </div>
  );
}
