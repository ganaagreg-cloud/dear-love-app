'use client';
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { Chip } from './audio';
import {
  CHEST_BODY, CHEST_LID, CHEST_PAL, HEART, characterPalette, characterRows, makeSprite, shade,
} from './sprites';

export type Look = 'girl' | 'boy';
export type QuestData = {
  title: string; subtitle: string;
  playerName: string; playerLook: Look; playerColor: string;
  npcName: string; npcLook: Look; npcColor: string;
  consoleColor: string; startDate: string;
  intro: string;
  memories: { src: string; title: string; text: string }[];
  npcGreeting: string; question: string; yesA: string; yesB: string;
  ending: string; music: string;
};

/* ── world constants (GBA-ish 240×160) ── */
const W = 240, H = 160, GROUND = 132, WORLD = 1520, NPC_X = 1440;
const CHEST_X = [210, 450, 690, 930, 1170];
const SPEED = 72, GRAV = 520, JUMP = 178;

type Particle = { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; size: number; heart?: boolean; grav?: number };
type Rocket = { x: number; y: number; vy: number; color: string };
type Game = {
  t: number; px: number; py: number; vy: number; dir: 1 | -1; moving: boolean; walkT: number;
  hearts: { x: number; y: number; got: boolean }[];
  chests: { x: number; open: boolean; openT: number }[];
  parts: Particle[]; rockets: Rocket[];
  score: number; found: number; frozen: boolean; final: boolean; won: boolean; wonT: number; cam: number;
};

type Dlg = { name: string; text: string; photo?: string; badge?: string };
type Mode = 'title' | 'play' | 'dialog' | 'choice' | 'win';

const FONT = '"Press Start 2P", monospace';
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const hex = (h: string) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const mix = (a: string, b: string, t: number) => {
  const A = hex(a), B = hex(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * clamp(t, 0, 1))).join(',')})`;
};
const at3 = (p: number, d: string, s: string, n: string) => (p < 0.5 ? mix(d, s, p / 0.5) : mix(s, n, (p - 0.5) / 0.5));
const rng = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

function newGame(): Game {
  const hearts: Game['hearts'] = [];
  for (let x = 90; x < NPC_X - 60; x += 26) {
    if (CHEST_X.some((c) => Math.abs(c - x) < 26)) continue;
    const k = (x / 26) % 6;
    hearts.push({ x, y: 8 + Math.round(Math.abs(Math.sin(k)) * 18), got: false });
  }
  return {
    t: 0, px: 36, py: 0, vy: 0, dir: 1, moving: false, walkT: 0, hearts,
    chests: CHEST_X.map((x) => ({ x, open: false, openT: 0 })), parts: [], rockets: [],
    score: 0, found: 0, frozen: false, final: false, won: false, wonT: 0, cam: 0,
  };
}

export default function Quest({ data }: { data: QuestData }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const game = useRef<Game>(newGame());
  const chip = useRef<Chip | null>(null);
  const song = useRef<HTMLAudioElement | null>(null);
  const keys = useRef({ l: false, r: false });

  const [mode, _setMode] = useState<Mode>('title');
  const modeRef = useRef<Mode>('title');
  const setMode = (m: Mode) => { modeRef.current = m; _setMode(m); };

  const [dlg, setDlg] = useState<Dlg | null>(null);
  const [typed, setTyped] = useState(0);
  const queue = useRef<{ list: Dlg[]; i: number; done?: () => void }>({ list: [], i: 0 });
  const [choice, _setChoice] = useState(0);
  const choiceRef = useRef(0);
  const setChoice = (c: number) => { choiceRef.current = c; _setChoice(c); };
  const [muted, setMuted] = useState(false);
  const [winCard, setWinCard] = useState(false);

  const total = data.memories.length;
  const days = (() => {
    const s = Date.parse(data.startDate + 'T00:00:00');
    return Number.isFinite(s) ? Math.max(1, Math.floor((Date.now() - s) / 864e5) + 1) : 0;
  })();
  const fill = useCallback((s: string) => s
    .replace(/\{player\}/g, data.playerName || 'чи')
    .replace(/\{npc\}/g, data.npcName || 'би')
    .replace(/\{days\}/g, String(days)), [data.playerName, data.npcName, days]);

  /* ── dialog engine ── */
  const openDialog = useCallback((list: Dlg[], done?: () => void) => {
    queue.current = { list, i: 0, done };
    game.current.frozen = true;
    setDlg(list[0]); setTyped(0); setMode('dialog');
  }, []);
  useEffect(() => {
    if (!dlg) return;
    if (typed >= dlg.text.length) return;
    const id = setTimeout(() => {
      setTyped((n) => n + 1);
      if (typed % 3 === 0) chip.current?.sfx('blip');
    }, /[.,!?]/.test(dlg.text[typed - 1] ?? '') ? 140 : 26);
    return () => clearTimeout(id);
  }, [dlg, typed]);
  const advance = () => {
    if (!dlg) return;
    if (typed < dlg.text.length) { setTyped(dlg.text.length); return; }
    const q = queue.current;
    q.i++;
    if (q.i < q.list.length) { setDlg(q.list[q.i]); setTyped(0); chip.current?.sfx('select'); return; }
    setDlg(null);
    if (q.done) q.done();
    else { game.current.frozen = false; setMode('play'); }
  };

  /* ── audio ── */
  const startAudio = () => {
    chip.current ??= new Chip();
    chip.current.init();
    chip.current.sfx('start');
    if (data.music) {
      song.current ??= Object.assign(new Audio(data.music), { loop: true, volume: 0.6 });
      song.current.muted = muted;
      song.current.play().catch(() => chip.current?.startMusic());
    } else chip.current.startMusic();
  };
  const toggleMute = () => {
    const m = !muted; setMuted(m);
    chip.current?.setMuted(m);
    if (song.current) song.current.muted = m;
  };
  useEffect(() => () => { chip.current?.close(); song.current?.pause(); }, []);

  /* ── game actions ── */
  const start = () => {
    startAudio();
    game.current = newGame();
    setWinCard(false);
    openDialog([
      { name: '♥ АЯЛАЛ', text: fill(data.intro) },
      { name: '♥ АЯЛАЛ', text: '◀ ▶ товчоор алхаж, A товчоор үсэрнэ. Эрдэнэсийн авдар бүрийг нээгээрэй!' },
    ]);
  };
  const jump = () => {
    const g = game.current;
    if (g.frozen || g.py > 0.5) return;
    g.vy = JUMP; chip.current?.sfx('jump');
  };
  const pick = (i: number) => {
    const g = game.current;
    chip.current?.sfx('win');
    g.won = true; g.wonT = 0;
    setMode('win');
    setTimeout(() => setWinCard(true), 2600);
    void i;
  };
  const pressA = () => {
    const m = modeRef.current;
    if (m === 'title') start();
    else if (m === 'dialog') advance();
    else if (m === 'choice') pick(choiceRef.current);
    else if (m === 'play') jump();
  };
  const pressStart = () => {
    const m = modeRef.current;
    if (m === 'title') start();
    else if (m === 'win' && winCard) { game.current = newGame(); setWinCard(false); setMode('title'); }
    else if (m === 'dialog') advance();
  };
  const dir = (d: -1 | 1) => {
    if (modeRef.current === 'choice') { setChoice(d < 0 ? 0 : 1); chip.current?.sfx('blip'); }
  };

  // latest handlers for listeners / game loop
  const h = useRef({ pressA, pressStart, dir, openDialog, fill });
  h.current = { pressA, pressStart, dir, openDialog, fill };

  /* ── keyboard ── */
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' '].includes(k)) e.preventDefault();
      if (k === 'arrowleft' || k === 'a') { keys.current.l = true; h.current.dir(-1); }
      if (k === 'arrowright' || k === 'd') { keys.current.r = true; h.current.dir(1); }
      if ((k === ' ' || k === 'z' || k === 'arrowup' || k === 'w' || k === 'x') && !e.repeat) h.current.pressA();
      if (k === 'enter' && !e.repeat) h.current.pressStart();
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'arrowleft' || k === 'a') keys.current.l = false;
      if (k === 'arrowright' || k === 'd') keys.current.r = false;
    };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  /* ── render loop ── */
  useEffect(() => {
    const cv = canvas.current!; const ctx = cv.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    const sp = {
      p: [0, 1].map((f) => makeSprite(characterRows(data.playerLook, f as 0 | 1), characterPalette(data.playerLook, data.playerColor))),
      n: [0, 1].map((f) => makeSprite(characterRows(data.npcLook, f as 0 | 1), characterPalette(data.npcLook, data.npcColor))),
      heart: makeSprite(HEART, { R: '#ff4d6d', w: '#ffffff' }),
      heartGold: makeSprite(HEART, { R: '#ffcf4d', w: '#ffffff' }),
      lid: makeSprite(CHEST_LID, CHEST_PAL), body: makeSprite(CHEST_BODY, CHEST_PAL),
    };
    const R = rng(7);
    const stars = Array.from({ length: 70 }, () => ({ x: R() * W, y: R() * 100, s: R() * 6 }));
    const trees = Array.from({ length: 26 }, (_, i) => ({ x: 40 + i * 58 + Math.round(R() * 30), r: 6 + Math.round(R() * 4) }));
    const flowers = Array.from({ length: 120 }, () => ({ x: Math.round(R() * WORLD), c: ['#ff7aa2', '#fff07a', '#ffffff', '#c7a3ff'][Math.floor(R() * 4)] }));
    const clouds = Array.from({ length: 7 }, (_, i) => ({ x: i * 90 + R() * 40, y: 14 + R() * 34, s: 0.8 + R() * 0.6 }));

    const disc = (cx: number, cy: number, r: number, color: string) => {
      ctx.fillStyle = color;
      for (let y = -r; y <= r; y++) { const w = Math.floor(Math.sqrt(r * r - y * y)); ctx.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1); }
    };
    const burst = (x: number, y: number, n: number, colors: string[], opts: Partial<Particle> = {}) => {
      const g = game.current;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, v = 20 + Math.random() * 60;
        g.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30, life: 0, max: 0.8 + Math.random() * 0.8,
          color: colors[i % colors.length], size: Math.random() < 0.3 ? 2 : 1, grav: 60, ...opts });
      }
    };

    let raf = 0, last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const g = game.current, m = modeRef.current;
      g.t += dt;

      /* update */
      if (m === 'play' && !g.frozen) {
        const vx = (keys.current.r ? 1 : 0) - (keys.current.l ? 1 : 0);
        g.moving = vx !== 0;
        if (vx) g.dir = vx > 0 ? 1 : -1;
        g.px = clamp(g.px + vx * SPEED * dt, 10, NPC_X - 14);
        if (g.moving) g.walkT += dt;
      } else g.moving = false;
      g.vy -= GRAV * dt; g.py += g.vy * dt;
      if (g.py <= 0) { g.py = 0; g.vy = 0; }

      if (m === 'play') {
        for (const hh of g.hearts) {
          if (!hh.got && Math.abs(hh.x - g.px) < 7 && Math.abs(hh.y - (g.py + 8)) < 11) {
            hh.got = true; g.score++; chip.current?.sfx('coin');
            burst(hh.x, GROUND - hh.y, 8, ['#ff4d6d', '#ffffff'], { grav: 20 });
          }
        }
        g.chests.forEach((c, i) => {
          if (!c.open && Math.abs(c.x - g.px) < 10 && g.py < 10) {
            c.open = true; g.found++; chip.current?.sfx('chest');
            burst(c.x, GROUND - 10, 36, ['#ffe27a', '#ffffff', '#ff8fb8']);
            const mem = data.memories[i];
            h.current.openDialog([{ name: mem.title || `Дурсамж ${i + 1}`, text: h.current.fill(mem.text), photo: mem.src, badge: `ДУРСАМЖ ${i + 1}/${total}` }]);
          }
        });
        if (!g.final && g.px >= NPC_X - 16) {
          if (g.found < total) {
            g.px -= 24;
            h.current.openDialog([{ name: data.npcName || '???', text: `Хүлээгээрэй! Чамд олох ${total - g.found} дурсамж үлдсэн байна. Буцаад хайгаарай ♥`}]);
          } else {
            g.final = true;
            h.current.openDialog([
              { name: data.npcName || '???', text: h.current.fill(data.npcGreeting) },
              { name: data.npcName || '???', text: h.current.fill(data.question) },
            ], () => { setChoice(0); setMode('choice'); });
          }
        }
      }
      if (g.won) {
        g.wonT += dt;
        if (Math.random() < dt * 2.2) g.rockets.push({ x: g.cam + 30 + Math.random() * (W - 60), y: GROUND, vy: -110 - Math.random() * 40, color: ['#ff4d6d', '#ffd84d', '#7af0ff', '#c79bff', '#ffffff'][Math.floor(Math.random() * 5)] });
        if (Math.random() < dt * 1.4 && g.py === 0) g.vy = JUMP * 0.7;
      }
      g.rockets = g.rockets.filter((r) => {
        r.y += r.vy * dt; r.vy += 60 * dt;
        if (r.vy > -20) {
          const hearty = Math.random() < 0.4;
          burst(r.x, r.y, hearty ? 18 : 30, [r.color, '#ffffff'], { grav: 25, heart: hearty });
          return false;
        }
        return true;
      });
      g.parts = g.parts.filter((p) => { p.life += dt; p.vy += (p.grav ?? 60) * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.98; return p.life < p.max; });

      const target = m === 'title' ? (Math.sin(g.t * 0.08) * 0.5 + 0.5) * (WORLD - W) : g.px - 100;
      g.cam += (clamp(target, 0, WORLD - W) - g.cam) * (m === 'title' ? 1 : Math.min(1, dt * 6));
      const cam = Math.round(g.cam);

      /* progress drives time of day */
      const p = g.won ? 1 : m === 'title' ? cam / (WORLD - W) : clamp(g.px / NPC_X, 0, 1);
      const night = clamp((p - 0.55) / 0.45, 0, 1);

      /* sky */
      const grd = ctx.createLinearGradient(0, 0, 0, GROUND);
      grd.addColorStop(0, at3(p, '#79c5ff', '#ff8fa8', '#120d30'));
      grd.addColorStop(1, at3(p, '#dff5ff', '#ffd59a', '#4b2c70'));
      ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);
      stars.forEach((s) => {
        const a = night * (0.5 + 0.5 * Math.sin(g.t * 2 + s.s));
        if (a < 0.05) return;
        ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fillRect(Math.round(s.x), Math.round(s.y), 1, 1);
      });
      // sun sets, moon rises
      if (p < 0.8) { disc(186 - p * 40, 26 + p * 120, 11, mix('#fff3a6', '#ff9a5c', p * 1.4)); }
      if (night > 0) { const my = 110 - night * 80; disc(48, my, 9, '#fff6d8'); disc(53, my - 3, 8, mix('#2a1e52', '#1a1440', night)); }
      // clouds
      clouds.forEach((c) => {
        const x = ((c.x - cam * 0.25 + g.t * 4) % (W + 80) + W + 80) % (W + 80) - 40;
        const col = at3(p, '#ffffff', '#ffe3ec', '#6d5a9a');
        disc(x, c.y, 6 * c.s, col); disc(x + 8 * c.s, c.y - 3, 8 * c.s, col); disc(x + 17 * c.s, c.y, 6 * c.s, col);
      });
      // mountains
      const far = at3(p, '#9dc4ea', '#c98bb5', '#2b2052'), near = at3(p, '#6dbd78', '#b8738f', '#1e2a48');
      for (let sx = 0; sx < W; sx += 2) {
        const wx = sx + cam * 0.2;
        const hf = Math.round((34 + 16 * Math.sin(wx * 0.014) + 9 * Math.sin(wx * 0.037 + 1)) / 2) * 2;
        ctx.fillStyle = far; ctx.fillRect(sx, GROUND - 14 - hf, 2, hf + 14);
      }
      for (let sx = 0; sx < W; sx += 2) {
        const wx = sx + cam * 0.45;
        const hn = Math.round((16 + 9 * Math.sin(wx * 0.022) + 6 * Math.sin(wx * 0.061 + 2)) / 2) * 2;
        ctx.fillStyle = near; ctx.fillRect(sx, GROUND - hn, 2, hn);
      }
      // trees
      trees.forEach((t) => {
        const x = t.x - cam; if (x < -20 || x > W + 20) return;
        ctx.fillStyle = mix('#7a4a2e', '#3a2533', night); ctx.fillRect(x - 1, GROUND - 12, 3, 12);
        disc(x, GROUND - 14 - t.r, t.r, mix('#3f9e55', '#1f4a45', night));
        disc(x - 2, GROUND - 16 - t.r, t.r - 3, mix('#5fc46e', '#2a5f52', night));
      });
      // ground
      ctx.fillStyle = mix('#8b5a3c', '#3a2632', night); ctx.fillRect(0, GROUND, W, H - GROUND);
      ctx.fillStyle = mix('#5ec16a', '#2d6a4d', night); ctx.fillRect(0, GROUND, W, 4);
      ctx.fillStyle = mix('#7fd98a', '#3f8a63', night);
      for (let sx = -(cam % 4); sx < W; sx += 4) ctx.fillRect(sx, GROUND, 2, 1);
      ctx.fillStyle = mix('#6e4630', '#2c1d27', night);
      for (let sx = -(cam % 12); sx < W; sx += 12) { ctx.fillRect(sx + 3, GROUND + 9, 2, 1); ctx.fillRect(sx + 8, GROUND + 17, 1, 1); ctx.fillRect(sx + 1, GROUND + 22, 2, 1); }
      flowers.forEach((f) => { const x = f.x - cam; if (x < 0 || x > W) return; ctx.fillStyle = f.c; ctx.fillRect(x, GROUND - 1, 1, 1); });

      // night tint behind the characters
      if (night > 0) { ctx.fillStyle = `rgba(12,6,40,${0.22 * night})`; ctx.fillRect(0, 0, W, H); }

      // heart gate
      const gx = NPC_X - cam;
      if (gx > -60 && gx < W + 60) {
        const stone = '#efe2f7', dark = shade('#efe2f7', -0.25);
        [[gx - 30, 8], [gx + 22, 8]].forEach(([x, w]) => {
          ctx.fillStyle = stone; ctx.fillRect(x, GROUND - 46, w, 46);
          ctx.fillStyle = dark; ctx.fillRect(x + w - 2, GROUND - 46, 2, 46);
          for (let y = GROUND - 44; y < GROUND; y += 7) { ctx.fillStyle = '#ff8fb8'; ctx.fillRect(x + ((y / 7) % 2 ? 1 : 5), y, 2, 2); }
        });
        ctx.fillStyle = stone; ctx.fillRect(gx - 32, GROUND - 54, 64, 8);
        ctx.fillStyle = dark; ctx.fillRect(gx - 32, GROUND - 48, 64, 2);
        const pulse = 1 + Math.round(Math.sin(g.t * 4) * 0.5 + 0.5);
        ctx.drawImage(sp.heart, Math.round(gx - 3.5 * (pulse + 1)), GROUND - 58 - 6 * (pulse + 1), 7 * (pulse + 1), 6 * (pulse + 1));
        // npc
        const nb = g.won ? Math.abs(Math.sin(g.t * 5)) * 6 : 0;
        const nf = sp.n[Math.floor(g.t * 2) % 2 === 0 || !g.won ? 0 : 1];
        ctx.save(); ctx.translate(Math.round(gx + 5), Math.round(GROUND - 16 - nb)); ctx.scale(-1, 1); ctx.drawImage(nf, 0, 0); ctx.restore();
        if (!g.final) ctx.drawImage(sp.heart, Math.round(gx - 3), Math.round(GROUND - 26 + Math.sin(g.t * 3) * 2));
      }

      // collectibles
      g.hearts.forEach((hh) => {
        if (hh.got) return; const x = hh.x - cam; if (x < -8 || x > W + 8) return;
        ctx.drawImage(sp.heart, Math.round(x - 3), Math.round(GROUND - hh.y - 3 + Math.sin(g.t * 3 + hh.x) * 1.5));
      });
      g.chests.forEach((c) => {
        const x = Math.round(c.x - cam - 7); if (x < -20 || x > W + 20) return;
        if (!c.open) {
          ctx.drawImage(sp.body, x, GROUND - 7); ctx.drawImage(sp.lid, x, GROUND - 11 + (Math.sin(g.t * 5 + c.x) > 0.95 ? -1 : 0));
          if (Math.sin(g.t * 3 + c.x) > 0.6) { ctx.fillStyle = '#fff'; ctx.fillRect(x + 11, GROUND - 13, 1, 1); ctx.fillRect(x + 10, GROUND - 12, 3, 1); ctx.fillRect(x + 11, GROUND - 11, 1, 1); }
        } else {
          ctx.fillStyle = 'rgba(255,240,170,0.35)'; ctx.fillRect(x + 2, GROUND - 26, 10, 18);
          ctx.drawImage(sp.body, x, GROUND - 7); ctx.drawImage(sp.lid, x, GROUND - 15);
        }
      });

      // player
      if (m !== 'title') {
        const frame = g.moving && g.py === 0 ? (Math.floor(g.walkT * 8) % 2) : 0;
        const bob = g.moving && g.py === 0 && frame ? 1 : 0;
        ctx.save();
        ctx.translate(Math.round(g.px - cam) + (g.dir < 0 ? 5 : -5), Math.round(GROUND - 16 - g.py - bob));
        if (g.dir < 0) ctx.scale(-1, 1);
        ctx.drawImage(sp.p[frame], 0, 0);
        ctx.restore();
      }

      // win: heart between the two
      if (g.won) {
        const s = Math.min(4, 1 + g.wonT * 1.5), x = NPC_X - 8 - cam;
        ctx.drawImage(sp.heart, Math.round(x - 3.5 * s), Math.round(GROUND - 34 - 3 * s - Math.sin(g.t * 3) * 2), Math.round(7 * s), Math.round(6 * s));
      }
      // particles
      g.parts.forEach((pt) => {
        const a = 1 - pt.life / pt.max;
        if (pt.heart) { ctx.globalAlpha = a; ctx.drawImage(pt.color === '#ffd84d' ? sp.heartGold : sp.heart, Math.round(pt.x - cam - 3), Math.round(pt.y - 3)); ctx.globalAlpha = 1; return; }
        ctx.fillStyle = pt.color; ctx.globalAlpha = a;
        ctx.fillRect(Math.round(pt.x - cam), Math.round(pt.y), pt.size, pt.size);
        ctx.globalAlpha = 1;
      });
      g.rockets.forEach((r) => { ctx.fillStyle = r.color; ctx.fillRect(Math.round(r.x - cam), Math.round(r.y), 1, 3); });

      // HUD
      if (m !== 'title') {
        ctx.fillStyle = 'rgba(20,10,30,0.45)'; ctx.fillRect(0, 0, W, 13);
        ctx.drawImage(sp.heart, 4, 3);
        ctx.font = `8px ${FONT}`; ctx.textBaseline = 'top'; ctx.fillStyle = '#fff';
        ctx.fillText(`x${String(g.score).padStart(2, '0')}`, 13, 3);
        ctx.drawImage(sp.lid, W - 58, 3, 10, 3); ctx.drawImage(sp.body, W - 58, 6, 10, 5);
        ctx.fillText(`${g.found}/${total}`, W - 44, 3);
        if (days) { const s = `${days}-Р ӨДӨР`; ctx.fillStyle = '#ffd6e4'; ctx.fillText(s, Math.round(W / 2 - s.length * 4), 3); }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [data, total, days]);

  /* ── touch controls helpers ── */
  const hold = (k: 'l' | 'r') => ({
    onPointerDown: (e: React.PointerEvent) => { e.preventDefault(); (e.target as HTMLElement).setPointerCapture?.(e.pointerId); keys.current[k] = true; dir(k === 'l' ? -1 : 1); },
    onPointerUp: () => { keys.current[k] = false; },
    onPointerCancel: () => { keys.current[k] = false; },
    onPointerLeave: () => { keys.current[k] = false; },
  });
  const tap = (fn: () => void) => ({ onPointerDown: (e: React.PointerEvent) => { e.preventDefault(); fn(); } });

  const g = game.current;
  const heartsTotal = g.hearts.length;

  return (
    <div className="qs-root" style={{ '--console': data.consoleColor, '--console-dark': shade(data.consoleColor, -0.28), '--console-light': shade(data.consoleColor, 0.35) } as CSSProperties}>
      <div className="qs-floaties" aria-hidden>{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ '--i': i } as CSSProperties}>♥</i>)}</div>
      <div className="qs-console">
        <div className="qs-left">
          <div className="qs-dpad">
            <button className="up" aria-label="Үсрэх" {...tap(pressA)} />
            <button className="left" aria-label="Зүүн" {...hold('l')} />
            <button className="right" aria-label="Баруун" {...hold('r')} />
            <button className="down" aria-label="Доош" tabIndex={-1} />
            <span className="mid" />
          </div>
        </div>

        <div className="qs-bezel">
          <div className="qs-bezel-top"><span className="qs-led" /><span>DOT MATRIX WITH STEREO SOUND</span></div>
          <div className="qs-screen" onPointerDown={(e) => { if ((e.target as HTMLElement).closest('button')) return; if (mode === 'title' || mode === 'dialog') pressA(); }}>
            <canvas ref={canvas} width={W} height={H} />

            {mode === 'title' && (
              <div className="qs-title">
                <div className="qs-logo" data-text={data.title} style={{ fontSize: `min(13cqh, ${(86 / Math.max(6, [...data.title].length)).toFixed(2)}cqw)` }}>{data.title}</div>
                <div className="qs-sub">{data.subtitle}</div>
                <div className="qs-for">гол дүрд: {data.playerName || 'чи'}</div>
                <div className="qs-press">START ДАРНА УУ</div>
              </div>
            )}

            {dlg && (
              <>
                {dlg.photo !== undefined && <PixelPhoto key={dlg.photo || dlg.name} src={dlg.photo} />}
                <div className="qs-dialog">
                  {dlg.badge && <span className="qs-badge">{dlg.badge}</span>}
                  <span className="qs-name">{dlg.name}</span>
                  <p>{dlg.text.slice(0, typed)}{typed >= dlg.text.length && <b className="qs-next">▼</b>}</p>
                </div>
              </>
            )}

            {mode === 'choice' && (
              <div className="qs-dialog qs-choice">
                <span className="qs-name">{data.playerName || 'Чи'}</span>
                <div className="qs-options">
                  {[data.yesA, data.yesB].map((o, i) => (
                    <button key={i} className={choice === i ? 'on' : ''} onPointerEnter={() => setChoice(i)} onClick={() => { setChoice(i); pick(i); }}>
                      {choice === i ? '▶ ' : '  '}{o}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mode === 'win' && winCard && (
              <div className="qs-win">
                <div className="qs-logo small" data-text="ЯЛЛАА!">ЯЛЛАА!</div>
                <p className="qs-ending">{fill(data.ending)}</p>
                <div className="qs-stats">
                  <span>ДУРСАМЖ {g.found}/{total}</span>
                  <span>ЗҮРХ {g.score}/{heartsTotal}</span>
                  {days > 0 && <span>ХАМТДАА {days} ӨДӨР</span>}
                </div>
                <button className="qs-press" onClick={pressStart}>ДАХИН ТОГЛОХ — START</button>
              </div>
            )}
          </div>
          <div className="qs-brand"><b>LOVE</b> BOY <i>COLOR</i></div>
        </div>

        <div className="qs-right">
          <div className="qs-ab">
            <button className="b" aria-label="B" {...tap(pressA)}><span>B</span></button>
            <button className="a" aria-label="A" {...tap(pressA)}><span>A</span></button>
          </div>
        </div>

        <div className="qs-bottom">
          <button className="qs-pill" {...tap(toggleMute)}><i />{muted ? 'ДУУГҮЙ' : 'SELECT'}</button>
          <button className="qs-pill" {...tap(pressStart)}><i />START</button>
        </div>
        <div className="qs-speaker" aria-hidden>{Array.from({ length: 6 }, (_, i) => <i key={i} />)}</div>
      </div>
    </div>
  );
}

/** Photo that "de-pixelates" in, like a game loading a memory. */
function PixelPhoto({ src }: { src: string }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!src) return;
    const img = new Image();
    img.onerror = () => setFailed(true);
    let timer: ReturnType<typeof setInterval>;
    img.onload = () => {
      const c = cv.current; if (!c) return;
      const ratio = img.naturalHeight / img.naturalWidth;
      c.width = 320; c.height = Math.round(320 * Math.min(ratio, 1.25));
      const x = c.getContext('2d')!; x.imageSmoothingEnabled = false;
      const tmp = document.createElement('canvas'), tx = tmp.getContext('2d')!;
      const steps = [6, 10, 16, 26, 40, 64, 110];
      let i = 0;
      const draw = () => {
        if (i >= steps.length) { clearInterval(timer); setDone(true); return; }
        const w = steps[i++], hgt = Math.max(1, Math.round((w * c.height) / c.width));
        tmp.width = w; tmp.height = hgt;
        const s = Math.max(w / img.naturalWidth, hgt / img.naturalHeight);
        tx.drawImage(img, (w - img.naturalWidth * s) / 2, (hgt - img.naturalHeight * s) / 2, img.naturalWidth * s, img.naturalHeight * s);
        x.clearRect(0, 0, c.width, c.height); x.drawImage(tmp, 0, 0, c.width, c.height);
      };
      draw(); timer = setInterval(draw, 110);
    };
    img.src = src;
    return () => clearInterval(timer);
  }, [src]);
  return (
    <div className="qs-photo">
      {src && !failed ? (
        <>
          <canvas ref={cv} style={{ display: done ? 'none' : 'block' }} />
          {done && <img src={src} alt="" />}
        </>
      ) : <div className="qs-photo-empty">♥</div>}
    </div>
  );
}
