import { LINES, arr, clip, memories, pad, str, type QuickSpec, type Tone } from '../quick';

type LocketCopy = {
  prologue: string; ch1: string; ch2: string; ch3: string; ch4: string; ch4NoDate: string;
  locketCap: string; finale: string; answer: string; letter: (dated: boolean) => string[];
};

/** Locket fills {to}, {from} and {days} itself, so the copy keeps them as tokens. */
const C: Record<Tone, LocketCopy> = {
  cute: {
    prologue: 'Нэгэн цагт нэг хөөрхөн хүн байжээ.\nТэр нь чи.',
    ch1: 'Чамаас өмнө миний өдрүүд\nжаахан уйтгартай байлаа.',
    ch2: 'Тэгтэл чи гарч ирээд\nбүх юмыг хөөрхөн болгосон.',
    ch3: 'Эдгээр бяцхан мөчүүд\nминий хамгийн дуртай нь.',
    ch4: 'өдөр бүр чамд арай илүү дурласаар.', ch4NoDate: 'өдөр бүр чамд арай илүү дурласаар.',
    locketCap: 'Чи ба би. Хоёулаа хөөрхөн.',
    finale: 'Энэ бол эхлэл л.\nБидэнд одоо ч олон хөөрхөн өдөр бий.',
    answer: 'Ура! Тэгвэл маргааш ч хамтдаа ♡',
    letter: (d) => [
      'Чамайг бодохоор инээмсэглэл минь өөрөө гарч ирдэг. Энэ хэвийн биш гэдгийг би мэднэ.',
      d ? 'Бид {days} өдрийг хамт өнгөрөөлөө. Нэг ч өдөр чамгүйгээр төсөөлөхийн аргагүй.' : 'Хамт өнгөрүүлсэн өдөр бүр надад бэлэг шиг санагддаг.',
      'Чиний инээд, чиний «идсэн үү?» гэдэг асуулт, чиний дулаахан гар — бүгдэд нь хайртай.',
      'Энэ медальонд хоёр зураг бий. Гэхдээ дотор нь ганц л зүйл бий — бид.',
    ],
  },
  romantic: {
    prologue: 'Зарим түүх одод дээр бичигддэг.\nХарин бидний түүхийг бид өдөр бүр өөрсдөө бичсэн.',
    ch1: 'Чамаас өмнө миний шөнүүд энгийн байлаа.\nОдод зүгээр л одод байсан.',
    ch2: 'Тэгээд чи ирсэн.\nЯг цагтаа, яг хэрэгтэй үед.',
    ch3: 'Тэгээд л бяцхан мөчүүд эхэлсэн —\nчамайг санах бүрт эргэн ирдэг тэр мөчүүд.',
    ch4: 'тэр өдөр бүрт би чамайг л сонгох байсан.', ch4NoDate: 'өдөр бүр би чамайг л сонгох болно.',
    locketCap: 'Хоёр хагас. Нэг зүрх.',
    finale: 'Энэ бол төгсгөл биш.\nБидний анхны бүлэг л дууслаа.',
    answer: 'Тэгвэл эхэлцгээе. Мөнхийн түүх одоо эхэлж байна ♡',
    letter: (d) => [
      'Заримдаа би чамтай огт танилцахгүй өнгөрч болох байсан гэж бодоод айдаг.',
      d ? 'Бид {days} өдрийг хамт өнгөрөөлөө. {days} өглөө чамайг бодсоор сэрсэн.' : 'Чамтай өнгөрүүлсэн өглөө бүр чамайг бодсоор сэрдэг.',
      'Зарим өдөр амархан, зарим нь хэцүү байсан ч тэр өдөр бүрт би чамайг л сонгосон.',
      'Энэ медальонд хоёр зураг бий. Гэхдээ үнэндээ ганц л зүйл хадгалагдаж байгаа — бид.',
    ],
  },
  funny: {
    prologue: 'Анхааруулга: энэ түүх хэт их хайр,\nбас жаахан тэнэглэл агуулсан.',
    ch1: 'Чамаас өмнө би өөрийгөө\nдажгүй хүн гэж боддог байлаа.',
    ch2: 'Тэгтэл чи гарч ирээд\nтэр бодлыг минь инээдээр дарсан.',
    ch3: 'Эдгээр мөчүүдийг хэнд ч битгий үзүүлээрэй.\nНэр хүнд чухал.',
    ch4: 'өдөр намайг тэвчсэн. Баатар шүү.', ch4NoDate: 'намайг тэвчдэг чи бол баатар.',
    locketCap: 'Хоёр тэнэг. Нэг зүрх.',
    finale: 'Энэ бол төгсгөл биш.\nДараагийн анги илүү хөгжилтэй.',
    answer: 'Гоё! Буцаах боломжгүй шүү ♡',
    letter: (d) => [
      'Чи миний хошигнолд инээдэг цорын ганц хүн. Үүнийг би маш нухацтай хүлээн авч байгаа.',
      d ? 'Бид {days} өдөр хамт байлаа. Би тоолсон. Чи гайхаж байгаа биз.' : 'Хамт байх хугацаанд чи надаас нэг ч удаа зугтаагүй. Гайхалтай.',
      'Хоолоо хуваалцдаг, хөнжлөө булаацалддаг, гэхдээ хамгийн чухал нь — үргэлж буцаж ирдэг.',
      'Энэ медальонд хоёр зураг бий. Нэг нь хөөрхөн, нөгөө нь би.',
    ],
  },
  simple: {
    prologue: 'Бидний түүх.',
    ch1: 'Чамаас өмнө.', ch2: 'Бид танилцсан.', ch3: 'Бидний мөчүүд.',
    ch4: 'өдөр хамтдаа.', ch4NoDate: 'хамтдаа.',
    locketCap: 'Чи ба би.',
    finale: 'Цааш хамтдаа.',
    answer: 'Баярлалаа ♡',
    letter: (d) => [
      'Хажууд минь байдагт баярлалаа.',
      d ? 'Хамтдаа {days} өдөр.' : 'Хамт өнгөрүүлсэн өдөр бүрт баярлалаа.',
      'Чамдаа хайртай.',
    ],
  },
};

export const locketQuick: QuickSpec = {
  maxPhotos: 7,
  pins: { names: null, photos: null, tone: null },
  messageKey: 'letterBody',
  read: (c) => ({ them: str(c.to), you: str(c.from), date: str(c.startDate), photos: [...arr(c.locketPhotos), ...arr(c.memoryPhotos)].filter(Boolean) }),
  names: (q) => ({ to: clip(q.them, 40), from: clip(q.you, 40), startDate: q.date || new Date().toISOString().slice(0, 10) }),
  // the first two open inside the heart locket, the next five become the memory polaroids
  photos: (q) => ({ locketPhotos: q.photos.slice(0, 2), memoryPhotos: q.photos.slice(2, 7) }),
  texts: (q) => {
    const c = C[q.tone], dated = !!q.date, L = LINES[q.tone];
    return {
      memoryCaptions: pad(memories(q.tone, 5).map((m) => clip(m.title.toLowerCase(), 32)), 5),
      'text.prologue': c.prologue, 'text.ch1': c.ch1, 'text.ch2': c.ch2, 'text.ch3': c.ch3,
      'text.ch4': dated ? c.ch4 : c.ch4NoDate,
      'text.locketCap': c.locketCap, 'text.finale': c.finale, 'text.question': L.question, 'text.answer': c.answer,
      letterTitle: 'Хайрт минь', letterGreeting: '{to},',
      letterBody: q.message?.trim() || c.letter(dated).join('\n\n'),
      letterSignoff: L.signoff,
    };
  },
};
