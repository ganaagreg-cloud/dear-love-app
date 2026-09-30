import { LINES, arr, clip, dots, memories, pad, str, type QuickSpec, type Tone } from '../quick';

const MAX = 6;
/** One stop per photo (3 at least, so the flight still has a route), or 5 text-only stops. */
const stopCount = (photos: number) => (photos ? Math.max(3, Math.min(MAX, photos)) : 5);

const LANDING: Record<Tone, { title: string; seat: string; cabin: string }> = {
  cute: { title: 'Зүрхэнд тавтай морил', seat: 'Миний хажууд', cabin: 'Тэврэлтийн зэрэг' },
  romantic: { title: 'Үүрдэд тавтай морил', seat: 'Миний хажууд', cabin: 'Нэгдүгээр зэрэг' },
  funny: { title: 'Амжилттай газардлаа (арай л)', seat: 'Цонхны тал', cabin: 'Зуушны зэрэг' },
  simple: { title: 'Тавтай морил', seat: 'Хажууд', cabin: 'Нэгдүгээр зэрэг' },
};

export const flightQuick: QuickSpec = {
  maxPhotos: MAX,
  pins: { names: 'pass', photos: 'fly', tone: 'land' },
  messageKey: 'finalMessage',
  read: (c) => ({ them: str(c.passenger), you: str(c.captain), date: '', photos: arr(c.stopPhotos).filter(Boolean) }),
  names: (q) => ({
    passenger: clip(q.them, 22), captain: clip(q.you, 22),
    // the day they met becomes the ticket date and the flight number (LV 0110 for Jan 10)
    date: dots(q.date) || '',
    flightNo: q.date ? `LV ${q.date.slice(5, 7)}${q.date.slice(8, 10)}` : 'LV 214',
  }),
  photos: (q) => ({ stopPhotos: pad(q.photos.slice(0, MAX), MAX) }),
  texts: (q) => {
    const n = stopCount(q.photos.length), mem = memories(q.tone, n), L = LINES[q.tone], land = LANDING[q.tone];
    return {
      stopNames: pad(mem.map((m) => m.title), MAX),
      stopCodes: pad([], MAX),
      stopDates: pad(q.date ? [dots(q.date).slice(0, 7)] : [], MAX),
      stopNotes: pad(mem.map((m) => m.note), MAX),
      finalTitle: land.title, seat: land.seat, cabin: land.cabin,
      finalMessage: q.message?.trim() || L.message(q.them || 'Хайрт минь', q.you, 0),
    };
  },
};
