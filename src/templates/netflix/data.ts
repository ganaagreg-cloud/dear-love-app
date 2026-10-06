import type { Content } from '../types';

/** Episodes a gift can hold, slides per episode, and the one episode (3) that branches. */
export const MAX_EPISODES = 6;
export const MAX_SLIDES = 4;
export const BRANCH_EP = 3;
export const TOP_COUNT = 5;
export const TRAILER_MAX = 6;

export type Slide = { photo: string; caption: string; /** slot in the editor's lists (kept when empty slides are skipped) */ si: number };
export type Episode = { n: number; title: string; date: string; slides: Slide[] };
export type BranchSide = { label: string; photo: string; caption: string };
export type Branch = { prompt: string; a: BranchSide; b: BranchSide };
export type TopItem = { text: string; photo: string; i: number };

export type LoveData = {
  title: string; year: string; name1: string; name2: string; synopsis: string;
  profilePhoto: string;
  trailer: { src: string; i: number }[];
  episodes: Episode[];
  branch: Branch | null;
  top: TopItem[];
  final: { question: string; yes: string; yes2: string; no: string; no2: string };
  credits: { director: string; thanks: string[] };
  songName: string; music: string;
  /** In the editor (a pinned preview) nothing is skipped for being empty, and nothing autoplays. */
  editable: boolean;
};

const s = (v: unknown, d = '') => (typeof v === 'string' && v.trim() ? v.trim() : d);
const a = (v: unknown) => (Array.isArray(v) ? (v as unknown[]).map((x) => (typeof x === 'string' ? x : '')) : []);

/**
 * Flat editor content → what the screens draw. Old LoveFlix pages (keys like `occasion`, `ov.*`) simply have none of
 * the keys read here, so they fall back to the defaults instead of breaking.
 * `pinEp` = the episode number the editor is showing: it stays in the list even while empty.
 */
export function toLoveData(c: Content, editable = false, pinEp: number | null = null): LoveData {
  const episodes: Episode[] = [];
  for (let n = 1; n <= MAX_EPISODES; n++) {
    const photos = a(c[`ep${n}.photos`]), caps = a(c[`ep${n}.captions`]);
    const slides: Slide[] = Array.from({ length: MAX_SLIDES }, (_, si) => ({ photo: photos[si] || '', caption: caps[si]?.trim() || '', si }))
      .filter((x) => x.photo || x.caption);
    const title = s(c[`ep${n}.title`]), date = s(c[`ep${n}.date`]).replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$1.$2.$3');
    if (!title && !date && !slides.length && !(editable && pinEp === n)) continue;
    episodes.push({ n, title, date, slides: slides.length ? slides : [{ photo: '', caption: '', si: 0 }] });
  }

  const side = (k: 'a' | 'b'): BranchSide => ({ label: s(c[`branch.${k}.label`]), photo: s(c[`branch.${k}.photo`]), caption: s(c[`branch.${k}.caption`]) });
  const A = side('a'), B = side('b');
  const hasBranch = !!(A.label && B.label) && episodes.some((e) => e.n === BRANCH_EP);

  const texts = a(c['top.texts']), photos = a(c['top.photos']);
  const top = Array.from({ length: TOP_COUNT }, (_, i) => ({ text: texts[i]?.trim() || '', photo: photos[i] || '', i })).filter((t) => t.text || t.photo);

  return {
    title: s(c.title, 'Бидний түүх'),
    year: s(c.year, String(new Date().getFullYear())),
    name1: s(c.name1, 'Чи'), name2: s(c.name2),
    synopsis: s(c.synopsis),
    profilePhoto: s(c.profilePhoto),
    trailer: a(c.trailerPhotos).map((src, i) => ({ src, i })).filter((t) => t.src).slice(0, TRAILER_MAX),
    episodes,
    branch: hasBranch ? { prompt: s(c['branch.prompt'], 'Дараа нь юу хийх вэ?'), a: A, b: B } : null,
    top,
    final: {
      question: s(c['final.question'], '2-р улирал үргэлжлэх үү?'),
      yes: s(c['final.yes'], 'Тийм'), yes2: s(c['final.yes2'], 'За... асуу'),
      no: s(c['final.no'], 'Үгүй'), no2: s(c['final.no2'], '...за за, тийм 🙂'),
    },
    credits: { director: s(c['credits.director']), thanks: a(c['credits.thanks']).map((t) => t.trim()).filter(Boolean) },
    songName: s(c.songName), music: s(c.music),
    editable,
  };
}

/** Editor pins: 'gate' | 'intro' | 'home' | 'ep:<n>:<slide>' | 'branch' | 'branch:a' | 'branch:b' | 'finale' | 'credits'. */
export type View =
  | { name: 'gate' | 'intro' | 'home' | 'finale' | 'credits' }
  | { name: 'ep'; n: number; slide: number }
  | { name: 'branch'; pick: 'a' | 'b' | null };

export function parsePin(pin: string | number | null | undefined): View | null {
  if (typeof pin !== 'string') return null;
  if (pin === 'gate' || pin === 'intro' || pin === 'home' || pin === 'finale' || pin === 'credits') return { name: pin };
  if (pin === 'branch') return { name: 'branch', pick: null };
  if (pin === 'branch:a' || pin === 'branch:b') return { name: 'branch', pick: pin.slice(7) as 'a' | 'b' };
  const m = /^ep:(\d):(\d)$/.exec(pin);
  return m ? { name: 'ep', n: Number(m[1]), slide: Number(m[2]) } : null;
}

export const initial = (name: string) => (name.trim()[0] ?? '♥').toUpperCase();
