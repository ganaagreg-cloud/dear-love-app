import type { TemplateMeta } from '../types';
import { COUPLES, PHOTOS } from '../photos';

export const wrappedMeta: TemplateMeta = {
  id: 'wrapped',
  name: 'Бидний жил · Wrapped',
  nameMn: 'Бидний жил',
  tagline: 'Та хоёрын харилцааг Spotify Wrapped шиг жилийн тойм болгоно — хамт өнгөрүүлсэн өдөр, топ дуу, топ газар, хуваалцах карт.',
  description:
    'TikTok дээр тренд болсон «Dating Wrapped»-ийг жинхэнээр нь: тод өнгө, том хөдөлгөөнт тоонуудтай, дарж урагшилдаг сторинууд. Хамт өнгөрүүлсэн өдөр, №1 мөч, топ 5 дуу ба газар, хамгийн их хэлдэг үгс, «хайрын төрөл», зургийн цуглуулга, бичигдэх мессеж, эцэст нь хураангуй карт.',
  category: 'Ой',
  badge: 'ТРЕНД',
  price: 19900,
  cover: '/covers/wrapped.jpg',
  accent: '#c6ff3d',
  features: ['Стори слайдууд', 'Топ 5 дуу ба газар', 'Хайрын төрөл', 'Хураангуй карт', '4 өнгөний загвар'],
  schema: [
    {
      id: 'basics', title: 'Үндсэн',
      fields: [
        { type: 'text', key: 'them', label: 'Түүний нэр', max: 20 },
        { type: 'text', key: 'you', label: 'Таны нэр', max: 20 },
        { type: 'text', key: 'year', label: 'Он / гарчиг', max: 12, placeholder: '2026' },
        { type: 'date', key: 'startDate', label: 'Үерхэж эхэлсэн өдөр', help: '«Хамтдаа өнгөрүүлсэн өдөр» тоологчид ашиглагдана.' },
        {
          type: 'select', key: 'theme', label: 'Өнгөний загвар',
          options: [{ value: 'neon', label: 'Неон' }, { value: 'sunset', label: 'Жаргах нар' }, { value: 'berry', label: 'Жимс' }, { value: 'midnight', label: 'Шөнө' }],
        },
      ],
    },
    {
      id: 'moment', title: 'Таны №1 мөч',
      fields: [
        { type: 'image', key: 'topPhoto', label: 'Зураг' },
        { type: 'text', key: 'topCaption', label: 'Тайлбар', max: 60 },
      ],
    },
    {
      id: 'songs', title: 'Топ 5 дуу',
      fields: [
        { type: 'list', key: 'songTitles', label: 'Дууны нэр', count: 5, max: 40, itemLabel: 'Дуу' },
        { type: 'list', key: 'songArtists', label: 'Дуучин', count: 5, max: 40, itemLabel: 'Дуучин' },
        { type: 'audio', key: 'music', label: 'Стори үзэх үед тоглох дуу (mp3, заавал биш)', maxMB: 10 },
      ],
    },
    {
      id: 'places', title: 'Топ 5 газар',
      fields: [
        { type: 'list', key: 'places', label: 'Газрууд', count: 5, max: 36, itemLabel: 'Газар' },
        { type: 'list', key: 'placeCounts', label: 'Газар бүрийн доорх бичвэр', count: 5, max: 30, itemLabel: 'ж: 23 удаа' },
      ],
    },
    {
      id: 'words', title: 'Хамгийн их хэлдэг үгс',
      fields: [{ type: 'list', key: 'words', label: 'Үг / хэллэг', count: 8, max: 18, itemLabel: 'Үг' }],
    },
    {
      id: 'persona', title: 'Хайрын төрөл',
      fields: [
        { type: 'text', key: 'personaEmoji', label: 'Эможи', max: 4 },
        { type: 'text', key: 'personaTitle', label: 'Нэр', max: 30 },
        { type: 'textarea', key: 'personaText', label: 'Тайлбар', max: 160, rows: 3 },
      ],
    },
    {
      id: 'photos', title: 'Зургийн цуглуулга',
      fields: [{ type: 'images', key: 'photos', label: '6 хүртэл зураг', max: 6 }],
    },
    {
      id: 'message', title: 'Мессеж',
      fields: [{ type: 'textarea', key: 'message', label: 'Таны мессеж', max: 600, rows: 6 }],
    },
  ],
  defaults: {
    them: 'Ану', you: 'Бат', year: '2026', startDate: '2024-01-10', theme: 'neon',
    topPhoto: '', topCaption: 'Төөрөөд ч хамаагүй байсан тэр шөнө',
    songTitles: ['Perfect', 'Хайрын дуу', 'Давтаад л сонсдог дуу', 'Машинд тоглодог дуу', 'Шөнийн аялгуу'],
    songArtists: ['Ed Sheeran', 'The Hu', 'чи мэднэ дээ', 'цонх онгорхой', 'lo-fi'],
    places: ['Бидний кофе шоп', 'Зайсан, нар жаргахад', 'Чиний гал тогоо', 'Тэрэлжийн аялал', 'Гэр рүү харих урт зам'],
    placeCounts: ['47 удаа', '12 нар жаргалт', 'тоолж баршгүй оройн хоол', '1 төгс амралтын өдөр', '7 хоног бүр'],
    words: ['хайраа', 'санаж байна', 'хоол уу?', 'хаха', 'сайхан нойрсоорой', 'хаана байна', 'хайртай', 'өлсөж байна'],
    personaEmoji: '🐶', personaTitle: 'Алтан ретривер',
    personaText: 'Үнэнч, дулаахан, намайг хармагцаа баярладаг, тэгээд зууш гэхээр л бүр ч их баярладаг.',
    photos: [],
    message: 'Энэ жилийн бүх өдрүүдээс надад хамгийн их таалагдсан нь чи байсан өдрүүд.\n\nДуу, аялал, оройн хоол, чимээгүй мөчүүдэд баярлалаа. Ирэх жилдээ — яг л чи, харин илүү олон адал явдал.',
    music: '',
  },
  demo: { topPhoto: COUPLES[0], photos: [COUPLES[1], PHOTOS.mnGer2, COUPLES[2], PHOTOS.ubNight, COUPLES[4], PHOTOS.mnYurtsSnow] },
};
