import type { TemplateMeta } from '../types';
import { COUPLES, PHOTOS } from '../photos';

const texts = {
  coverEyebrow: 'хайрын захидал',
  coverSub: 'миний хамгийн дуртай хуудас — бид',
  recordLabel: 'бидний дуу',
  recordWords: 'үргэлж хоёр удаа сонсдог тэр дуу',
  lucky: 'АЗТАЙ\nАЗТАЙ',
  luckyNote: 'энгийн өдрүүдийн хаа нэгтээ чи миний гэр болчихсон.',
  letterEyebrow: 'тэр үеэс',
  letterTitle: 'одоог хүртэл',
  letterBody: 'нэгэн энгийн мөч бүх зүйлийг чимээгүйхэн өөрчилсөн.',
  ticket: 'ХАЙР',
  littleTitle: 'жижигхэн зүйлс',
  littleNote: 'өглөөний кофе, зөвхөн бид ойлгох хошигнол, урт алхалт, чи намайг үргэлж инээлгэдэг.',
  placesLabel: 'бид болсон газрууд',
  placesNote: 'газар нь биш, хажууд минь хэн байсан нь чухал байсан.',
  postmark: 'ЧАМТАЙ\nХААНА Ч',
  notesTitle: 'хадгалах зүйлс',
  noteOneLabel: 'дуртай кино', noteOne: 'үгийг нь буруу цээжилсэн тэр кино',
  noteTwoLabel: 'нууц хошигнол', noteTwo: 'тайлбарлахын аргагүй',
  noteThree: 'чи энгийн өдрийг дурсамж болгодог.',
  songsTitle: 'бидний дуунууд',
  soundtrackHandNote: 'намайг санахаараа үүнийг тоглуулаарай',
  soundtrackTicket: 'БИД',
  soundtrackEyebrow: 'бидний саундтрек',
  cassette: 'оройн дуунууд',
  finalList: 'өглөөний кофе\nтөлөвлөгөөгүй алхалт\nбидний хошигнол\nшөнийн урт яриа\nчиний инээд',
  pocketTitle: 'дурсамжаа цуглуулсаар',
  tomorrow: 'маргаашдаа жаахан зай үлдээе',
  backTitle: 'цуглуулсаар',
  backTicket: 'ҮҮРД',
  backLine: 'гараар хийж, зүрхээрээ хадгалав.',
};

export const bookMeta: TemplateMeta = {
  id: 'book',
  name: 'Дурсамжийн ном',
  nameMn: 'Дурсамжийн ном',
  tagline: '12 хуудастай, жинхэнэ ном шиг эргүүлдэг скрапбүүк — зураг, скоч, тэмдэглэл, таны дуу.',
  description:
    'Гараар хийсэн мэт цаасан бүтэц, скоч, наалт, пянз, кассет, Spotify дуу бүхий дурсамжийн ном. Хуудасны булангаас чирээд жинхэнэ ном шиг эргүүлнэ.',
  category: 'Хайр',
  badge: 'ХИТ',
  price: 500,
  cover: '/covers/book.jpg',
  accent: '#e94f64',
  features: ['12 эргэдэг хуудас', '10 хүртэл зураг', 'Spotify дуу', '30+ тэмдэглэл'],
  schema: [
    {
      id: 'basics', title: 'Нүүр ба үндсэн', summary: 'Номын нүүр хавтас — түүний нэр, дурсгалын огноо, зүрхний гэрэл.', previewPage: 0,
      fields: [
        { type: 'text', key: 'partnerName', label: 'Түүний нэр (нүүрэн дээр)', max: 30, placeholder: 'хайрт минь' },
        { type: 'text', key: 'texts.coverEyebrow', label: 'Нүүрний дээд бичвэр', max: 30 },
        { type: 'text', key: 'texts.coverSub', label: 'Нүүрний доод бичвэр', max: 50 },
        { type: 'color', key: 'heartColor', label: 'Зүрхний гэрлийн өнгө', presets: ['#FFF7E8', '#F1A7B7', '#E94F64', '#F6C86B', '#B9E3C6'] },
        { type: 'text', key: 'keepsakeDate', label: 'Дурсгалын огноо', max: 20, placeholder: '15 · 11 · 21' },
      ],
    },
    {
      id: 'photos', title: 'Зургууд', summary: 'Номын бүх зураг. Хуудас бүрийн зураг дээр шууд дарж сольж болно.',
      description: 'Энд нэмсэн зургууд номын эхний хуудсуудад (нүүр, дуу, азтай) ашиглагдана. Номын бусад хуудас бүр өөрийн тусдаа зурагтай тул тухайн хуудсан дээрх зураг дээр шууд дарж сольж болно — хуудас бүр өөр өөрийн зурагтай, хооронд нь давхцахгүй.',
      // 38 = the total number of independent photo placements across all 12 pages (see
      // pages.tsx). Every placement has its own fixed index and is never shared with
      // another — this bound only needs to cover them all, not steer how many a buyer
      // is expected to upload here (10 still fills the first few pages by itself).
      fields: [{ type: 'images', key: 'photos', label: 'Номын зургууд', max: 38 }],
    },
    {
      id: 'song', title: 'Таны дуу', summary: 'Пянз, кассет, Spotify тоглуулагчтай «бидний дуу» хуудсууд.', previewPage: 1,
      fields: [
        { type: 'spotify', key: 'spotify', label: 'Spotify дууны холбоос', placeholder: 'https://open.spotify.com/track/…' },
        { type: 'text', key: 'songName', label: 'Дууны нэр (Spotify холбоосгүй бол)', max: 60 },
        { type: 'text', key: 'songNote', label: 'Дууны доорх бичвэр', max: 60 },
        { type: 'text', key: 'texts.recordLabel', label: 'Пянзны шошго', max: 20 },
        { type: 'text', key: 'texts.recordWords', label: 'Пянзны хажуугийн бичвэр', max: 60 },
        { type: 'text', key: 'texts.songsTitle', label: 'Саундтрекийн гарчиг', max: 20 },
        { type: 'text', key: 'texts.soundtrackEyebrow', label: 'Тоглуулагчийн дээрх бичвэр', max: 30 },
        { type: 'text', key: 'texts.soundtrackHandNote', label: 'Гар бичмэл тэмдэглэл', max: 50 },
        { type: 'text', key: 'texts.cassette', label: 'Кассетын шошго', max: 30 },
        { type: 'text', key: 'texts.soundtrackTicket', label: 'Тасалбар дээрх үг', max: 10 },
      ],
    },
    {
      id: 'lucky', title: 'Азтай', summary: '3-р хуудас: том «АЗТАЙ» бичиг ба жижиг тэмдэглэл.', previewPage: 2,
      fields: [
        { type: 'textarea', key: 'texts.lucky', label: 'Том үг (3-р хуудас)', max: 30, rows: 2 },
        { type: 'textarea', key: 'texts.luckyNote', label: 'Тэмдэглэл (3-р хуудас)', max: 120, rows: 2 },
      ],
    },
    {
      id: 'letter', title: 'Захидал', summary: '4-р хуудас: дугтуйтай богино захидал.', previewPage: 3,
      fields: [
        { type: 'text', key: 'texts.letterEyebrow', label: 'Захидлын дээд бичвэр', max: 30 },
        { type: 'text', key: 'texts.letterTitle', label: 'Захидлын гарчиг', max: 30 },
        { type: 'textarea', key: 'texts.letterBody', label: 'Захидлын бичвэр', max: 160, rows: 3 },
        { type: 'text', key: 'texts.ticket', label: 'Тасалбар дээрх үг', max: 10 },
      ],
    },
    {
      id: 'little', title: 'Жижигхэн зүйлс', summary: '5-р хуудас: хамтын жижигхэн зүйлсийн тухай.', previewPage: 4,
      fields: [
        { type: 'text', key: 'texts.littleTitle', label: '«Жижигхэн зүйлс» гарчиг', max: 30 },
        { type: 'textarea', key: 'texts.littleNote', label: '«Жижигхэн зүйлс» тэмдэглэл', max: 140, rows: 3 },
      ],
    },
    {
      id: 'places', title: 'Газрууд', summary: '6-р хуудас: хамтдаа очсон газрууд, шуудангийн тамга.', previewPage: 5,
      fields: [
        { type: 'text', key: 'texts.placesLabel', label: 'Газрын гарчиг', max: 40 },
        { type: 'textarea', key: 'texts.placesNote', label: 'Газрын тэмдэглэл', max: 120, rows: 2 },
        { type: 'textarea', key: 'texts.postmark', label: 'Шуудангийн тамга', max: 30, rows: 2 },
      ],
    },
    {
      id: 'notes', title: 'Тэмдэглэлүүд', summary: '7-р хуудас: цаасан тэмдэглэлүүд.', previewPage: 6,
      fields: [
        { type: 'text', key: 'texts.notesTitle', label: 'Тэмдэглэлийн хуудасны гарчиг', max: 40 },
        { type: 'text', key: 'texts.noteOneLabel', label: '1-р тэмдэглэлийн шошго', max: 30 },
        { type: 'text', key: 'texts.noteOne', label: '1-р тэмдэглэл', max: 60 },
        { type: 'text', key: 'texts.noteTwoLabel', label: '2-р тэмдэглэлийн шошго', max: 30 },
        { type: 'text', key: 'texts.noteTwo', label: '2-р тэмдэглэл', max: 60 },
        { type: 'textarea', key: 'texts.noteThree', label: '3-р тэмдэглэл', max: 100, rows: 2 },
      ],
    },
    {
      id: 'keepsakes', title: 'Эцсийн жагсаалт', summary: '10-р хуудас: хамгийн дуртай жижиг зүйлсийн жагсаалт.', previewPage: 9,
      fields: [
        { type: 'textarea', key: 'texts.finalList', label: 'Жижигхэн зүйлсийн жагсаалт', max: 200, rows: 5 },
      ],
    },
    {
      id: 'pocket', title: 'Халаастай хуудас', summary: '11-р хуудас: халаастай хуудас ба ирээдүйн тухай нэг мөр.', previewPage: 10,
      fields: [
        { type: 'text', key: 'texts.pocketTitle', label: 'Халаастай хуудасны гарчиг', max: 40 },
        { type: 'text', key: 'texts.tomorrow', label: 'Халаастай хуудасны тэмдэглэл', max: 60 },
      ],
    },
    {
      id: 'back', title: 'Арын хавтас', summary: 'Арын хавтас — номын сүүлийн үгс.', previewPage: 11,
      fields: [
        { type: 'text', key: 'texts.backTitle', label: 'Арын гарчиг', max: 24 },
        { type: 'text', key: 'texts.backTicket', label: 'Тасалбар дээрх үг', max: 12 },
        { type: 'text', key: 'texts.backLine', label: 'Сүүлийн мөр', max: 60 },
      ],
    },
  ],
  tour: [0, 1, 2, 3, 5, 9],
  defaults: {
    partnerName: '',
    heartColor: '#fff7e9',
    photos: [],
    spotify: '',
    songName: 'бидний дуу',
    songNote: 'намайг санахаараа сонсоорой',
    keepsakeDate: '15 · 11 · 21',
    ...Object.fromEntries(Object.entries(texts).map(([k, v]) => [`texts.${k}`, v])),
  },
  // Demo/preview only — real buyer pages never repeat a photo across placements, but the
  // sample pool only has 16 distinct images, so this cycles them to fill all 38 slots
  // (pages.tsx) for a full-looking standalone preview before purchase.
  demo: {
    photos: (() => {
      const pool = [...COUPLES, PHOTOS.mnGer1, PHOTOS.mnGer2, PHOTOS.mnYurtsSnow, PHOTOS.mnHills, PHOTOS.ubNight, PHOTOS.ubCity];
      return Array.from({ length: 38 }, (_, i) => pool[i % pool.length]);
    })(),
    partnerName: 'Ану',
  },
};
