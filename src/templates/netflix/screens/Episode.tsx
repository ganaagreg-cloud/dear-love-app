'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { FINALE, NO_LINES, YES_LABEL } from '../copy';
import { playFinaleTaDum } from '../sound';
import type { ScreenProps } from './types';

type Props = ScreenProps & { step: number; onNext: () => void; onCredits: () => void };

export default function Episode(props: Props) {
  const { data, copy, step, onNext } = props;
  if (step >= 2) return <Climax key="climax" {...props} />;
  const s = step === 0
    ? { narration: copy.ep1Narration, a: copy.ep1a, b: copy.ep1b, bg: data.ep1Bg }
    : { narration: copy.ep2Narration, a: copy.ep2a, b: copy.ep2b, bg: data.ep2Bg };
  return <Scene key={step} {...s} label={copy.epTitle} accent={data.accent} onChoose={onNext} />;
}

function Backdrop({ accent, bg, glow, at, base, alt }: { accent: string; bg?: string; glow: string; at: string; base: string; alt?: string }) {
  return (
    <div className="lf-ep-bg">
      <div className="lf-ep-placeholder" style={{ background: `radial-gradient(ellipse at ${at}, ${accent}${glow}, transparent 60%), ${base}` }} />
      {bg && <div className="lf-ep-img-layer"><img src={bg} alt={alt || 'хайрын зураг'} /></div>}
      <div className="lf-ep-vignette" />
    </div>
  );
}

function Scene({ narration, a, b, bg, label, accent, onChoose }: {
  narration: string; a: string; b: string; bg: string; label: string; accent: string; onChoose: () => void;
}) {
  const [time, setTime] = useState(10);
  const [picked, setPicked] = useState<string | null>(null);
  const choose = (opt: string) => { if (picked) return; setPicked(opt); setTimeout(onChoose, 650); };
  useEffect(() => {
    if (picked) return;
    if (time <= 0) { choose(a); return; }
    const t = setTimeout(() => setTime((v) => +(v - 0.1).toFixed(1)), 100);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [time, picked]);
  const pct = Math.max(0, (time / 10) * 100);

  return (
    <section className="lf-screen lf-episode">
      <Backdrop accent={accent} bg={bg} glow="33" at="50% 30%" base="#0a0a0a" alt={label} />
      <motion.div className="lf-ep-content" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="lf-ep-label">{label}</div>
        <p className="lf-ep-narration">{narration}</p>
        <div className="lf-ep-timer" aria-label={`Сонгоход ${Math.ceil(time)} секунд үлдлээ`}>
          <div className="lf-ep-timer-bar"><span style={{ transform: `scaleX(${pct / 100})` }} /></div>
        </div>
        <div className="lf-ep-choices">
          {[a, b].map((opt) => (
            <button
              key={opt}
              className={`lf-choice${picked === opt ? ' chosen' : ''}`}
              style={picked === opt ? { boxShadow: `0 0 24px ${accent}aa`, borderColor: accent } : undefined}
              disabled={!!picked && picked !== opt}
              onClick={() => choose(opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function Climax({ data, copy, onCredits }: Props) {
  const [finale, setFinale] = useState(false);
  const [noIdx, setNoIdx] = useState(0);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const isAsk = data.occasion === 'ask_out';

  const yes = () => {
    setFinale(true);
    setTimeout(() => confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, zIndex: 1000001, colors: ['#2dd4bf', '#f472b6', '#ffffff'] }), 100);
  };
  const nextNo = () => setNoIdx((i) => (i + 1) % NO_LINES.length);
  const run = () => {
    let x = Math.floor(Math.random() * 300 - 150), y = Math.floor(Math.random() * 200 - 100);
    if (Math.abs(x - pos.x) < 40) x += 50;
    if (Math.abs(y - pos.y) < 40) y += 50;
    setPos({ x, y });
    nextNo();
  };
  const noStyle = data.funnyNoButton
    ? { position: 'relative' as const, zIndex: 9999, transition: 'all .25s cubic-bezier(.25,1,.5,1)', transform: pos.x || pos.y ? `translate(${pos.x}px,${pos.y}px)` : 'none' }
    : undefined;

  return (
    <section className="lf-screen lf-climax">
      <Backdrop accent={data.accent} bg={data.climaxBg} glow="44" at="50% 35%" base="#080808" alt={copy.climaxTitle} />
      <motion.div className="lf-climax-content" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}>
        <div className="lf-ep-label">УЛИРЛЫН ТӨГСГӨЛ</div>
        <h1 className="lf-climax-title">{copy.climaxTitle}</h1>
        <p className="lf-climax-sub">{copy.climaxSub}</p>
        <div className="lf-climax-cta">
          <motion.button className="lf-btn lf-btn-play lf-btn-big lf-cta-yes" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={yes}>
            {YES_LABEL[data.occasion]}
          </motion.button>
          {isAsk && (
            <button
              className="lf-cta-no"
              style={noStyle}
              onMouseEnter={data.funnyNoButton ? run : undefined}
              onTouchStart={data.funnyNoButton ? (e) => { e.preventDefault(); run(); } : undefined}
              onClick={data.funnyNoButton ? run : nextNo}
            >
              {NO_LINES[noIdx]}
            </button>
          )}
        </div>
      </motion.div>
      <FinaleOverlay open={finale} data={data} onRoll={() => { setFinale(false); onCredits(); }} />
    </section>
  );
}

const EASE = [0.7, 0, 0.3, 1] as const;

function FinaleOverlay({ open, data, onRoll }: { open: boolean; data: Props['data']; onRoll: () => void }) {
  const f = FINALE[data.occasion];
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="finale"
          initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
          style={{ position: 'fixed', inset: 0, zIndex: 999999, background: '#0a0a0a', overflow: 'hidden', display: 'grid', placeItems: 'center', fontFamily: "'Inter', sans-serif", ['--lf-accent' as string]: data.accent }}
        >
          <FinaleSound />
          <motion.div
            initial={{ x: 0 }} animate={{ x: '-100%' }} transition={{ delay: 0.25, duration: 0.9, ease: EASE }}
            style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '50.5%', zIndex: 2, background: 'linear-gradient(90deg,#7a060c,#e50914)', boxShadow: 'inset -30px 0 60px rgba(0,0,0,.5)' }}
          />
          <motion.div
            initial={{ x: 0 }} animate={{ x: '100%' }} transition={{ delay: 0.25, duration: 0.9, ease: EASE }}
            style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '50.5%', zIndex: 2, background: 'linear-gradient(270deg,#7a060c,#e50914)', boxShadow: 'inset 30px 0 60px rgba(0,0,0,.5)' }}
          />
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.95, duration: 0.5, ease: 'easeOut' }}
            style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 20px', color: '#fff' }}
          >
            <div style={{ fontFamily: "'Oswald', Impact, sans-serif", textTransform: 'uppercase', fontWeight: 700, color: data.accent, fontSize: 'clamp(1.4rem,6vw,2.4rem)', letterSpacing: '.18em', textShadow: `0 0 24px ${data.accent}99` }}>LoveFlix</div>
            <div style={{ fontFamily: "'Oswald', Impact, sans-serif", textTransform: 'uppercase', fontWeight: 700, fontSize: 'clamp(3rem,14vw,7rem)', lineHeight: 0.95, margin: '10px 0 22px', textShadow: `0 0 40px ${data.accent}66` }}>
              {f.line(data.pronoun)}
            </div>
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.4, duration: 0.5 }}
              style={{ display: 'inline-block', background: data.accent, color: '#fff', padding: '8px 16px', borderRadius: 4, fontWeight: 800, fontSize: 'clamp(.75rem,2.6vw,.95rem)', letterSpacing: '.2em' }}
            >
              {f.tag}
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.7, duration: 0.5 }} style={{ marginTop: 36 }}>
              <button
                onClick={onRoll}
                style={{ background: 'transparent', color: '#fff', border: '1.5px solid rgba(255,255,255,.75)', borderRadius: 5, padding: '12px 26px', font: "700 .85rem/1 'Inter', sans-serif", letterSpacing: '.18em', cursor: 'pointer' }}
              >
                ТИТР ҮЗЭХ
              </button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function FinaleSound() {
  useEffect(() => { playFinaleTaDum(); }, []);
  return null;
}
