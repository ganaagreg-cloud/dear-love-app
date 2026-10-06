'use client';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from 'react';
import { gsap } from 'gsap';

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
const INK = '#1a1a1a';
const lum = (hex: string) => {
  const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
/** Text colour for a background: whichever of #1a1a1a / white has the higher contrast. */
const inkOn = (bg: string) => {
  const L = lum(bg), dark = (L + 0.05) / (lum(INK) + 0.05), light = 1.05 / (L + 0.05);
  return dark >= light ? INK : '#ffffff';
};
const DUR = 7000;
const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Slide entry animation: runs once when the slide mounts (editing text in place never replays it). */
function useEnter(build: (root: HTMLElement) => void) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || reduced()) return;
    const ctx = gsap.context(() => build(root), root);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return ref;
}

/**
 * Shrinks an element's font until its text fits: never wider than its box (words and numbers are never cut mid-way)
 * and, when `lines` is given, never taller than that many lines. Re-fits when the box or the fonts change.
 */
function Fit({ as: Tag = 'span', max, min = 14, lines, className, children, ...rest }: {
  as?: ElementType; max?: number; min?: number; lines?: number; className?: string; children: ReactNode; 'data-field'?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const fit = useCallback(() => {
    const el = ref.current; if (!el) return;
    el.style.fontSize = max ? `${max}px` : '';
    let size = parseFloat(getComputedStyle(el).fontSize);
    const bad = () => {
      if (el.scrollWidth > el.clientWidth + 1) return true;
      if (!lines) return false;
      const lh = parseFloat(getComputedStyle(el).lineHeight) || size * 1.1;
      return el.getBoundingClientRect().height > lh * lines + 2;
    };
    while (size > min && bad()) { size -= 1; el.style.fontSize = `${size}px`; }
  }, [max, min, lines]);
  useLayoutEffect(() => {
    fit();
    const el = ref.current; if (!el?.parentElement) return;
    const ro = new ResizeObserver(fit); ro.observe(el.parentElement);
    void document.fonts?.ready.then(fit);
    return () => ro.disconnect();
  }, [fit, children]);
  return <Tag ref={ref} className={`wr-fit ${className ?? ''}`} {...rest}>{children}</Tag>;
}

function Photo({ src, alt, className, style, field }: { src: string; alt?: string; className?: string; style?: CSSProperties; field?: string }) {
  const [bad, setBad] = useState(false);
  if (!src || bad) return null; // no empty frames — the slide just goes without a photo
  return (
    <div className={`wr-photo ${className ?? ''}`} style={style} data-field={field}>
      <img src={src} alt={alt || 'хайрын зураг'} crossOrigin="anonymous" onError={() => setBad(true)} />
    </div>
  );
}

function Pol({ src, field, rot }: { src: string; field?: string; rot: number }) {
  const [bad, setBad] = useState(false);
  if (bad) return null;
  return (
    <figure className="wr-pol" style={{ '--r': `${rot}deg` } as CSSProperties} data-field={field}>
      <img src={src} alt="хайрын зураг" crossOrigin="anonymous" onError={() => setBad(true)} />
    </figure>
  );
}

/** Types the letter slowly; the slide's length follows the text (msgDuration) so it always finishes. */
const TYPE_MS = 52;
function Typed({ text, run }: { text: string; run: boolean }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!run) { setN(0); return; }
    if (n >= text.length) return;
    const ch = text[n - 1] ?? '';
    const t = setTimeout(() => setN((x) => x + 1), /[.!?\n]/.test(ch) ? 340 : /[,;:—]/.test(ch) ? 200 : TYPE_MS);
    return () => clearTimeout(t);
  }, [n, run, text]);
  return <>{text.slice(0, n)}<i className="wr-caret" /></>;
}
const msgDuration = (text: string) => Math.min(70000, Math.max(16000, 4500 + text.length * 75));

/* song previews: Apple's public iTunes search returns a short clip when the song is in its catalogue */
const PREVIEW_MS = 10000;
type Preview = 'idle' | 'loading' | 'playing' | 'none';

export default function Wrapped({ data, pin }: { data: WrappedData; pin?: string | number | null }) {
  const pal = THEMES[data.theme] ?? THEMES.neon;
  const days = useMemo(() => {
    const s = Date.parse(data.startDate + 'T00:00:00');
    return Number.isFinite(s) ? Math.max(1, Math.floor((Date.now() - s) / 864e5) + 1) : 0;
  }, [data.startDate]);

  const songs = data.songs.map((s, i) => ({ ...s, i })).filter((s) => s.title.trim());
  const places = data.places.map((p, i) => ({ ...p, i })).filter((p) => p.name.trim());
  const words = data.words.map((w, i) => ({ w, i })).filter((x) => x.w.trim());
  // the collage holds exactly 4 or 6 photos: 6+ → 6, 4–5 → 4, fewer → the slide is skipped
  const photoPool = data.photos.map((p, slot) => ({ p, slot })).filter((x) => x.p);
  const photoCount = photoPool.length >= 6 ? 6 : photoPool.length >= 4 ? 4 : 0;
  const photos = photoPool.slice(0, photoCount);

  /* audio: the buyer's music (ducked while a song preview plays, brought up softly for the letter) + preview clips */
  const audio = useRef<HTMLAudioElement | null>(null);
  const preview = useRef<HTMLAudioElement | null>(null);
  const previewUrl = useRef<Record<number, string | null>>({});
  const stopTimer = useRef<number | undefined>(undefined);
  const [prev, setPrev] = useState<{ i: number; state: Preview }>({ i: -1, state: 'idle' });
  const volume = useCallback((to: number, s = 1.2) => { if (audio.current) gsap.to(audio.current, { volume: to, duration: s, ease: 'sine.inOut' }); }, []);
  const stopPreview = useCallback(() => {
    window.clearTimeout(stopTimer.current);
    if (preview.current) { preview.current.pause(); preview.current.currentTime = 0; }
    setPrev({ i: -1, state: 'idle' }); volume(0.5, 0.6);
  }, [volume]);
  const playSong = useCallback(async (slot: number, title: string, artist: string) => {
    if (prev.i === slot && (prev.state === 'playing' || prev.state === 'loading')) { stopPreview(); return; }
    window.clearTimeout(stopTimer.current);
    preview.current?.pause();
    setPrev({ i: slot, state: 'loading' });
    try {
      if (!(slot in previewUrl.current)) {
        const q = new URLSearchParams({ term: `${title} ${artist}`.trim(), media: 'music', entity: 'song', limit: '1' });
        const r = await fetch(`https://itunes.apple.com/search?${q}`).then((x) => x.json());
        previewUrl.current[slot] = r.results?.[0]?.previewUrl ?? null;
      }
      const url = previewUrl.current[slot];
      if (!url) { setPrev({ i: slot, state: 'none' }); window.setTimeout(() => setPrev((p) => (p.i === slot ? { i: -1, state: 'idle' } : p)), 2200); return; }
      preview.current ??= new Audio();
      preview.current.src = url; preview.current.volume = 0.9;
      await preview.current.play();
      volume(0.1, 0.5);
      setPrev({ i: slot, state: 'playing' });
      stopTimer.current = window.setTimeout(stopPreview, PREVIEW_MS);
    } catch { setPrev({ i: -1, state: 'idle' }); }
  }, [prev, stopPreview, volume]);

  /* slide list — sections with no content are skipped */
  type S = { id: string; node: (on: boolean) => ReactNode; ms?: number; center?: boolean };
  const slides: S[] = [];
  if (days) slides.push({ id: 'days', node: () => <DaysSlide days={days} /> });
  slides.push({ id: 'top', node: () => <TopSlide data={data} /> });
  if (songs.length) slides.push({ id: 'songs', ms: DUR * 1.6, node: () => <SongsSlide songs={songs} prev={prev} onPlay={playSong} /> });
  if (places.length) slides.push({ id: 'places', node: () => <PlacesSlide places={places} /> });
  if (words.length) slides.push({ id: 'words', node: () => <WordsSlide words={words} pal={pal} /> });
  slides.push({ id: 'persona', node: () => <PersonaSlide data={data} /> });
  if (photoCount) slides.push({ id: 'photos', ms: DUR * 1.2, node: () => <PhotosSlide year={data.year} photos={photos} n={photoCount as 4 | 6} /> });
  slides.push({ id: 'msg', center: true, ms: msgDuration(data.message), node: (on) => <MsgSlide data={data} on={on} /> });
  slides.push({ id: 'summary', ms: DUR * 2.2, node: () => <SummaryCard data={data} songs={songs} places={places} days={days} /> });

  const pinnedIndex = pin === '__intro__' ? -1 : pin ? slides.findIndex((sl) => sl.id === pin) : -1;
  const [played, setI] = useState(pin === '__intro__' || pinnedIndex >= 0 ? pinnedIndex : -1);
  // In the editor (pin set) the shown slide follows the pin by id — the slide list can change as the buyer
  // types, and the page is never remounted — otherwise it's wherever the story has played to.
  const i = pin ? pinnedIndex : played;
  const [paused, setPaused] = useState(false);
  const [prog, setProg] = useState(0);
  const last = slides.length - 1;
  const cur = slides[i];

  const go = useCallback((n: number) => { stopPreview(); setI(Math.max(0, Math.min(last, n))); setProg(0); }, [last, stopPreview]);
  const start = () => {
    if (data.music) {
      audio.current ??= Object.assign(new Audio(data.music), { loop: true, volume: 0 });
      audio.current.play().then(() => volume(0.5, 2)).catch(() => {});
    }
    go(0);
  };
  useEffect(() => () => { audio.current?.pause(); preview.current?.pause(); window.clearTimeout(stopTimer.current); }, []);
  // the letter: the music comes up softly, then settles back
  const slideId = cur?.id;
  useEffect(() => { if (slideId === 'msg') volume(0.85, 4); else volume(0.5, 1.5); }, [slideId, volume]);

  // auto-advance (a playing song preview holds the slide)
  const hold = paused || prev.state === 'playing' || prev.state === 'loading';
  useEffect(() => {
    if (i < 0 || hold || i === last || pin) return;
    let raf = 0;
    const dur = slides[i]?.ms ?? DUR;
    const t0 = performance.now() - prog * dur;
    const tick = (t: number) => {
      const p = (t - t0) / dur;
      if (p >= 1) { go(i + 1); return; }
      setProg(p); raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, hold, pin]);

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
    if ((e.target as HTMLElement).closest('button, [data-tap]')) return;
    const x = e.clientX / window.innerWidth;
    go(x < 0.3 ? i - 1 : i + 1);
  };

  const bg = i < 0 ? pal[0] : pal[i % pal.length];
  const accent = pal[(Math.max(i, 0) + 2) % pal.length];
  const vars = { '--bg': bg, '--fg': inkOn(bg), '--accent': accent, '--accent-fg': inkOn(accent) } as CSSProperties;

  /* 1080×1920 PNG of the final card (html-to-image) */
  const exportRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    const node = exportRef.current; if (!node || saving) return;
    setSaving(true);
    try {
      const { toPng } = await import('html-to-image');
      const opts = { width: 1080, height: 1920, pixelRatio: 1, cacheBust: true };
      let url: string;
      // Safari draws the first pass without images; a photo host without CORS makes it fail — then retry without photos
      const within = <T,>(p: Promise<T>) => Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error('timeout')), 25000))]);
      try { await within(toPng(node, opts)); url = await within(toPng(node, opts)); }
      catch { url = await within(toPng(node, { ...opts, filter: (n) => n.nodeName !== 'IMG' })); }
      const a = document.createElement('a'); a.href = url; a.download = `wrapped-${data.year}.png`; a.click();
    } catch { /* the button just stops spinning */ }
    setSaving(false);
  };

  return (
    <div className="wr-root" style={vars}>
      <div className="wr-stage" data-field="theme">
        <div className="wr-shapes" key={'s' + i} aria-hidden>
          <i className="c1" style={{ background: pal[(Math.max(i, 0) + 1) % pal.length] }} />
          <i className="c2" style={{ background: pal[(Math.max(i, 0) + 3) % pal.length] }} />
          <svg className="squiggle" viewBox="0 0 300 60"><path d="M0 30 Q 25 0 50 30 T 100 30 T 150 30 T 200 30 T 250 30 T 300 30" /></svg>
          <b className="star">✦</b>
        </div>

        {i < 0 ? (
          <div className="wr-intro">
            <p className="wr-kicker"><span data-field="them">{data.them}</span>, энэ чамд</p>
            <Fit as="h1" className="wr-mega" max={88} min={30} data-field="year">Бидний<br />{data.year}<br />он</Fit>
            <p className="wr-body"><span data-field="you">{data.you}</span> бидний өдөр, дуу, газар бүрийг эргэн санаад чамд зориулж үүнийг хийлээ.</p>
            <button className="wr-cta" onClick={start}>Эхэлье ▶</button>
            <small className="wr-hint">Баруун талд дарж урагшилна · удаан дарж зогсооно</small>
          </div>
        ) : (
          <>
            <div className="wr-bars">
              {slides.map((_, k) => <span key={k}><i style={{ transform: `scaleX(${k < i ? 1 : k === i ? (i === last ? 1 : prog) : 0})` }} /></span>)}
            </div>
            <div className="wr-top-bar"><span className="wr-avatar">♥</span><b>{data.them} &amp; {data.you}</b><small>{data.year} · Wrapped</small></div>
            <div className={`wr-slide ${cur.center ? 'mid' : ''} ${cur.id === 'summary' ? 'final' : ''}`} key={cur.id} onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={() => setPaused(false)}>
              {cur.node(true)}
            </div>
            {i === last && (
              <div className="wr-final-actions">
                <button className="wr-cta wr-save" onClick={save} disabled={saving}>{saving ? 'Хадгалж байна…' : '⬇ Хадгалах'}</button>
                <button className="wr-cta wr-replay" onClick={() => go(0)}>↺ Дахин үзэх</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* off-screen 1080×1920 poster for «Хадгалах» */}
      {i >= 0 && i === last && (
        <div className="wr-export-host" aria-hidden>
          <div className="wr-export" ref={exportRef} style={vars}>
            <div className="wr-export-card"><SummaryCard data={data} songs={songs} places={places} days={days} plain /></div>
            <div className="wr-export-brand">dearlove.mn</div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────── slides ───────── */

function DaysSlide({ days }: { days: number }) {
  const hours = days * 24;
  const ref = useEnter((root) => {
    const num = root.querySelector<HTMLElement>('.wr-num'), hrs = root.querySelector<HTMLElement>('.wr-hours');
    const count = (el: HTMLElement | null, to: number, d: number) => {
      if (!el) return; const o = { v: 0 };
      gsap.to(o, { v: to, duration: d, ease: 'power3.out', onUpdate: () => { el.textContent = Math.round(o.v).toLocaleString('en-US'); } });
    };
    gsap.from('.wr-kicker', { y: 24, opacity: 0, duration: .6, ease: 'power3.out' });
    gsap.from('.wr-num', { scale: .4, rotate: -8, opacity: 0, duration: .9, ease: 'back.out(2.2)' });
    gsap.from('.wr-h1, .wr-body', { y: 30, opacity: 0, duration: .7, delay: .5, stagger: .15, ease: 'power3.out' });
    count(num, days, 1.8); count(hrs, hours, 2.4);
  });
  return (
    <div className="wr-center" ref={ref}>
      <p className="wr-kicker">Тоолоод үзвэл…</p>
      <Fit as="div" className="wr-num" max={144} min={40} data-field="startDate">{days.toLocaleString('en-US')}</Fit>
      <h2 className="wr-h1">өдөр хамт байлаа</h2>
      <p className="wr-body">Бие биеэ сонгосон <b className="wr-hours">{hours.toLocaleString('en-US')}</b> цаг. Би тоолчихсон шүү.</p>
    </div>
  );
}

function TopSlide({ data }: { data: WrappedData }) {
  const ref = useEnter(() => {
    gsap.from('.wr-kicker', { y: 24, opacity: 0, duration: .6, ease: 'power3.out' });
    gsap.from('.wr-top-photo', { y: -220, rotate: -18, opacity: 0, duration: 1.1, delay: .15, ease: 'bounce.out' });
    gsap.from('.wr-h2', { y: 26, opacity: 0, duration: .7, delay: .8, ease: 'power3.out' });
  });
  return (
    <div className="wr-center" ref={ref}>
      <p className="wr-kicker">{data.year} оны №1 мөч</p>
      <Photo src={data.topPhoto} alt={data.topCaption} className="wr-top-photo" field="topPhoto" />
      <Fit as="h2" className="wr-h2" max={26} min={16} lines={3} data-field="topCaption">{data.topCaption}</Fit>
    </div>
  );
}

function SongsSlide({ songs, prev, onPlay }: { songs: { title: string; artist: string; i: number }[]; prev: { i: number; state: Preview }; onPlay: (slot: number, t: string, a: string) => void }) {
  const ref = useEnter(() => {
    gsap.from('.wr-kicker, .wr-h1', { y: 24, opacity: 0, duration: .6, stagger: .1, ease: 'power3.out' });
    gsap.from('.wr-list li', { x: 70, opacity: 0, duration: .65, delay: .25, stagger: .16, ease: 'power3.out' });
  });
  return (
    <div className="wr-list-wrap" ref={ref}>
      <p className="wr-kicker">Бидний топ дуунууд</p>
      <Fit as="h2" className="wr-h1 sm" max={35} min={20} lines={2}>Бидний саундтрек</Fit>
      <ol className="wr-list">
        {songs.map((s, k) => {
          const st = prev.i === s.i ? prev.state : 'idle';
          return (
            <li key={s.i} data-tap role="button" tabIndex={0} className={st} onClick={() => onPlay(s.i, s.title, s.artist)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPlay(s.i, s.title, s.artist); } }}
              aria-label={`${s.title} — 10 секунд сонсох`}>
              <b>{k + 1}</b>
              <span><strong data-field={`songTitles.${s.i}`}>{s.title}</strong><small data-field={`songArtists.${s.i}`}>{s.artist}</small></span>
              {st === 'playing' ? <em className="wr-eq on"><i /><i /><i /><i /></em>
                : st === 'loading' ? <em className="wr-eq-wait">…</em>
                : st === 'none' ? <em className="wr-eq-none">сонсох боломжгүй</em>
                : <em className="wr-eq-play" aria-hidden>▶</em>}
            </li>
          );
        })}
      </ol>
      <small className="wr-note">Дуу дарж 10 секунд сонсоорой</small>
    </div>
  );
}

function PlacesSlide({ places }: { places: { name: string; count: string; i: number }[] }) {
  const ref = useEnter(() => {
    gsap.from('.wr-kicker, .wr-h1', { y: 24, opacity: 0, duration: .6, stagger: .1, ease: 'power3.out' });
    gsap.from('.wr-list li', { x: 70, opacity: 0, duration: .65, delay: .25, stagger: .16, ease: 'power3.out' });
    gsap.from('.wr-pin', { y: -14, scale: 0, duration: .5, delay: .5, stagger: .16, ease: 'back.out(3)' });
  });
  return (
    <div className="wr-list-wrap" ref={ref}>
      <p className="wr-kicker">Топ газрууд</p>
      <Fit as="h2" className="wr-h1 sm" max={35} min={20} lines={2}>Бид болсон газрууд</Fit>
      <ol className="wr-list places">
        {places.map((p, k) => (
          <li key={p.i}>
            <b>{k + 1}</b><span><strong data-field={`places.${p.i}`}>{p.name}</strong>{p.count && <small data-field={`placeCounts.${p.i}`}>{p.count}</small>}</span><em className="wr-pin">📍</em>
          </li>
        ))}
      </ol>
    </div>
  );
}

function WordsSlide({ words, pal }: { words: { w: string; i: number }[]; pal: string[] }) {
  const ref = useEnter(() => {
    gsap.from('.wr-kicker', { y: 24, opacity: 0, duration: .6, ease: 'power3.out' });
    gsap.from('.wr-words span', { scale: 0, rotate: () => gsap.utils.random(-20, 20), duration: 1, delay: .2, stagger: .2, ease: 'elastic.out(1, 0.55)' });
  });
  return (
    <div className="wr-center" ref={ref}>
      <p className="wr-kicker">Бидний хамгийн их хэлдэг үгс</p>
      <div className="wr-words">
        {words.map(({ w, i: slot }, k) => {
          const bg = pal[(k + 1) % pal.length];
          return <span key={slot} data-field={`words.${slot}`} style={{ '--s': `${[3.4, 2.4, 2, 2.8, 1.7, 2.2, 1.6, 2.5][k % 8]}`, '--r': `${[-6, 5, -3, 8, -8, 3, 6, -4][k % 8]}deg`, background: bg, color: inkOn(bg) } as CSSProperties}>{w}</span>;
        })}
      </div>
    </div>
  );
}

function PersonaSlide({ data }: { data: WrappedData }) {
  const ref = useEnter(() => {
    gsap.from('.wr-kicker', { y: 24, opacity: 0, duration: .6, ease: 'power3.out' });
    gsap.from('.wr-badge', { scale: 0, rotate: -140, duration: 1.1, delay: .1, ease: 'back.out(1.7)' });
    gsap.from('.wr-h1, .wr-body', { y: 30, opacity: 0, duration: .7, delay: .6, stagger: .15, ease: 'power3.out' });
  });
  return (
    <div className="wr-center" ref={ref}>
      <p className="wr-kicker">Чиний хайрын төрөл…</p>
      <div className="wr-badge" data-field="personaEmoji"><svg viewBox="0 0 200 200"><path d="M100 0l22 36 41-12-6 42 40 18-30 30 18 38-42 4-8 42-35-24-35 24-8-42-42-4 18-38-30-30 40-18-6-42 41 12z" /></svg><span>{data.persona.emoji}</span></div>
      <Fit as="h2" className="wr-h1" max={46} min={22} lines={2} data-field="personaTitle">{data.persona.title}</Fit>
      <p className="wr-body" data-field="personaText">{data.persona.text}</p>
    </div>
  );
}

/** The photo collage: polaroids with a slight tilt that drop in one by one. Always 4 or 6. */
const TILTS = [-5, 4, -3, 5, -4, 3];
function PhotosSlide({ year, photos, n }: { year: string; photos: { p: string; slot: number }[]; n: 4 | 6 }) {
  const ref = useEnter(() => {
    gsap.from('.wr-kicker', { y: 24, opacity: 0, duration: .6, ease: 'power3.out' });
    gsap.from('.wr-pol', { y: () => -window.innerHeight * 0.7, rotate: () => gsap.utils.random(-30, 30), opacity: 0, duration: .95, delay: .25, stagger: .38, ease: 'bounce.out' });
  });
  return (
    <div className="wr-center" ref={ref}>
      <p className="wr-kicker">{year} оны зургууд</p>
      <div className={`wr-collage n${n}`}>
        {photos.map(({ p, slot }, k) => <Pol key={slot} src={p} field={`photos.${slot}`} rot={TILTS[k % TILTS.length]} />)}
      </div>
    </div>
  );
}

function MsgSlide({ data, on }: { data: WrappedData; on: boolean }) {
  const ref = useEnter(() => { gsap.from('.wr-kicker', { y: 20, opacity: 0, duration: .7, ease: 'power3.out' }); });
  return (
    <div className="wr-msg" ref={ref}>
      <p className="wr-kicker">Бас нэг зүйл</p>
      <p className="wr-letter" data-field="message"><span className="ghost">{data.message}</span><span className="live"><Typed text={data.message} run={on} /></span></p>
      <p className="wr-sign">— <span data-field="you">{data.you}</span></p>
    </div>
  );
}

/** The final card — on screen, and again at poster size for «Хадгалах». */
function SummaryCard({ data, songs, places, days, plain = false }: {
  data: WrappedData; songs: { title: string; i: number }[]; places: { name: string; i: number }[]; days: number; plain?: boolean;
}) {
  const ref = useEnter(() => { if (!plain) gsap.from('.wr-card', { y: 90, rotate: -9, scale: .85, opacity: 0, duration: 1, ease: 'back.out(1.5)' }); });
  return (
    <div className="wr-summary" ref={ref}>
      <div className="wr-card">
        <div className="wr-card-top">
          <Photo src={data.topPhoto} alt={data.topCaption} className="wr-card-photo" />
          <div><small>{data.year} · Wrapped</small><strong>{data.them} &amp; {data.you}</strong></div>
        </div>
        <div className="wr-card-grid">
          {songs.length > 0 && <div><small>Топ дуу</small>{songs.slice(0, 3).map((s, i) => <p key={i} data-field={plain ? undefined : `songTitles.${s.i}`}>{i + 1} {s.title}</p>)}</div>}
          {places.length > 0 && <div><small>Топ газар</small>{places.slice(0, 3).map((p, i) => <p key={i} data-field={plain ? undefined : `places.${p.i}`}>{i + 1} {p.name}</p>)}</div>}
          {days > 0 && <div><small>Хамтдаа</small><p className="big">{days.toLocaleString('en-US')} өдөр</p></div>}
          <div><small>Хайрын төрөл</small><p className="big sm">{data.persona.emoji} {data.persona.title}</p></div>
        </div>
        <div className="wr-card-foot">♥ Хайраар бүтээв · {data.year}</div>
      </div>
    </div>
  );
}
