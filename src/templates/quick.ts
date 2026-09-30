/**
 * Quick create: the 4-step default flow (names → photos → tone → publish).
 *
 * Every template ships a `QuickSpec` (src/templates/<id>/quick.ts) that turns the four
 * answers into a content patch for its own schema. The patch still goes through the
 * normal save path (PATCH → sanitizeContent), so nothing here is a security boundary.
 */
import type { Content } from './types';

export type Tone = 'cute' | 'romantic' | 'funny' | 'simple';
export type Pin = string | number | null;

export type QuickInput = {
  them: string;
  you: string;
  /** ISO YYYY-MM-DD, or '' when skipped. */
  date: string;
  photos: string[];
  tone: Tone;
  /** «Өөрөө бичих»: the buyer's own main message, replacing the tone's. */
  message?: string;
};

export type QuickSpec = {
  /** How many photos this template can place (the uploader stops there). */
  maxPhotos: number;
  /** Preview scene to pin while each quick step is open. */
  pins: { names: Pin; photos: Pin; tone: Pin };
  /** Pull the current answers back out of saved content (so the flow can be reopened). */
  read: (c: Content) => Pick<QuickInput, 'them' | 'you' | 'date' | 'photos'>;
  names: (q: QuickInput) => Content;
  photos: (q: QuickInput) => Content;
  /** Fill every text the template shows, for the chosen tone. */
  texts: (q: QuickInput) => Content;
  /** Content key holding the main message — what «Өөрөө бичих» edits. */
  messageKey: string;
};

export const TONES: { id: Tone; label: string; emoji: string; blurb: string }[] = [
  { id: 'cute', label: 'Хөөрхөн', emoji: '🧸', blurb: 'Эелдэг, дулаахан, бага зэрэг ичимхий.' },
  { id: 'romantic', label: 'Романтик', emoji: '🌹', blurb: 'Сэтгэл хөдөлгөм, гүн гүнзгий үгс.' },
  { id: 'funny', label: 'Хөгжилтэй', emoji: '😆', blurb: 'Инээд, хошигнол, дотоод онигоо.' },
  { id: 'simple', label: 'Энгийн', emoji: '🤍', blurb: 'Богинохон, цэвэрхэн, илүү үггүй.' },
];

/* ── dates ── */
export const isoOk = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d);
/** 2024-01-10 → 2024.01.10 */
export const dots = (d: string) => (isoOk(d) ? d.replace(/-/g, '.') : '');
/** 2024-01-10 → 10 · 01 · 24 */
export const dmy = (d: string) => (isoOk(d) ? `${d.slice(8, 10)} · ${d.slice(5, 7)} · ${d.slice(2, 4)}` : '');
/** Whole days together, counting the first day as day 1 (same as the templates' counters). */
export const daysSince = (d: string) => {
  const t = Date.parse(d + 'T00:00:00');
  return isoOk(d) && Number.isFinite(t) ? Math.max(1, Math.floor((Date.now() - t) / 864e5) + 1) : 0;
};

export const str = (v: unknown) => (typeof v === 'string' ? v : '');
export const arr = (v: unknown) => (Array.isArray(v) ? (v as unknown[]).map(str) : []);
/** Fixed-length array: `items` first, then ''. */
export const pad = (items: string[], n: number) => Array.from({ length: n }, (_, i) => items[i] ?? '');
export const clip = (s: string, max: number) => ([...s].length > max ? [...s].slice(0, max).join('') : s);

/* ── shared tone copy ── */

export type Memory = { title: string; note: string };

/** 12 memories per tone — titles ≤ 22 chars, notes ≤ 160 (the tightest limits across templates). */
export const MEMORIES: Record<Tone, Memory[]> = {
  cute: [
    { title: 'Анхны «сайн уу»', note: 'Тэр өдөр чи инээмсэглэхэд зүрх минь жаахан үсэрсэн. Одоо ч үсэрсээр.' },
    { title: 'Анхны болзоо', note: 'Би их сандарсан. Чи бүр илүү сандарсан. Хоёулаа хөөрхөн байсан.' },
    { title: 'Хамтдаа идсэн хоол', note: 'Чи сүүлийн хэсгээ надад өгсөн. Энэ бол жинхэнэ хайр.' },
    { title: 'Бяцхан аялал', note: 'Зам буруу, цаг агаар муу. Гэхдээ чи хажууд байсан болохоор төгс.' },
    { title: 'Тэнэг зураг', note: 'Энэ зургийг хараад л инээд хүрдэг. Чамайг бодохоор ч гэсэн.' },
    { title: 'Чиний инээд', note: 'Дэлхий дээрх миний хамгийн дуртай дуу.' },
    { title: 'Шөнийн яриа', note: 'Цаг хэд болсныг мартчихдаг тэр урт яриануудад баярлалаа.' },
    { title: 'Бороотой өдөр', note: 'Шүхэргүй байсан ч бид хоёр л дулаахан байсан.' },
    { title: 'Гэнэтийн бэлэг', note: 'Чи намайг гайхшруулах дуртай. Би ч бас чамайг.' },
    { title: 'Энгийн нэг өдөр', note: 'Юу ч болоогүй мөртлөө хамгийн сайхан өдөр байсан. Учир нь чи байсан.' },
    { title: 'Бидний дуу', note: 'Энэ дуу эгшиглэх бүрт би чамайг л боддог.' },
    { title: 'Яг одоо', note: 'Одоо ч гэсэн чи миний хамгийн дуртай хүн хэвээрээ.' },
  ],
  romantic: [
    { title: 'Анх харсан мөч', note: 'Чамайг анх харсан тэр мөчөөс ертөнц арай өөрөөр эргэж эхэлсэн.' },
    { title: 'Анхны болзоо', note: 'Бид удаан ярилцсан. Тэр орой хэзээ ч дуусаасай гэж би хүсээгүй.' },
    { title: 'Гараа атгасан өдөр', note: 'Чиний гар миний гарт яг л зориулж хийсэн юм шиг таарсан.' },
    { title: 'Нар жаргах үе', note: 'Тэнгэр улайж, чи мөрөн дээр минь толгойгоо тавьсан. Тэр мөчийг би цээжилсэн.' },
    { title: 'Хамтдаа аялсан нь', note: 'Хаашаа ч явсан чамтай бол гэртээ байгаа юм шиг.' },
    { title: 'Чиний инээмсэглэл', note: 'Хэцүү өдөр ч чиний инээмсэглэл бүгдийг засчихдаг.' },
    { title: 'Оддын доор', note: 'Бид оддыг тоолж чадаагүй. Харин би чамайг хэр их хайрладгаа мэдсэн.' },
    { title: 'Анхны «хайртай»', note: 'Чи үүнийг хэлэхэд би амьсгалахаа ч мартчихсан.' },
    { title: 'Чимээгүй мөч', note: 'Юу ч хэлэлгүй хамт суухад л хангалттай байдаг нь гайхалтай.' },
    { title: 'Бидний гэр', note: 'Гэр гэдэг газар биш, чи юм байна.' },
    { title: 'Хэцүү өдөр', note: 'Тэр өдөр чи намайг орхиогүй. Би үүнийг хэзээ ч мартахгүй.' },
    { title: 'Бидний маргааш', note: 'Ирээдүйгээ бодох бүрт би үргэлж чамайг л хардаг.' },
  ],
  funny: [
    { title: 'Анхны «сайн уу»', note: 'Би дажгүй харагдах гэж хичээсэн. Бүтээгүй. Гэхдээ чи ямар ч байсан үлдсэн.' },
    { title: 'Анхны болзоо', note: 'Юу захиалснаа мартчихсан. Чамайг харсаар байгаад л.' },
    { title: 'Хоолны төлөө', note: 'Чи хоолоо хэнтэй ч хуваалцдаггүй. Надтай л хуваалцдаг. Энэ бол нотолгоо.' },
    { title: 'Төөрсөн аялал', note: 'Навигац «зөв» гэсэн. Навигац худлаа хэлсэн. Гэхдээ хамгийн хөгжилтэй өдөр.' },
    { title: 'Тэнэг зураг', note: 'Энэ зургийг хэн нэгэнд үзүүлбэл бид хоёулаа нэр хүндээ алдана.' },
    { title: 'Чиний инээд', note: 'Миний тэнэг хошигнолд инээдэг цорын ганц хүн чи. Битгий боль.' },
    { title: 'Шөнийн зууш', note: 'Шөнийн 2 цагт «өлсөж байна» гэхэд чи үг дуугүй хөргөгч рүү явсан.' },
    { title: 'Кино үзсэн орой', note: 'Кино юу байсныг санахгүй байна. Чи 10 минутын дараа унтчихсан.' },
    { title: 'Бяцхан маргаан', note: 'Хэн зөв байсан нь чухал биш. (Би зөв байсан.)' },
    { title: 'Хамтдаа тоглосон нь', note: 'Чи хожигдохдоо муу. Би хожихдоо бүр муу. Төгс хос.' },
    { title: 'Бидний дуу', note: 'Бид хоёулаа үгийг нь буруу дуулдаг. Гэхдээ их чанга.' },
    { title: 'Яг одоо', note: 'Чамайг тэвчиж, хайрлаж, хоолыг чинь идсээр л байна.' },
  ],
  simple: [
    { title: 'Анхны уулзалт', note: 'Бид анх уулзсан өдөр.' },
    { title: 'Анхны болзоо', note: 'Хамтдаа өнгөрүүлсэн анхны орой.' },
    { title: 'Хамтдаа', note: 'Энгийн өдөр, хамгийн сайхан хүнтэй.' },
    { title: 'Аялал', note: 'Хамтдаа очсон газар, хамтдаа харсан зүйлс.' },
    { title: 'Инээд', note: 'Чиний инээд миний өдрийг гэрэлтүүлдэг.' },
    { title: 'Дурсамж', note: 'Мартагдашгүй нэгэн мөч.' },
    { title: 'Орой', note: 'Урт яриа, халуун цай.' },
    { title: 'Амралтын өдөр', note: 'Яарах юмгүй, зөвхөн бид хоёр.' },
    { title: 'Бэлэг', note: 'Жижигхэн ч их утгатай.' },
    { title: 'Бидний газар', note: 'Бидний дуртай газар.' },
    { title: 'Дуу', note: 'Бидний дуу.' },
    { title: 'Өнөөдөр', note: 'Одоо ч гэсэн хамтдаа.' },
  ],
};

type Lines = {
  /** One short line — covers, captions, taglines. */
  tagline: string;
  question: string;
  /** Two answer buttons, each ≤ 12 chars. */
  yes: [string, string];
  /** Opening greeting, `them` is the recipient. */
  hello: (them: string) => string;
  /** The main message. `days` = 0 when no date was given. */
  message: (them: string, you: string, days: number) => string;
  signoff: string;
};

export const LINES: Record<Tone, Lines> = {
  cute: {
    tagline: 'миний хамгийн дуртай хүнд',
    question: 'Надтай үргэлж хамт байх уу?',
    yes: ['ТИЙМ ♥', 'МЭДЭЭЖ!'],
    hello: (t) => `Сайн уу, ${t}! Энэ бол чамд зориулсан бяцхан бэлэг.`,
    message: (t, _y, d) => `${t}, чи миний өдөр бүрийг хөөрхөн болгодог.${d ? `\nХамтдаа ${d} өдөр — нэг ч өдөр уйдсангүй.` : ''}\nЧамдаа маш их хайртай шүү.`,
    signoff: 'Хайртай,',
  },
  romantic: {
    tagline: 'миний хамгийн гоё түүх бол бид',
    question: 'Энэ түүхийг надтай хамт үргэлжлүүлэх үү?',
    yes: ['ТИЙМ ♥', 'ҮҮРД'],
    hello: (t) => `${t}, энэ бол бидний түүх. Нэг нэгээр нь хамт дурсъя.`,
    message: (t, _y, d) => `${t}, чамтай танилцсан нь миний амьдралын хамгийн сайхан санамсаргүй тохиолдол.${d ? `\n${d} өдөр өнгөрчээ. Би өдөр бүр чамайг л дахин сонгосон.` : '\nБи өдөр бүр чамайг л дахин сонгох болно.'}\nЧи бол миний гэр.`,
    signoff: 'Үүрд чинийх,',
  },
  funny: {
    tagline: 'намайг тэвчдэг цорын ганц хүнд',
    question: 'Намайг цаашид ч тэвчих үү?',
    yes: ['ТИЙМ ДЭЭ', 'ЗА ЗА ♥'],
    hello: (t) => `Анхаар, ${t}! Энэ бэлэг маш их хайр, бага зэрэг тэнэглэл агуулсан.`,
    message: (t, _y, d) => `${t}, чи миний хошигнолд инээдэг, хоолоо надтай хуваалцдаг.${d ? `\n${d} өдөр намайг тэвчсэнд баярлалаа.` : '\nНамайг тэвчдэгт баярлалаа.'}\nЧамгүйгээр би хэнтэй ч хэрэлдэхгүй байх байсан. Хайртай!`,
    signoff: 'Чиний тэнэг,',
  },
  simple: {
    tagline: 'чамд зориулав',
    question: 'Үргэлж хамт байх уу?',
    yes: ['ТИЙМ', 'ТИЙМ ♥'],
    hello: (t) => `Сайн уу, ${t}. Энэ чамд.`,
    message: (t, _y, d) => `${t}, хажууд минь байдагт баярлалаа.${d ? `\nХамтдаа ${d} өдөр.` : ''}\nХайртай.`,
    signoff: 'Хайртай,',
  },
};

/** Memories for n slots — cycles the tone's 12 if a template ever asks for more. */
export const memories = (tone: Tone, n: number) => Array.from({ length: n }, (_, i) => MEMORIES[tone][i % MEMORIES[tone].length]);
