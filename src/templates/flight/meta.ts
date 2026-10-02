import type { TemplateMeta } from '../types';
import { COUPLES, PHOTOS } from '../photos';

const STAMPS = ['❤️', '💕', '💍', '💋', '🥰', '😍', '🌹', '🎁', '🎂', '🎉', '🍜', '🍕', '☕', '🍷', '🍰', '🍦', '🌅', '🌄', '🏔️', '🏖️', '🌊', '🌲', '⛺', '🏠', '🏙️', '🚗', '✈️', '🚂', '🎬', '🎵', '🎤', '🎮', '📸', '🌙', '⭐', '✨', '🔥', '🌸', '🌻', '🐶', '🐱', '🐻', '🎡', '⛷️', '🎓', '💬', '👋', '🤝'];

export const flightMeta: TemplateMeta = {
  id: 'flight',
  name: 'Хайрын нислэг',
  nameMn: 'Хайрын нислэг',
  tagline: '«Үүрд» рүү нисэх нислэг — нислэгийн самбар, урж авдаг тасалбар, дараа нь та хоёрын түүхээр газрын зураг дээгүүр нисэнэ.',
  description:
    'Нислэгийн эргэдэг самбараар эхэлнэ — түүний нислэг «СУУЖ БАЙНА» гэж анивчина. Нэртэй нь суух тасалбар гарч ирэхэд хэсгийг нь урж онгоцонд сууна. Дараа нь онгоц зурагт газрын зураг дээгүүр тасархай замаар нисч, таны 6 хүртэлх дурсамжит газар бүрт буудаллана — буудал бүр зураг, тэмдэглэлтэй ил захидал. Эцэст нь «ҮҮРД»-д газардаж паспортын тамга дарагдан, таны захидал гарч ирнэ.',
  category: 'Аялал',
  badge: 'ШИНЭ',
  price: 200,
  cover: '/covers/flight.jpg',
  accent: '#1f4fd1',
  features: ['Нислэгийн самбар', 'Урдаг тасалбар', 'Хөдөлгөөнт газрын зураг', '6 буудал зурагтай', 'Паспортын тамга'],
  schema: [
    {
      id: 'route', title: 'Нислэгийн самбар', summary: 'Эхний дэлгэц: нислэгийн самбар дээр түүний нислэг «СУУЖ БАЙНА» гэж анивчина.', previewPage: 'board',
      fields: [
        { type: 'text', key: 'passenger', label: 'Зорчигч (түүний нэр)', max: 22, example: 'Ану' },
        { type: 'text', key: 'toCity', label: 'Очих газар', max: 20, example: 'Үүрд' },
        { type: 'text', key: 'flightNo', label: 'Нислэгийн дугаар', max: 8, help: 'Санаа: ойн өдрөө ашиглаарай, ж: LV 1005.', example: 'LV 1005' },
        { type: 'text', key: 'boarding', label: 'Суух цаг', max: 5 },
        { type: 'text', key: 'gate', label: 'Хаалга', max: 4 },
      ],
    },
    {
      id: 'ticket', title: 'Тасалбар', summary: 'Урж авдаг суух тасалбар — хаанаас хаашаа, нисгэгч, суудал.', previewPage: 'pass',
      fields: [
        { type: 'text', key: 'fromCode', label: 'Хөөрөх газрын товч нэр', max: 8, help: 'Тасалбар дээр том үсгээр гарна (8 хүртэл тэмдэгт). ж: ULN, ГЭР', example: 'ULN' },
        { type: 'text', key: 'fromCity', label: 'Хөөрөх хот', max: 20, example: 'Улаанбаатар' },
        { type: 'text', key: 'toCode', label: 'Очих газрын товч нэр', max: 8, help: 'Тасалбар дээр том үсгээр гарна (8 хүртэл тэмдэгт). ж: ҮҮРД, ХАЙР, САНСАР', example: 'ҮҮРД' },
        { type: 'text', key: 'captain', label: 'Нисгэгч (таны нэр)', max: 22, example: 'Бат' },
        { type: 'text', key: 'airline', label: 'Агаарын тээврийн нэр', max: 18, placeholder: 'Love Air' },
        { type: 'text', key: 'date', label: 'Тасалбар дээрх огноо', max: 16 },
        { type: 'text', key: 'seat', label: 'Суудал', max: 14, example: 'Миний хажууд' },
        { type: 'text', key: 'cabin', label: 'Зэрэглэл', max: 16 },
        { type: 'color', key: 'color', label: 'Компанийн өнгө', presets: ['#1F4FD1', '#D6336C', '#0F766E', '#7C3AED', '#C2410C', '#111827'] },
      ],
    },
    {
      id: 'stops', title: 'Замын буудлууд', summary: 'Газрын зураг дээрх буудлууд — буудал бүр зураг, тэмдэглэлтэй ил захидал.', previewPage: 'fly', perItem: { count: 6, label: 'Буудал' },
      description: 'Та хоёрын түүхийн 6 хүртэл газар. Нэрийг нь хоосон орхивол тэр буудлыг алгасна.',
      fields: [
        { type: 'list', key: 'stopNames', label: 'Газрын нэр', count: 6, max: 26, itemLabel: 'Газар', itemPreview: 'stop:', example: 'Анхны болзоо' },
        { type: 'list', key: 'stopCodes', label: 'Тамга (заавал биш)', count: 6, max: 4, itemLabel: 'Тамга', itemPreview: 'stop:', emojis: STAMPS, help: 'Ил захидал дээр дарагдах тамга — нэгийг сонгоно. Сонгохгүй бол газрын нэрийн эхний 3 үсэг гарна.' },
        { type: 'list', key: 'stopDates', label: 'Огноо', count: 6, max: 18, itemLabel: 'Огноо', itemPreview: 'stop:' },
        { type: 'images', key: 'stopPhotos', label: 'Зургууд (ижил дарааллаар)', max: 6, itemPreview: 'stop:' },
        { type: 'list', key: 'stopNotes', label: 'Ил захидлын бичвэр', count: 6, max: 180, itemLabel: 'Бичвэр', itemPreview: 'stop:' },
      ],
    },
    {
      id: 'landing', title: 'Газардалт', summary: 'Газардсаны дараах паспортын тамга ба таны захидал.', previewPage: 'land',
      fields: [
        { type: 'text', key: 'finalTitle', label: 'Газардах үеийн гарчиг', max: 36, example: 'Үүрдэд тавтай морил' },
        { type: 'textarea', key: 'finalMessage', label: 'Таны захидал', max: 500, rows: 5, example: 'Надтай хамт нисч байгаад баярлалаа.' },
        { type: 'spotify', key: 'song', label: 'Бидний дуу — Spotify холбоос (заавал биш)', placeholder: 'https://open.spotify.com/track/…', help: 'Spotify дээр дууны «Share → Copy song link» дарж буулгана. Хүлээн авагч ♫ товч дарж сонсоно.' },
      ],
    },
  ],
  tour: ['board', 'pass', 'stop:0', 'stop:2', 'land'],
  defaults: {
    passenger: 'Ану', captain: 'Бат', airline: 'Love Air', flightNo: 'LV 1005', date: '2026.10.05', boarding: '20:14', gate: '14',
    seat: 'Миний хажууд', cabin: 'Нэгдүгээр зэрэг', color: '#1F4FD1',
    fromCode: 'ULN', fromCity: 'Улаанбаатар', toCode: 'ҮҮРД', toCity: 'Үүрд',
    stopNames: ['Анхны «сайн уу»', 'Анхны болзоо', 'Тэрэлжийн амралт', 'Чиний төрсөн өдөр', 'Зайсангийн нар жаргалт', ''],
    stopCodes: ['👋', '🍜', '🏔️', '🎂', '🌅', ''],
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
