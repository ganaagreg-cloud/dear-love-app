'use client';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';

/** `i` = the stop's slot in the editor lists (kept when empty stops are skipped). */
export type Stop = { name: string; code: string; date: string; note: string; photo: string; i: number };
export type FlightData = {
  airline: string; flightNo: string;
  passenger: string; captain: string;
  fromCode: string; fromCity: string; toCode: string; toCity: string;
  date: string; boarding: string; gate: string; seat: string; cabin: string;
  color: string;
  stops: Stop[];
  finalTitle: string; finalMessage: string;
  music: string;
};

type Scene = 'board' | 'pass' | 'fly' | 'land';
const FLAP = 'АБВГДЕЁЖЗИЙКЛМНОӨПРСТУҮФХЦЧШЩЪЫЬЭЮЯABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789♥ ';

/* ───────── split-flap text ───────── */
function Flap({ text, delay = 0, len, field }: { text: string; delay?: number; len?: number; field?: string }) {
  const target = (text.toUpperCase() + ' '.repeat(len ?? 0)).slice(0, len ?? text.length);
  const [shown, setShown] = useState(() => ' '.repeat(target.length));
  useEffect(() => {
    let frame = 0; const start = performance.now() + delay; let raf = 0;
    const tick = (t: number) => {
      if (t < start) { raf = requestAnimationFrame(tick); return; }
      frame++;
      const done = Math.floor((t - start) / 45);
      setShown([...target].map((ch, i) => (i < done - 6 ? ch : ch === ' ' && i < done ? ' ' : FLAP[(frame * 7 + i * 13) % FLAP.length])).join(''));
      if (done - 6 < target.length) raf = requestAnimationFrame(tick);
      else setShown(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, delay]);
  return <span className="fl-flap" data-field={field}>{[...shown].map((c, i) => <i key={i}>{c === ' ' ? ' ' : c}</i>)}</span>;
}

/* ───────── barcode (deterministic from text) ───────── */
function Barcode({ seed }: { seed: string }) {
  const bars = useMemo(() => {
    let h = 7; for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return Array.from({ length: 48 }, () => { h = (h * 1103515245 + 12345) >>> 0; return 1 + (h % 4); });
  }, [seed]);
  let x = 0;
  return (
    <svg className="fl-barcode" viewBox="0 0 200 50" preserveAspectRatio="none" aria-hidden>
      {bars.map((w, i) => { const r = i % 2 === 0 ? <rect key={i} x={x} y={0} width={w} height={50} /> : null; x += w + 1; return r; })}
    </svg>
  );
}

/* ───────── stylised map ───────── */
const MAP_W = 1600, MAP_H = 1000;
function stopPositions(n: number) {
  // gentle zig-zag across the map, start bottom-left → end top-right
  const pts: [number, number][] = [];
  const total = n + 2;
  for (let i = 0; i < total; i++) {
    const t = i / (total - 1);
    const x = 170 + t * (MAP_W - 340);
    const y = 760 - t * 460 + (i % 2 ? -150 : 110) * (i > 0 && i < total - 1 ? 1 : 0);
    pts.push([Math.round(x), Math.round(y)]);
  }
  return pts;
}
function routePath(pts: [number, number][]) {
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    const mx = (x0 + x1) / 2, my = Math.min(y0, y1) - 120;
    d += ` Q${mx} ${my} ${x1} ${y1}`;
  }
  return d;
}

function Land() {
  // hand-tuned blobs: reads as "a map" without being a real country outline
  return (
    <g className="fl-land">
      <path d="M40 620 C120 480 300 470 380 560 C460 640 620 600 660 700 C700 800 560 900 420 880 C300 860 200 940 110 880 C30 830 0 720 40 620Z" />
      <path d="M520 230 C640 120 860 140 930 250 C990 340 1120 300 1180 380 C1240 460 1130 560 1000 540 C880 520 800 600 690 540 C580 480 430 330 520 230Z" />
      <path d="M1180 640 C1260 560 1420 580 1500 660 C1580 740 1540 880 1420 900 C1300 920 1220 860 1170 790 C1130 730 1130 690 1180 640Z" />
      <path d="M1260 120 C1320 70 1450 80 1500 150 C1540 210 1480 280 1400 270 C1330 262 1300 300 1250 260 C1210 225 1220 160 1260 120Z" />
      <path d="M250 180 C300 140 380 160 390 220 C400 280 330 300 290 280 C240 260 210 220 250 180Z" />
    </g>
  );
}

/** The big route codes shrink for longer words so they always fit the boarding pass. */
const codeSize = (c: string): CSSProperties | undefined => {
  const px = [0, 0, 0, 0, 0, 32, 28, 24, 22][c.length];
  return px ? { fontSize: px } : c.length > 8 ? { fontSize: 20 } : undefined;
};

export default function Flight({ data, pin }: { data: FlightData; pin?: string | number | null }) {
  const isScene = (v: unknown): v is Scene => v === 'board' || v === 'pass' || v === 'fly' || v === 'land';
  // editor pin 'stop:<i>' = the fly scene, parked at stop i's postcard
  const stopPin = typeof pin === 'string' && /^stop:\d+$/.test(pin) ? Number(pin.slice(5)) : null;
  const [scene, setScene] = useState<Scene>(isScene(pin) ? pin : stopPin != null ? 'fly' : 'board');
  const [torn, setTorn] = useState(false);
  // The editor can pin a stop that has no name yet — keep it in the journey (with a stand-in name) so the
  // preview parks there instead of falling back to stop 0. The recipient has no pin, so empty stops stay skipped.
  const stops = data.stops
    .filter((s) => s.name.trim() || s.i === stopPin)
    .map((s) => (s.name.trim() ? s : { ...s, name: `Буудал ${s.i + 1}` }));
  const pts = useMemo(() => stopPositions(stops.length), [stops.length]);
  const d = useMemo(() => routePath(pts), [pts]);
  const audio = useRef<HTMLAudioElement | null>(null);

  const startMusic = () => {
    if (!data.music) return;
    audio.current ??= Object.assign(new Audio(data.music), { loop: true, volume: 0.65 });
    audio.current.play().catch(() => {});
  };
  useEffect(() => () => audio.current?.pause(), []);

  // The editor changes `pin` when the buyer switches section — the initializer above only covers the
  // first mount, so re-apply `pin` reactively. Content edits don't remount (FlightView has no key).
  useEffect(() => {
    if (isScene(pin)) setScene(pin);
    else if (stopPin != null) setScene('fly');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  useEffect(() => { if (scene === 'board' && !pin) { const t = setTimeout(() => setScene('pass'), 4200); return () => clearTimeout(t); } }, [scene, pin]);

  const board = () => {
    if (torn) return;
    startMusic();
    setTorn(true);
    setTimeout(() => setScene('fly'), 1500);
  };

  return (
    <div className="fl-root" style={{ '--brand': data.color } as CSSProperties}>
      {scene === 'board' && <DepartureBoard data={data} onSkip={() => setScene('pass')} />}
      {scene === 'pass' && (
        <div className="fl-pass-scene">
          <p className="fl-eyebrow">Таны тасалбар бэлэн</p>
          <div className={`fl-pass ${torn ? 'torn' : ''}`}>
            <div className="fl-main">
              <header className="fl-head" data-field="color">
                <span className="fl-logo" data-field="airline">✈︎ {data.airline}</span>
                <span className="fl-class" data-field="cabin">{data.cabin}</span>
              </header>
              <div className="fl-route">
                <div><b data-field="fromCode" style={codeSize(data.fromCode)}>{data.fromCode}</b><small data-field="fromCity">{data.fromCity}</small></div>
                <div className="fl-plane"><i />✈<i /></div>
                <div className="r"><b data-field="toCode" style={codeSize(data.toCode)}>{data.toCode}</b><small data-field="toCity">{data.toCity}</small></div>
              </div>
              <div className="fl-fields">
                <div data-field="passenger"><small>Зорчигч</small><strong>{data.passenger}</strong></div>
                <div data-field="flightNo"><small>Нислэг</small><strong>{data.flightNo}</strong></div>
                <div data-field="date"><small>Огноо</small><strong>{data.date}</strong></div>
                <div data-field="boarding"><small>Суух цаг</small><strong>{data.boarding}</strong></div>
                <div data-field="gate"><small>Хаалга</small><strong>{data.gate}</strong></div>
                <div data-field="seat"><small>Суудал</small><strong>{data.seat}</strong></div>
              </div>
              <p className="fl-captain">Жолоодох нисгэгч: <b data-field="captain">{data.captain}</b></p>
            </div>
            <div className="fl-stub">
              <div className="fl-stub-in">
                <small>Суух тасалбар</small>
                <strong>{data.passenger}</strong>
                <span>{data.fromCode} → {data.toCode}</span>
                <span>Суудал: {data.seat}</span>
                <Barcode seed={data.passenger + data.flightNo} />
              </div>
            </div>
          </div>
          <button className="fl-btn" onClick={board} disabled={torn}>{torn ? 'Онгоцонд сууж байна…' : 'Тасалж онгоцонд суух ✂︎'}</button>
          <small className="fl-hint">Замдаа {stops.length} буудал · аятайхан нислэг хүсье</small>
        </div>
      )}
      {scene === 'fly' && (
        <Journey
          key={`${stopPin ?? 'fly'}:${stops.length}`} data={data} stops={stops} pts={pts} d={d} onLand={() => setScene('land')}
          parkAt={stopPin == null ? null : Math.max(0, stops.findIndex((s) => s.i === stopPin))}
        />
      )}
      {scene === 'land' && (
        <div className="fl-land-scene">
          <div className="fl-arrivals"><Flap text="ИРЛЭЭ" len={5} /> <Flap text={data.toCode} len={Math.max(3, data.toCode.length)} delay={300} /></div>
          <div className="fl-passport">
            <div className="fl-stamp"><span data-field="toCity">{data.toCity}</span><b>♥ ЗӨВШӨӨРӨВ ♥</b><small data-field="date">{data.date}</small></div>
            <h1 data-field="finalTitle">{data.finalTitle}</h1>
            <p data-field="finalMessage">{data.finalMessage}</p>
            <p className="fl-sign">— Нисгэгч <span data-field="captain">{data.captain}</span></p>
          </div>
          <button className="fl-btn ghost" onClick={() => { setTorn(false); setScene('board'); }}>↺ Дахин нисэх</button>
        </div>
      )}
    </div>
  );
}

function DepartureBoard({ data, onSkip }: { data: FlightData; onSkip: () => void }) {
  const rows = [
    { t: '08:15', f: 'LV 101', to: 'ХААНА Ч БИШ', s: 'ЦУЦЛАВ' },
    { t: data.boarding.slice(0, 5), f: data.flightNo, to: data.toCity, s: 'СУУЖ БАЙНА', me: true, fields: ['boarding', 'flightNo', 'toCity'] },
    { t: '11:40', f: 'LV 404', to: 'ГАНЦААРАА', s: 'ЦУЦЛАВ' },
  ];
  return (
    <div className="fl-board" role="button" tabIndex={0} aria-label="Үргэлжлүүлэх" onClick={onSkip} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSkip(); } }}>
      <div className="fl-board-head"><span>✈︎ ХӨӨРӨХ</span><Clock /></div>
      <div className="fl-board-table">
        <div className="fl-board-row th"><span>ЦАГ</span><span>НИСЛЭГ</span><span>ЧИГЛЭЛ</span><span>ТӨЛӨВ</span></div>
        {rows.map((r, i) => (
          <div className={`fl-board-row ${r.me ? 'me' : ''}`} key={i}>
            <Flap text={r.t} len={5} delay={i * 220} field={r.fields?.[0]} />
            <Flap text={r.f} len={7} delay={i * 220 + 120} field={r.fields?.[1]} />
            <Flap text={r.to} len={12} delay={i * 220 + 240} field={r.fields?.[2]} />
            <Flap text={r.s} len={10} delay={i * 220 + 360} />
          </div>
        ))}
      </div>
      <p className="fl-board-call">Зорчигч <b data-field="passenger">{data.passenger}</b> та <span data-field="gate">{data.gate}</span>-р хаалга руу явна уу.</p>
    </div>
  );
}
function Clock() {
  const [t, setT] = useState('');
  useEffect(() => { const f = () => setT(new Date().toTimeString().slice(0, 5)); f(); const id = setInterval(f, 10000); return () => clearInterval(id); }, []);
  return <span>{t}</span>;
}

/* ───────── the flight across the map ───────── */
function Journey({ data, stops, pts, d, onLand, parkAt = null }: { data: FlightData; stops: Stop[]; pts: [number, number][]; d: string; onLand: () => void; parkAt?: number | null }) {
  const path = useRef<SVGPathElement>(null);
  // parkAt (editor): start already landed at that stop, postcard open
  const [leg, setLeg] = useState(parkAt ?? 0);            // flying towards pts[leg+1]
  const [atStop, setAtStop] = useState<number | null>(parkAt);
  const [plane, setPlane] = useState(() => { const p = pts[parkAt == null ? 0 : parkAt + 1] ?? pts[0]; return { x: p[0], y: p[1], a: 0 }; });
  const [drawn, setDrawn] = useState(0);
  const [vp, setVp] = useState({ w: 1000, h: 700 });
  const lens = useRef<number[]>([]);

  useEffect(() => {
    const f = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    f(); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f);
  }, []);

  // arc length at each stop
  useEffect(() => {
    const p = path.current; if (!p) return;
    const total = p.getTotalLength(), out: number[] = [];
    let k = 0;
    for (let L = 0; L <= total && k < pts.length; L += 2) {
      const q = p.getPointAtLength(L);
      if (Math.hypot(q.x - pts[k][0], q.y - pts[k][1]) < 3) { out.push(L); k++; }
    }
    while (out.length < pts.length) out.push(total);
    out[0] = 0; out[pts.length - 1] = total;
    lens.current = out;
    if (parkAt != null) setDrawn(out[parkAt + 1] ?? 0); // parked: route drawn up to this stop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pts, d]);

  // fly one leg
  useEffect(() => {
    if (atStop !== null) return;
    const p = path.current; if (!p || !lens.current.length) { const t = setTimeout(() => setLeg((l) => l), 50); return () => clearTimeout(t); }
    const from = lens.current[leg], to = lens.current[leg + 1];
    if (to === undefined) return;
    const dur = Math.max(1800, (to - from) * 4.2);
    let raf = 0; const t0 = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / dur), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      const L = from + (to - from) * e;
      const q = p.getPointAtLength(L), q2 = p.getPointAtLength(Math.min(L + 2, to));
      setPlane({ x: q.x, y: q.y, a: Math.atan2(q2.y - q.y, q2.x - q.x) * 180 / Math.PI });
      setDrawn(L);
      if (k < 1) raf = requestAnimationFrame(tick);
      else if (leg + 1 === pts.length - 1) setTimeout(onLand, 900);
      else setAtStop(leg);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [leg, atStop, pts.length, onLand]);

  const next = () => { setAtStop(null); setLeg((l) => l + 1); };

  // camera: keep plane centred, zoomed so the map feels big
  const scale = Math.max(vp.w / 900, vp.h / 620);
  // with a postcard open it covers the lower half — lift the stop into the free map above it, so its pin isn't hidden
  const tx = vp.w / 2 - plane.x * scale, ty = vp.h * (atStop !== null ? 0.26 : 0.5) - plane.y * scale;
  const cx = Math.min(0, Math.max(vp.w - MAP_W * scale, tx)), cy = atStop !== null ? ty : Math.min(0, Math.max(vp.h - MAP_H * scale, ty));
  const total = path.current?.getTotalLength() ?? 1;
  const s = atStop !== null ? stops[atStop] : null;

  return (
    <div className="fl-journey">
      <svg className="fl-map" width={MAP_W * scale} height={MAP_H * scale} viewBox={`0 0 ${MAP_W} ${MAP_H}`} style={{ transform: `translate(${cx}px, ${cy}px)`, transition: atStop !== null ? 'transform .5s ease' : undefined }}>
        <defs>
          <pattern id="flGrid" width="80" height="80" patternUnits="userSpaceOnUse"><path d="M80 0H0V80" fill="none" stroke="rgba(40,70,110,.08)" strokeWidth="2" /></pattern>
          <filter id="flRough"><feTurbulence baseFrequency=".02" numOctaves="3" seed="4" /><feDisplacementMap in="SourceGraphic" scale="14" /></filter>
        </defs>
        <rect width={MAP_W} height={MAP_H} className="fl-sea" />
        <rect width={MAP_W} height={MAP_H} fill="url(#flGrid)" />
        <g filter="url(#flRough)"><Land /></g>
        <g className="fl-compass" transform="translate(1480 860)"><circle r="54" /><path d="M0 -46 L10 0 L0 46 L-10 0Z" /><text y="-60">N</text></g>
        <path ref={path} d={d} className="fl-route-ghost" />
        <path d={d} className="fl-route-line" style={{ strokeDasharray: `${drawn} ${total}` }} />
        {pts.map(([x, y], i) => {
          const isEnd = i === pts.length - 1, isStart = i === 0;
          const label = isStart ? data.fromCode : isEnd ? data.toCode : (stops[i - 1].code || stops[i - 1].name.slice(0, 3)).toUpperCase();
          const reached = drawn >= (lens.current[i] ?? 1e9) - 1;
          return (
            <g key={i} transform={`translate(${x} ${y})`} className={`fl-pin ${reached ? 'on' : ''} ${isEnd ? 'end' : ''}`}>
              <circle r={isEnd ? 20 : 14} />
              {isEnd ? <text className="fl-heart" y="7">♥</text> : <circle r="5" className="dot" />}
              <text className="fl-code" y={-30}>{label}</text>
            </g>
          );
        })}
        <g transform={`translate(${plane.x} ${plane.y}) rotate(${plane.a})`} className="fl-plane-icon">
          <ellipse rx="26" ry="8" cy="18" className="shadow" />
          <path d="M-22 0 L10 -3 L22 0 L10 3Z M-4 -2 L6 -24 L12 -24 L6 -2Z M-4 2 L6 24 L12 24 L6 2Z M-20 -1 L-26 -10 L-21 -10 L-14 -1Z M-20 1 L-26 10 L-21 10 L-14 1Z" />
        </g>
      </svg>

      <div className="fl-hud">
        <span>✈︎ {data.flightNo}</span>
        <span>{data.fromCode} → {data.toCode}</span>
        <span className="alt">ӨНДӨР 10,000 м · буудал {Math.min(leg + 1, stops.length)}/{stops.length}</span>
      </div>

      {s && (
        <div className="fl-postcard-wrap">
          <div className={`fl-postcard ${s.photo ? '' : 'no-photo'}`} key={atStop}>
            {s.photo && <div className="fl-pc-photo" data-field={`stopPhotos.${s.i}`}><PhotoImg src={s.photo} alt={s.name} /></div>}
            <div className="fl-pc-body">
              <div className={`fl-pc-stamp ${/\p{L}/u.test(s.code) || !s.code ? '' : 'emo'}`} data-field={`stopCodes.${s.i}`}>{(s.code || s.name.slice(0, 3)).toUpperCase()}</div>
              <small>{atStop! + 1}-р буудал{s.date && <> · <span data-field={`stopDates.${s.i}`}>{s.date}</span></>}</small>
              <h2 data-field={`stopNames.${s.i}`}>{s.name}</h2>
              <p data-field={`stopNotes.${s.i}`}>{s.note}</p>
              <button className="fl-btn sm" onClick={next}>{atStop! + 1 === stops.length ? 'Газардахаар ✈︎' : 'Нислэгээ үргэлжлүүлэх ✈︎'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PhotoImg({ src, alt }: { src: string; alt?: string }) {
  const [bad, setBad] = useState(false);
  return bad ? <span>♥</span> : <img src={src} alt={alt || 'хайрын зураг'} onError={() => setBad(true)} />;
}
