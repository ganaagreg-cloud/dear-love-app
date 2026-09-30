import { LINES, arr, clip, daysSince, str, type QuickSpec, type Tone } from '../quick';

const PERSONA: Record<Tone, { emoji: string; title: string; text: string; caption: string; words: string[] }> = {
  cute: {
    emoji: '🧸', title: 'Тэврэлтийн мастер',
    text: 'Зөөлөн, дулаахан, хэзээ ч тэврэлтээс татгалздаггүй. Уурласан ч гэсэн хөөрхөн.',
    caption: 'Хамгийн хөөрхөн мөч маань',
    words: ['хайраа', 'идсэн үү?', 'санаж байна', 'хөөрхөн', 'тэврээч', 'сайхан нойрсоорой', 'хайртай', 'ирээч'],
  },
  romantic: {
    emoji: '🌹', title: 'Мөнхийн романтик',
    text: 'Нар жаргалт, урт захидал, чимээгүй тэврэлт. Энгийн өдрийг дурсамж болгодог.',
    caption: 'Цаг зогссон тэр мөч',
    words: ['хайртай', 'чи минийх', 'үүрд', 'санаж байна', 'хайраа', 'сайхан нойрсоорой', 'чамтай', 'бид'],
  },
  funny: {
    emoji: '🐶', title: 'Алтан ретривер',
    text: 'Үнэнч, дулаахан, намайг хармагцаа баярладаг. Зууш гэхээр бүр ч их баярладаг.',
    caption: 'Төөрөөд ч хамаагүй байсан тэр өдөр',
    words: ['өлсөж байна', 'хаха', 'хоол уу?', 'чи л буруу', 'хаана байна', 'зүгээр', 'хайртай', 'дахиад нэг'],
  },
  simple: {
    emoji: '🤍', title: 'Хамгийн сайн хань',
    text: 'Үргэлж хажууд. Үргэлж ойлгодог.',
    caption: 'Бидний мөч',
    words: ['хайртай', 'санаж байна', 'хаана байна', 'сайн уу', 'баярлалаа', 'бид', 'гэртээ', 'хамтдаа'],
  },
};

export const wrappedQuick: QuickSpec = {
  maxPhotos: 7,
  pins: { names: '__intro__', photos: 'top', tone: 'msg' },
  messageKey: 'message',
  read: (c) => ({ them: str(c.them), you: str(c.you), date: str(c.startDate), photos: [str(c.topPhoto), ...arr(c.photos)].filter(Boolean) }),
  names: (q) => ({ them: clip(q.them, 20), you: clip(q.you, 20), startDate: q.date, year: String(new Date().getFullYear()) }),
  // first photo is the «№1 мөч», the rest (up to 6) go to the photo wall
  photos: (q) => ({ topPhoto: q.photos[0] ?? '', photos: q.photos.slice(1, 7) }),
  texts: (q) => {
    const p = PERSONA[q.tone];
    return {
      topCaption: p.caption, personaEmoji: p.emoji, personaTitle: p.title, personaText: p.text, words: p.words,
      message: q.message?.trim() || LINES[q.tone].message(q.them || 'Хайрт минь', q.you, daysSince(q.date)),
    };
  },
};
