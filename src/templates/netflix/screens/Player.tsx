'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BRANCH_EP, type Branch, type Episode, type LoveData } from '../data';

type PSlide = { kind: 'photo' | 'choice'; photo: string; caption: string; pf?: string; cf?: string };

const SLIDE_MS = 5200;
const COUNTDOWN = 5;

/** An episode's slides; the branch episode gets its A/B fork after the first slide (the picked side replaces the fork, then it merges back). */
function build(ep: Episode, branch: Branch | null, pick: 'a' | 'b' | null): PSlide[] {
  const base: PSlide[] = ep.slides.map((s) => ({ kind: 'photo', photo: s.photo, caption: s.caption, pf: `ep${ep.n}.photos.${s.si}`, cf: `ep${ep.n}.captions.${s.si}` }));
  if (!branch || ep.n !== BRANCH_EP) return base;
  const mid: PSlide = pick
    ? { kind: 'photo', photo: branch[pick].photo, caption: branch[pick].caption, pf: `branch.${pick}.photo`, cf: `branch.${pick}.caption` }
    : { kind: 'choice', photo: base[0]?.photo ?? '', caption: '' };
  return [base[0], mid, ...base.slice(1)];
}

/**
 * 4 · The episode player — story style. Tap right = next, tap left = back, hold = pause. Frozen (the editor's pinned
 * preview) it shows `startAt` and never advances or counts down.
 */
export default function Player({ data, ep, nextEp, first, frozen, startAt = 0, startPick = null, onClose, onNext, onFinale }: {
  data: LoveData; ep: Episode; nextEp: Episode | null; first: boolean; frozen: boolean; startAt?: number; startPick?: 'a' | 'b' | null;
  onClose: (epN: number) => void; onNext: () => void; onFinale: () => void;
}) {
  const [pick, setPick] = useState<'a' | 'b' | null>(startPick);
  const slides = useMemo(() => build(ep, data.branch, pick), [ep, data.branch, pick]);
  const [si, setSi] = useState(startAt);
  const cur = Math.min(si, slides.length - 1), slide = slides[cur];
  const [prog, setProg] = useState(0);
  const [paused, setPaused] = useState(false);
  const [ending, setEnding] = useState(false);
  const [count, setCount] = useState(COUNTDOWN);
  const elapsed = useRef(0);

  const goTo = useCallback((i: number) => { elapsed.current = 0; setProg(0); setSi(i); }, []);
  const finish = useCallback(() => { if (nextEp) { setCount(COUNTDOWN); setEnding(true); } else onFinale(); }, [nextEp, onFinale]);
  const advance = useCallback(() => { if (cur < slides.length - 1) goTo(cur + 1); else finish(); }, [cur, slides.length, goTo, finish]);

  // the slide timer
  useEffect(() => {
    if (frozen || paused || ending || slide.kind === 'choice') return;
    let raf = 0, last = performance.now();
    const tick = (t: number) => {
      elapsed.current += t - last; last = t;
      const p = elapsed.current / SLIDE_MS;
      if (p >= 1) { advance(); return; }
      setProg(p); raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [cur, paused, ending, frozen, slide.kind, advance]);

  // «Дараагийн бүлэг» 5…4…3
  useEffect(() => {
    if (!ending) return;
    const t = window.setInterval(() => setCount((c) => c - 1), 1000);
    return () => window.clearInterval(t);
  }, [ending]);
  useEffect(() => { if (ending && count <= 0) onNext(); }, [ending, count, onNext]);

  /* tap zones + hold to pause */
  const down = useRef(0);
  const onDown = (e: React.PointerEvent) => { if (frozen || (e.target as HTMLElement).closest('button')) return; down.current = Date.now(); setPaused(true); };
  const onUp = (e: React.PointerEvent) => {
    if (frozen || (e.target as HTMLElement).closest('button')) return;
    setPaused(false);
    if (Date.now() - down.current > 250) return; // it was a hold
    const r = e.currentTarget.getBoundingClientRect();
    if ((e.clientX - r.left) / r.width < 0.3) goTo(Math.max(0, cur - 1));
    else if (slide.kind !== 'choice') advance();
  };

  const choose = (k: 'a' | 'b') => { setPick(k); goTo(1); };

  return (
    <section className="lf-screen lf-player" onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={() => setPaused(false)}>
      {/* the slide */}
      {slide.kind === 'photo' ? (
        <div className="lf-pslide" key={`${ep.n}:${cur}:${pick}`}>
          {slide.photo ? <img className={`lf-pimg kb kb${cur % 4}`} src={slide.photo} alt="" data-field={slide.pf} /> : <span className="lf-poster-bg" />}
          <div className="lf-pshade" />
          {slide.caption && <p className="lf-sub" data-field={slide.cf}>{slide.caption}</p>}
        </div>
      ) : (
        <div className="lf-pslide lf-choice" key={`${ep.n}:choice`}>
          {slide.photo && <img className="lf-pimg lf-dim" src={slide.photo} alt="" />}
          <div className="lf-pshade" />
          <div className="lf-choice-box">
            <h2 data-field="branch.prompt">{data.branch?.prompt}</h2>
            <button type="button" className="lf-choice-btn" onClick={() => choose('a')} data-field="branch.a.label">{data.branch?.a.label}</button>
            <button type="button" className="lf-choice-btn" onClick={() => choose('b')} data-field="branch.b.label">{data.branch?.b.label}</button>
          </div>
        </div>
      )}

      {/* top: segmented progress + «Бүлэг 2 · Анхны аялал · 2024.03» + close */}
      <div className="lf-ptop">
        <div className="lf-segs" aria-hidden>
          {slides.map((_, i) => <span key={i}><i style={{ width: `${i < cur || (frozen && i === cur) ? 100 : i === cur ? prog * 100 : 0}%` }} /></span>)}
        </div>
        <div className="lf-pmeta">
          <button type="button" className="lf-x" onClick={() => onClose(ep.n)} aria-label="Хаах">✕</button>
          <span>Бүлэг {ep.n}{ep.title && <> · <span data-field={`ep${ep.n}.title`}>{ep.title}</span></>}{ep.date && <> · <span data-field={`ep${ep.n}.date`}>{ep.date}</span></>}</span>
        </div>
      </div>

      {first && !frozen && cur === 0 && !ending && slides.length > 1 && (
        <button type="button" className="lf-skip" onClick={() => goTo(1)}>Танилцах хэсгийг алгасах ›</button>
      )}

      {/* end of the episode → next-episode card with a countdown ring */}
      {ending && nextEp && (
        <div className="lf-next">
          <p className="lf-next-label">Дараагийн бүлэг</p>
          <div className="lf-ring" aria-hidden>
            <svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" className="bg" /><circle cx="32" cy="32" r="28" className="fg" style={{ animationDuration: `${COUNTDOWN}s` }} /></svg>
            <b>{Math.max(0, count)}</b>
          </div>
          <h3>Бүлэг {nextEp.n}{nextEp.title && ` · ${nextEp.title}`}</h3>
          <div className="lf-next-actions">
            <button type="button" className="lf-btn lf-btn-play" onClick={onNext}><i aria-hidden>▶</i> Одоо үзэх</button>
            <button type="button" className="lf-btn lf-btn-info" onClick={() => onClose(ep.n)}>Бүлгүүд</button>
          </div>
        </div>
      )}
    </section>
  );
}
