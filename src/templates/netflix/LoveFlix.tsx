'use client';
import { useCallback, useState } from 'react';
import { BRANCH_EP, type LoveData, type View } from './data';
import { useAudio } from './parts/useAudio';
import Grain from './parts/Grain';
import Gate from './screens/Gate';
import Intro from './screens/Intro';
import Home from './screens/Home';
import Player from './screens/Player';
import Finale from './screens/Finale';
import Credits from './screens/Credits';

type Screen = 'gate' | 'intro' | 'home' | 'player' | 'finale' | 'credits';

/**
 * The whole gift, in strict order: gate → intro → home → episode player → finale → credits → (home).
 * It lives in a centered 480px phone column over a blurred, darkened photo. `pin` (the editor) shows one screen
 * frozen — no timers, no countdown — otherwise the state machine below drives it.
 */
export default function LoveFlix({ data, pin }: { data: LoveData; pin: View | null }) {
  const audio = useAudio(data.music);
  const [screen, setScreen] = useState<Screen>('gate');
  const [epN, setEpN] = useState(0);
  const [watched, setWatched] = useState<number[]>([]);
  const eps = data.episodes;
  const mark = (n: number) => setWatched((w) => (w.includes(n) ? w : [...w, n]));

  /* what is on screen: the pin, or the story's own position */
  let name: Screen = screen, ep = eps.find((e) => e.n === epN) ?? null, startAt = 0, startPick: 'a' | 'b' | null = null;
  if (pin) {
    if (pin.name === 'ep') { name = 'player'; ep = eps.find((e) => e.n === pin.n) ?? null; startAt = pin.slide; }
    else if (pin.name === 'branch') { name = 'player'; ep = eps.find((e) => e.n === BRANCH_EP) ?? null; startAt = 1; startPick = pin.pick; }
    else name = pin.name;
  }
  if (name === 'player' && !ep) name = 'home';
  const frozen = !!pin;

  const nextEp = ep ? eps[eps.findIndex((e) => e.n === ep!.n) + 1] ?? null : null;
  const lastPhoto = [...(eps[eps.length - 1]?.slides ?? [])].reverse().find((s) => s.photo)?.photo ?? data.trailer[0]?.src ?? '';
  const backdrop = data.trailer[0]?.src || data.profilePhoto;

  const start = useCallback(() => { audio.unlock(); audio.tadum(); setScreen('intro'); }, [audio]);
  const introDone = useCallback(() => { audio.startMusic(); setScreen('home'); }, [audio]);
  const play = (n: number) => { setEpN(n); setScreen('player'); };
  const closeEp = useCallback((n: number) => { mark(n); setScreen('home'); }, []);
  const goNext = useCallback(() => { if (!ep) return; mark(ep.n); if (nextEp) setEpN(nextEp.n); else setScreen('finale'); }, [ep, nextEp]);
  const goFinale = useCallback(() => { if (ep) mark(ep.n); setScreen('finale'); }, [ep]);

  return (
    <div className="lf-root">
      <div className="lf-backdrop" style={backdrop ? { backgroundImage: `url("${backdrop}")` } : undefined} />
      <div className="lf-col">
        {name === 'gate' && <Gate data={data} onStart={start} />}
        {name === 'intro' && <Intro onDone={introDone} still={frozen} />}
        {name === 'home' && <Home data={data} watched={watched} onPlay={play} />}
        {name === 'player' && ep && (
          <Player
            key={frozen ? `${ep.n}:${startAt}:${startPick}` : `ep${ep.n}`}
            data={data} ep={ep} nextEp={nextEp} first={ep.n === eps[0]?.n} frozen={frozen} startAt={startAt} startPick={startPick}
            onClose={closeEp} onNext={goNext} onFinale={goFinale}
          />
        )}
        {name === 'finale' && <Finale data={data} backdrop={lastPhoto} frozen={frozen} onYes={() => setScreen('credits')} />}
        {name === 'credits' && <Credits data={data} still={frozen} onBack={() => setScreen('home')} />}

        <button type="button" className="lf-mute" onClick={audio.toggleMute} aria-pressed={audio.muted} aria-label={audio.muted ? 'Дууг асаах' : 'Дууг хаах'}>
          {audio.muted
            ? <svg viewBox="0 0 24 24" aria-hidden><path d="M4 9v6h4l5 4V5L8 9H4z" /><path d="M16 9l5 6M21 9l-5 6" className="s" /></svg>
            : <svg viewBox="0 0 24 24" aria-hidden><path d="M4 9v6h4l5 4V5L8 9H4z" /><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" className="s" /></svg>}
        </button>
        <Grain />
      </div>
    </div>
  );
}
