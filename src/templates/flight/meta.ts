import type { TemplateMeta } from '../types';
import { COUPLES, PHOTOS } from '../photos';

export const flightMeta: TemplateMeta = {
  id: 'flight',
  name: 'Хайрын нислэг',
  nameMn: 'Хайрын нислэг',
  tagline: '«Үүрд» рүү нисэх нислэг — нислэгийн самбар, урж авдаг тасалбар, дараа нь та хоёрын түүхээр газрын зураг дээгүүр нисэнэ.',
  description:
    'Нислэгийн эргэдэг самбараар эхэлнэ — түүний нислэг «СУУЖ БАЙНА» гэж анивчина. Нэртэй нь суух тасалбар гарч ирэхэд хэсгийг нь урж онгоцонд сууна. Дараа нь онгоц зурагт газрын зураг дээгүүр тасархай замаар нисч, таны 6 хүртэлх дурсамжит газар бүрт буудаллана — буудал бүр зураг, тэмдэглэлтэй ил захидал. Эцэст нь «ҮҮРД»-д газардаж паспортын тамга дарагдан, таны захидал гарч ирнэ.',
  category: 'Аялал',
  badge: 'ШИНЭ',
  price: 24900,
  cover: '/covers/flight.jpg',
  accent: '#1f4fd1',
  features: ['Нислэгийн самбар', 'Урдаг тасалбар', 'Хөдөлгөөнт газрын зураг', '6 буудал зурагтай', 'Паспортын тамга'],
  schema: [
    {
      id: 'ticket', title: 'Тасалбар',
      fields: [
        { type: 'text', key: 'passenger', label: 'Зорчигч (түүний нэр)', max: 22 },
        { type: 'text', key: 'captain', label: 'Нисгэгч (таны нэр)', max: 22 },
        { type: 'text', key: 'airline', label: 'Агаарын тээврийн нэр', max: 18, placeholder: 'Love Air' },
        { type: 'text', key: 'flightNo', label: 'Нислэгийн дугаар', max: 8, help: 'Санаа: ойн өдрөө ашиглаарай, ж: LV 1005.' },
        { type: 'text', key: 'date', label: 'Тасалбар дээрх огноо', max: 16 },
        { type: 'text', key: 'boarding', label: 'Суух цаг', max: 5 },
        { type: 'text', key: 'gate', label: 'Хаалга', max: 4 },
        { type: 'text', key: 'seat', label: 'Суудал', max: 14 },
        { type: 'text', key: 'cabin', label: 'Зэрэглэл', max: 16 },
        { type: 'color', key: 'color', label: 'Компанийн өнгө', presets: ['#1F4FD1', '#D6336C', '#0F766E', '#7C3AED', '#C2410C', '#111827'] },
      ],
    },
    {
      id: 'route', title: 'Хаанаас → Хаашаа',
      fields: [
        { type: 'text', key: 'fromCode', label: 'Хөөрөх код', max: 4 },
        { type: 'text', key: 'fromCity', label: 'Хөөрөх хот', max: 20 },
        { type: 'text', key: 'toCode', label: 'Очих код', max: 4 },
        { type: 'text', key: 'toCity', label: 'Очих газар', max: 20 },
      ],
    },
    {
      id: 'stops', title: 'Замын буудлууд',
      description: 'Та хоёрын түүхийн 6 хүртэл газар. Нэрийг нь хоосон орхивол тэр буудлыг алгасна.',
      fields: [
        { type: 'list', key: 'stopNames', label: 'Газрын нэр', count: 6, max: 26, itemLabel: 'Газар' },
        { type: 'list', key: 'stopCodes', label: '3 үсэгт код (заавал биш)', count: 6, max: 4, itemLabel: 'Код' },
        { type: 'list', key: 'stopDates', label: 'Огноо', count: 6, max: 18, itemLabel: 'Огноо' },
        { type: 'images', key: 'stopPhotos', label: 'Зургууд (ижил дарааллаар)', max: 6 },
        { type: 'list', key: 'stopNotes', label: 'Ил захидлын бичвэр', count: 6, max: 180, itemLabel: 'Бичвэр' },
      ],
    },
    {
      id: 'landing', title: 'Газардалт',
      fields: [
        { type: 'text', key: 'finalTitle', label: 'Газардах үеийн гарчиг', max: 36 },
        { type: 'textarea', key: 'finalMessage', label: 'Таны захидал', max: 500, rows: 5 },
        { type: 'audio', key: 'music', label: 'Нислэгийн үеийн дуу (mp3, заавал биш)', maxMB: 10 },
      ],
    },
  ],
  defaults: {
    passenger: 'Ану', captain: 'Бат', airline: 'Love Air', flightNo: 'LV 1005', date: '2026.10.05', boarding: '20:14', gate: '14',
    seat: 'Миний хажууд', cabin: 'Нэгдүгээр зэрэг', color: '#1F4FD1',
    fromCode: 'ULN', fromCity: 'Улаанбаатар', toCode: 'ҮҮРД', toCity: 'Үүрд',
    stopNames: ['Анхны «сайн уу»', 'Анхны болзоо', 'Тэрэлжийн амралт', 'Чиний төрсөн өдөр', 'Зайсангийн нар жаргалт', ''],
    stopCodes: ['СУУ', 'БЛЗ', 'ТРЖ', 'ТӨР', 'ЗСН', ''],
    stopDates: ['2024.01', '2024.02', '2024.07', '2024.11', '2025.08', ''],
    stopPhotos: [],
    stopNotes: [
      'Нэг найз «та хоёр танилцаач» гэлээ. Тэр цагаас хойш цээжинд минь агаарын хуйлрал.',
      'Чам руу харсаар байгаад юу захиалснаа мартчихсан.',
      'Хүйтэн шөнө, дулаахан гэр, амьдралдаа үзсэн хамгийн олон од.',
      'Чи хүсэл шивнэсэн. Би л байсан гэж бодож байна. (Батлана уу.)',
      'Доор хотын гэрэл, хажууд минь чи — Улаанбаатарын хамгийн гоё үзэмж.',
      '',
    ],
    finalTitle: 'Үүрдэд тавтай морил',
    finalMessage: 'Надтай хамт нисч байгаад баярлалаа.\nДамжин өнгөрөх буудал ч, буцах тасалбар ч үгүй — хаана ч газардсан зөвхөн чи бид хоёр.',
    music: '',
  },
  demo: { stopPhotos: [COUPLES[0], COUPLES[2], PHOTOS.mnGer2, COUPLES[5], PHOTOS.ubNight] },
};
