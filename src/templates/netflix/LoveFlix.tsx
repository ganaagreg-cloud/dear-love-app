'use client';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { COPY, type Copy } from './copy';
import type { LoveData } from './data';
import { playTaDum } from './sound';
import Profiles from './screens/Profiles';
import Intro from './screens/Intro';
import Browse from './screens/Browse';
import Episode from './screens/Episode';
import Credits from './screens/Credits';

type Screen = 'profiles' | 'intro' | 'browse' | 'episode' | 'credits';

export default function LoveFlix({ data, pin }: { data: LoveData; pin?: string | number | null }) {
  const [screen, setScreen] = useState<Screen>('profiles');
  const [sceneStep, setSceneStep] = useState(0); // 0,1 = choice scenes, 2 = climax
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  const [recoDismissed, setRecoDismissed] = useState(false);
  const recoRef = useRef<HTMLDivElement>(null);
  const [recoH, setRecoH] = useState(0);
  const showReco = isMobile && !recoDismissed;

  const copy = useMemo<Copy>(() => ({ ...COPY[data.occasion], ...data.overrides }) as Copy, [data]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Push content below the fixed banner so it never covers logos / credit controls
  useLayoutEffect(() => {
    if (!showReco || !recoRef.current) { setRecoH(0); return; }
    const el = recoRef.current;
    const ro = new ResizeObserver(() => setRecoH(el.offsetHeight));
    ro.observe(el); setRecoH(el.offsetHeight);
    return () => ro.disconnect();
  }, [showReco]);

  const selectProfile = () => { playTaDum(); setScreen('intro'); };
  useEffect(() => {
    if (screen !== 'intro' || pin) return;
    const t = setTimeout(() => setScreen('browse'), 2600);
    return () => clearTimeout(t);
  }, [screen, pin]);
  const isScreen = (v: unknown): v is Screen => v === 'profiles' || v === 'intro' || v === 'browse' || v === 'episode' || v === 'credits';
  useEffect(() => {
    if (!isScreen(pin)) return;
    setScreen(pin);
    if (pin === 'episode') setSceneStep(0);
  }, [pin]);
  const play = () => { setSceneStep(0); setScreen('episode'); window.scrollTo({ top: 0 }); };
  const nextScene = () => setSceneStep((s) => Math.min(s + 1, 2));
  const toCredits = () => { setScreen('credits'); window.scrollTo({ top: 0 }); };
  const restart = () => { setSceneStep(0); setScreen('profiles'); window.scrollTo({ top: 0 }); };

  const props = { data, copy };

  return (
    <div className="loveflix" style={{ '--lf-accent': data.accent, paddingTop: recoH } as CSSProperties}>
      {showReco && (
        <div className="lf-reco" role="note" ref={recoRef}>
          <span>📺 LoveFlix том дэлгэц дээр илүү гоё — боломжтой бол компьютер дээрээ нээгээрэй.</span>
          <button className="lf-reco-x" aria-label="Хаах" onClick={() => setRecoDismissed(true)}>✕</button>
        </div>
      )}
      {screen === 'profiles' && <Profiles {...props} onSelect={selectProfile} />}
      {screen === 'intro' && <Intro {...props} />}
      {screen === 'browse' && <Browse {...props} onPlay={play} />}
      {screen === 'episode' && <Episode {...props} step={sceneStep} onNext={nextScene} onCredits={toCredits} pinned={!!pin} />}
      {screen === 'credits' && <Credits {...props} onRestart={restart} />}
    </div>
  );
}
