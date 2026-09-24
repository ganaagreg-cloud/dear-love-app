/** Pixel sprites as strings. '.' = transparent. Colours come from a palette map. */
export type Palette = Record<string, string>;

const GIRL_TOP = [
  '..hhhhhh..',
  '.hhhhhhhh.',
  'hhhhhhhhhh',
  'hhsssssshh',
  'hhsesseshh',
  'hhcsssschh',
  'hhhsssshhh',
  '.hddddddh.',
  '.sdddddds.',
  '.sdDDDDds.',
  '..dDDDDd..',
  '.dddddddd.',
  'dddddddddd',
];
const GIRL_LEGS = [
  ['...l..l...', '...l..l...', '..kk..kk..'],
  ['..l....l..', '..l....l..', '.kk....kk.'],
];

const BOY_TOP = [
  '...hhhh...',
  '.hhhhhhhh.',
  '.hhhhhhhh.',
  '.hssssssh.',
  '.sesssses.',
  '.scsssscs.',
  '..ssssss..',
  '..dddddd..',
  '.sdddddds.',
  '.sdDDDDds.',
  '..dddddd..',
  '..pppppp..',
];
const BOY_LEGS = [
  ['..pp..pp..', '..pp..pp..', '..pp..pp..', '.kkk..kkk.'],
  ['.pp....pp.', '.pp....pp.', '.pp....pp.', 'kkk....kkk'],
];

export const HEART = [
  '.RR.RR.',
  'RwRRRRR',
  'RRRRRRR',
  '.RRRRR.',
  '..RRR..',
  '...R...',
];

export const CHEST_LID = [
  '..bbbbbbbbbb..',
  '.bBBBBBBBBBBb.',
  'bBBBBBBBBBBBBb',
  'gggggggggggggg',
];
export const CHEST_BODY = [
  'bBBBBBggBBBBBb',
  'bBBBBByyBBBBBb',
  'bBBBBBBBBBBBBb',
  'bBBBBBBBBBBBBb',
  'bBBBBBBBBBBBBb',
  'gggggggggggggg',
  '.bbbbbbbbbbbb.',
];
export const CHEST_PAL: Palette = { b: '#5e3620', B: '#a8683c', g: '#f5c451', y: '#fff3b0' };

export function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c + (amt < 0 ? c * amt : (255 - c) * amt))));
  const r = f(n >> 16), g = f((n >> 8) & 255), b = f(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export function characterRows(look: 'girl' | 'boy', frame: 0 | 1) {
  return look === 'girl' ? [...GIRL_TOP, ...GIRL_LEGS[frame]] : [...BOY_TOP, ...BOY_LEGS[frame]];
}

export function characterPalette(look: 'girl' | 'boy', outfit: string): Palette {
  return {
    h: look === 'girl' ? '#5b3426' : '#2d2230',
    s: '#ffd9b8', e: '#2a1a22', c: '#ff9fb2', l: '#ffd9b8', k: '#3b2640',
    d: outfit, D: shade(outfit, -0.25), p: '#3b4a8c',
  };
}

export function makeSprite(rows: string[], pal: Palette): HTMLCanvasElement {
  const w = Math.max(...rows.map((r) => r.length)), h = rows.length;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d')!;
  rows.forEach((row, j) => [...row].forEach((ch, i) => {
    if (ch === '.' || !pal[ch]) return;
    x.fillStyle = pal[ch]; x.fillRect(i, j, 1, 1);
  }));
  return c;
}
