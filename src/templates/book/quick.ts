import { LINES, arr, clip, dmy, str, type QuickSpec, type Tone } from '../quick';

/**
 * Where uploaded photos go, in order: first the main photo of every page (so even a few
 * photos fill every spread), then a second photo per page. Slot numbers are pages.tsx's.
 * Anything not listed stays empty — and empty slots are simply not drawn for the recipient.
 */
export const BOOK_SLOT_ORDER = [
  0, 3, 8, 11, 13, 17, 20, 28, 29, 31, 33, 36, // one per page
  1, 9, 18, 30, 34, 37, 4, 12,                  // then a second one
];
const SLOTS = 38;

type BookTexts = Record<string, string>;
const T: Record<Tone, BookTexts> = {
  cute: {
    coverEyebrow: 'бяцхан хайрын ном', recordWords: 'хамт сонсох дуртай тэр дуу', lucky: 'АЗТАЙ\nБИ',
    luckyNote: 'олон хүний дундаас чамтай таарсан нь миний хамгийн том аз.',
    letterEyebrow: 'анх уулзсан', letterTitle: 'тэр өдрөөс',
    letterBody: 'чи миний өдөр бүрийг хөөрхөн болгодог. чамайг бодохоор л инээд хүрдэг.',
    littleNote: 'чиний инээд, өглөөний мессеж, «идсэн үү?» гэдэг асуулт — бүгд надад чухал.',
    placesNote: 'хаана ч байсан чи хажууд байхад л гоё.', noteThree: 'чи энгийн өдрийг баяр болгодог.',
    finalList: 'чиний инээд\nхамтдаа идсэн хоол\nшөнийн яриа\nгэнэтийн тэврэлт\nзүгээр л чи',
    tomorrow: 'маргааш ч гэсэн хамтдаа ♡', soundtrackHandNote: 'намайг санахаараа сонсоорой',
  },
  romantic: {
    coverEyebrow: 'хайрын захидал', recordWords: 'бидний түүхийн дуу', lucky: 'ЧИ\nБИД',
    luckyNote: 'энгийн өдрүүдийн хаа нэгтээ чи миний гэр болчихсон.',
    letterEyebrow: 'тэр үеэс', letterTitle: 'үүрд',
    letterBody: 'нэгэн энгийн мөч бүх зүйлийг өөрчилсөн. тэр мөчөөс хойш би чамайг л сонгосоор.',
    littleNote: 'өглөөний кофе, зөвхөн бид ойлгох харц, урт алхалт — хайр жижигхэн зүйлсэд байдаг.',
    placesNote: 'газар нь биш, хажууд минь хэн байсан нь чухал байсан.', noteThree: 'чамтай өнгөрөх өдөр бүр дурсамж болдог.',
    finalList: 'анхны харц\nгараа атгасан мөч\nоддын доорх яриа\nчимээгүй тэврэлт\nбидний маргааш',
    tomorrow: 'ирэх бүх бүлгийг хамтдаа бичье', soundtrackHandNote: 'энэ дууг сонсоод намайг санаарай',
  },
  funny: {
    coverEyebrow: 'маш нууц баримт бичиг', recordWords: 'бид хоёулаа үгийг нь буруу дуулдаг дуу', lucky: 'АЗТАЙ\nЧИ',
    luckyNote: 'чи азтай. намайг олсон. (би ч бас жаахан азтай.)',
    letterEyebrow: 'анхны болзооноос', letterTitle: 'одоог хүртэл',
    letterBody: 'миний тэнэг хошигнолд инээдэг, хоолоо надтай хуваалцдаг цорын ганц хүн. битгий яв.',
    littleNote: 'шөнийн зууш, хөгжилтэй зураг, «чи л буруу» гэдэг маргаан — энэ бол бид.',
    placesNote: 'бид хаа сайгүй төөрсөн. хамтдаа төөрөх нь хамгийн гоё.', noteThree: 'чи намайг тэвчдэг. энэ бол баатарлаг.',
    finalList: 'шөнийн 2 цагийн зууш\nтэнэг зургууд\nбуруу дуулдаг дуу\nхэн зөв бэ маргаан\nбас чи',
    tomorrow: 'маргааш ч гэсэн чамайг зовооно ♡', soundtrackHandNote: 'чанга дуулаарай. буруу ч хамаагүй',
  },
  simple: {
    coverEyebrow: 'бидний ном', recordWords: 'бидний дуу', lucky: 'ЧИ\nБИ',
    luckyNote: 'чамтай учирсандаа баяртай байна.',
    letterEyebrow: 'тэр үеэс', letterTitle: 'одоог хүртэл',
    letterBody: 'хажууд минь байдагт баярлалаа.',
    littleNote: 'жижигхэн зүйлс, том утга.',
    placesNote: 'хамтдаа очсон газрууд.', noteThree: 'хамтдаа байх сайхан.',
    finalList: 'инээд\nаялал\nяриа\nтэврэлт\nбид',
    tomorrow: 'цааш хамтдаа', soundtrackHandNote: 'бидний дуу',
  },
};

export const bookQuick: QuickSpec = {
  maxPhotos: BOOK_SLOT_ORDER.length,
  pins: { names: 0, photos: 0, tone: 3 },
  messageKey: 'texts.letterBody',
  read: (c) => {
    const photos = arr(c.photos);
    return { them: str(c.partnerName), you: '', date: '', photos: BOOK_SLOT_ORDER.map((n) => photos[n] ?? '').filter(Boolean) };
  },
  names: (q) => ({ partnerName: clip(q.them, 30), keepsakeDate: dmy(q.date) || '♡' }),
  photos: (q) => {
    const slots = Array.from({ length: SLOTS }, () => '');
    q.photos.slice(0, BOOK_SLOT_ORDER.length).forEach((u, i) => { slots[BOOK_SLOT_ORDER[i]] = u; });
    return { photos: slots };
  },
  texts: (q) => {
    const t = T[q.tone], L = LINES[q.tone];
    return {
      ...Object.fromEntries(Object.entries(t).map(([k, v]) => [`texts.${k}`, v])),
      'texts.coverSub': L.tagline,
      'texts.letterBody': q.message?.trim() || t.letterBody,
      'texts.backLine': clip(q.you ? `${L.signoff} ${q.you}` : 'гараар хийж, зүрхээрээ хадгалав.', 60),
    };
  },
};
