import type { Content, Section, TemplateMeta } from '../types';
import { COUPLES } from '../photos';
import { BRANCH_EP, MAX_EPISODES, MAX_SLIDES, TOP_COUNT, TRAILER_MAX } from './data';

/** Default chapters. The subtitle lines are SAMPLES — grey placeholders in the editor and the demo's content, never saved for the buyer. The 6th chapter is empty (an empty chapter is skipped). */
const EPISODES: { title: string; date: string; captions: string[] }[] = [
  { title: 'Анхны «сайн уу»', date: '2024-01-12', captions: ['Найз маань «та хоёр танилцаач» гэсэн.', 'Тэр өдөр зүрх минь жаахан хурдан цохилсон.'] },
  { title: 'Анхны болзоо', date: '2024-02-14', captions: ['Чам руу харсаар байгаад юу захиалснаа мартчихсан.', 'Тэр оройн яриа дуусахгүй байгаасай гэж бодсон.'] },
  { title: 'Тэрэлжийн амралт', date: '2024-07-20', captions: ['Хүйтэн шөнө, дулаахан гэр.', 'Амьдралдаа үзсэн хамгийн олон од.'] },
  { title: 'Чиний төрсөн өдөр', date: '2024-11-08', captions: ['Чи хүсэл шивнэсэн. Би л байсан байлгүй дээ.', 'Бялуу бага, инээд их.'] },
  { title: 'Өнөөдөр', date: '2025-08-15', captions: ['Доор хотын гэрэл, хажууд минь чи.', 'Хамгийн гоё үзэмж — чи.'] },
  { title: '', date: '', captions: [] },
];

const BRANCH_A = 'Бид шөнө дунд хүртэл тэнгэр ширтсэн.';
const BRANCH_B = 'Гал, цай, чимээгүй яриа — өөр юу ч хэрэггүй.';
const TOP = ['Чиний инээд', 'Чиний «идсэн үү?» гэдэг асуулт', 'Хамт идсэн хоол', 'Дулаахан тэврэлт', 'Зүгээр л чи'];
const THANKS = ['Бидний хамгийн анхны найз', 'Тэрэлжийн одод', 'Чиний тэвчээр'];

const pad = (xs: string[], n: number) => Array.from({ length: n }, (_, i) => xs[i] ?? '');

/** One step per episode: its title/date, up to 4 slides (photo + subtitle). Slide i previews `ep:<n>:<i>`. */
const episodeSection = (n: number): Section => ({
  id: `ep${n}`, title: `Бүлэг ${n}`, previewPage: `ep:${n}:0`,
  summary: `Бүлэг ${n}: гарчиг, огноо, 1–4 слайд. Слайд бүр нэг зураг, доор нь киноны хадмал шиг нэг мөр үгтэй. Хоосон орхивол бүлэг алгасагдана.`,
  fields: [
    { type: 'text', key: `ep${n}.title`, label: 'Бүлгийн нэр', max: 30, previewPage: `ep:${n}:0` },
    { type: 'date', key: `ep${n}.date`, label: 'Огноо', notFuture: true, pickOnly: true, previewPage: `ep:${n}:0` },
    { type: 'images', key: `ep${n}.photos`, label: 'Зургууд (слайд бүрд нэг)', max: MAX_SLIDES, itemPreview: `ep:${n}:` },
    { type: 'list', key: `ep${n}.captions`, label: 'Хадмал үг (зураг бүрийн доор)', count: MAX_SLIDES, max: 90, itemLabel: 'Слайд', itemPreview: `ep:${n}:`, placeholders: EPISODES[n - 1]?.captions },
  ],
});

const epDefaults = (): Content => {
  const out: Content = {};
  EPISODES.forEach((e, i) => {
    out[`ep${i + 1}.title`] = e.title; out[`ep${i + 1}.date`] = e.date;
    out[`ep${i + 1}.photos`] = []; out[`ep${i + 1}.captions`] = pad([], MAX_SLIDES);
  });
  return out;
};

/** Demo photos are all couples (no landscapes) so the preview sells the template. */
const [P0, P1, P2, P3, P4, P5, P6, P7] = COUPLES;
const epDemo = (): Content => ({
  'ep1.photos': [P1, P2], 'ep2.photos': [P3, P4], 'ep3.photos': [P5, P0], 'ep4.photos': [P6, P7], 'ep5.photos': [P2, P4],
  ...Object.fromEntries(EPISODES.map((e, i) => [`ep${i + 1}.captions`, pad(e.captions, MAX_SLIDES)])),
});

export const netflixMeta: TemplateMeta = {
  id: 'netflix',
  name: 'LoveFlix',
  nameMn: 'LoveFlix',
  tagline: 'Та хоёрын түүхээр бүтсэн Netflix маягийн цуврал — трейлер, бүлэг бүр зурагтай, төгсгөлд нь асуулт.',
  description:
    '«Хэн үзэж байна?» гэж асаж, «та-дам» дуугаар эхэлнэ. Таны зургуудаас трейлер өөрөө бүтнэ, түүх нь бүлэг бүлгээр тоглоно — зураг бүрийн доор киноны хадмал. Нэг бүлэгд сонголт хийхэд түүх салаалж өөр зураг гарна. Төгсгөлд нь «Тийм»-д дарахад хойно нь кино титр гүйнэ.',
  category: 'Болзоонд урих',
  badge: 'ШИНЭ',
  price: 400,
  cover: '/covers/netflix.jpg',
  accent: '#e50914',
  features: ['Автомат трейлер', '6 хүртэл бүлэг', 'Салаалах сонголт', 'Зугтдаг «Үгүй» товч', 'Кино титр'],
  schema: [
    {
      id: 'gate', title: 'Профайл', previewPage: 'gate',
      summary: 'Эхний дэлгэц «Хэн үзэж байна?» — түүний зураг ба нэр.',
      fields: [
        { type: 'image', key: 'profilePhoto', label: 'Түүний профайл зураг' },
        { type: 'text', key: 'name1', label: 'Түүний нэр', max: 22 },
      ],
    },
    {
      id: 'cast', title: 'Цуврал', previewPage: 'home',
      summary: 'Нүүр дэлгэц: цувралын нэр, таны нэр, товч агуулга.',
      fields: [
        { type: 'text', key: 'title', label: 'Цувралын нэр', max: 28 },
        { type: 'text', key: 'name2', label: 'Таны нэр', max: 22 },
        { type: 'text', key: 'year', label: 'Он', max: 4 },
        { type: 'textarea', key: 'synopsis', label: 'Товч агуулга («Дэлгэрэнгүй» дээр гарна)', max: 220, rows: 3 },
      ],
    },
    {
      id: 'trailer', title: 'Трейлер', previewPage: 'home',
      summary: 'Нүүр дэлгэцийн том хэсэгт таны зургууд өөрөө солигдон гүйнэ.',
      fields: [{ type: 'images', key: 'trailerPhotos', label: 'Трейлерийн зургууд (6 хүртэл)', max: TRAILER_MAX }],
    },
    ...Array.from({ length: MAX_EPISODES }, (_, i) => episodeSection(i + 1)),
    {
      id: 'branch', title: 'Салаалах сонголт', previewPage: 'branch',
      summary: `Бүлэг ${BRANCH_EP}-ын дунд үзэгч нэгийг сонгоно — сонголт бүр өөр зураг, өөр үг гаргана. Хоёр сонголтын нэрийг хоосон орхивол энэ хэсэг алгасагдана.`,
      fields: [
        { type: 'text', key: 'branch.prompt', label: 'Асуулт', max: 50, previewPage: 'branch' },
        { type: 'text', key: 'branch.a.label', label: 'Сонголт А', max: 30, previewPage: 'branch:a' },
        { type: 'image', key: 'branch.a.photo', label: 'Сонголт А · зураг', previewPage: 'branch:a' },
        { type: 'text', key: 'branch.a.caption', label: 'Сонголт А · хадмал үг', max: 90, placeholder: BRANCH_A, previewPage: 'branch:a' },
        { type: 'text', key: 'branch.b.label', label: 'Сонголт Б', max: 30, previewPage: 'branch:b' },
        { type: 'image', key: 'branch.b.photo', label: 'Сонголт Б · зураг', previewPage: 'branch:b' },
        { type: 'text', key: 'branch.b.caption', label: 'Сонголт Б · хадмал үг', max: 90, placeholder: BRANCH_B, previewPage: 'branch:b' },
      ],
    },
    {
      id: 'top', title: 'Топ 5 шалтгаан', previewPage: 'home',
      summary: 'Нүүр дэлгэц дээрх «Топ 5» мөр — Netflix-ийн Топ 10 шиг том тоотой.',
      fields: [
        { type: 'list', key: 'top.texts', label: 'Шалтгаан', count: TOP_COUNT, max: 40, itemLabel: 'Шалтгаан', placeholders: TOP },
        { type: 'images', key: 'top.photos', label: 'Зургууд (ижил дарааллаар)', max: TOP_COUNT },
      ],
    },
    {
      id: 'final', title: 'Финал', previewPage: 'finale',
      summary: 'Сүүлийн бүлэг дуусахад гарах асуулт. «Тийм», «За... асуу» хоёулаа «тийм» гэсэн үг; жижиг «Үгүй» зугтана.',
      fields: [
        { type: 'text', key: 'final.question', label: 'Асуулт', max: 60 },
        { type: 'text', key: 'final.yes', label: 'Товч 1', max: 24 },
        { type: 'text', key: 'final.yes2', label: 'Товч 2', max: 24 },
        { type: 'text', key: 'final.no', label: 'Зугтдаг «Үгүй» товч', max: 24 },
        { type: 'text', key: 'final.no2', label: 'Зургаа зугтсаны дараах бичвэр (энэ нь бас «тийм»)', max: 30 },
      ],
    },
    {
      id: 'credits', title: 'Кино титр', previewPage: 'credits',
      summary: 'Төгсгөлд гүйх титр: «Гол дүрд», «Найруулсан», «Тусгай талархал», дуу.',
      fields: [
        { type: 'text', key: 'credits.director', label: 'Найруулсан', max: 30 },
        { type: 'list', key: 'credits.thanks', label: 'Тусгай талархал', count: 3, max: 36, itemLabel: 'Талархал', placeholders: THANKS },
        { type: 'text', key: 'songName', label: 'Дуу (титрт гарна)', max: 60 },
      ],
    },
    {
      id: 'music', title: 'Хөгжим', previewPage: 'home',
      summary: 'Нээлтийн дараа аажуухан гарч ирэх арын хөгжим.',
      fields: [{ type: 'audio', key: 'music', label: 'Арын хөгжим (заавал биш)', tracks: ['aria', 'uyanga', 'nandin', 'hooptie'] }],
    },
  ],
  tour: ['gate', 'home', 'ep:1:0', 'ep:3:1', 'branch', 'finale', 'credits'],
  defaults: {
    title: 'Бидний түүх', name1: 'Ану', name2: 'Бат', year: String(new Date().getFullYear()),
    synopsis: 'Хоёр хүн, нэг санамсаргүй уулзалт. Өдөр бүр шинэ бүлэг нэмэгддэг цуврал.',
    profilePhoto: '', trailerPhotos: [],
    ...epDefaults(),
    'branch.prompt': 'Дараа нь юу хийх вэ?',
    'branch.a.label': 'Одод харцгаая', 'branch.a.photo': '', 'branch.a.caption': '',
    'branch.b.label': 'Галын дэргэд суая', 'branch.b.photo': '', 'branch.b.caption': '',
    'top.texts': ['', '', '', '', ''], 'top.photos': [],
    'final.question': '2-р улирал үргэлжлэх үү?', 'final.yes': 'Тийм', 'final.yes2': 'За... асуу', 'final.no': 'Үгүй', 'final.no2': '...за за, тийм 🙂',
    'credits.director': '', 'credits.thanks': ['', '', ''], songName: '', music: '',
  },
  demo: {
    name1: 'Ану', name2: 'Бат', profilePhoto: P0,
    trailerPhotos: [P0, P1, P2, P3, P4, P5],
    ...epDemo(),
    'branch.a.photo': P6, 'branch.b.photo': P7, 'branch.a.caption': BRANCH_A, 'branch.b.caption': BRANCH_B,
    'top.photos': [P1, P3, P5, P7, P0], 'top.texts': TOP, 'credits.thanks': THANKS,
    'credits.director': 'Бат', songName: 'Бидний дуу',
    music: '/music/uyanga.mp3',
  },
};
