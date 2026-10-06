import type { TemplateMeta } from '../types';
import { COUPLES, PHOTOS } from '../photos';

export const locketMeta: TemplateMeta = {
  id: 'locket',
  name: 'Оддын түүх',
  nameMn: 'Оддын түүх',
  tagline: 'Таван бүлэгтэй хайрын түүх.',
  description:
    'Одод, хувь заяаны улаан утас, дурсамжуудын од эрхэс, өдөр тоологч',
  category: 'Ой',
  badge: 'ОНЦЛОХ',
  price: 600,
  cover: '/covers/locket.jpg',
  accent: '#d9b46a',
  features: ['2 зураг', '5 дурсамжийн зураг', 'Захидал ', 'Өдөр тоологч', 'Хөгжим'],
  schema: [
    {
      id: 'names', title: 'Нэр', summary: 'Нээлтийн үг.', previewPage: 'prologue',
      fields: [
        { type: 'text', key: 'to', label: 'Түүний нэр', max: 40, placeholder: 'Хайрт минь' },
        { type: 'text', key: 'from', label: 'Таны нэр', max: 40 },
      ],
    },
    {
      id: 'prologue', title: 'Эхлэлийн үг', summary: 'Мэндчилгээ үг', previewPage: 'prologue',
      fields: [
        { type: 'textarea', key: 'text.prologue', label: 'Эхлэлийн үг', max: 200, rows: 3 },
      ],
    },
    {
      id: 'titles', title: 'Бүлгүүдийн гарчиг', summary: 'Бүлэг бүрийн дээр гарах нэр.', previewPage: 'before',
      fields: [
        { type: 'list', key: 'chapters', label: 'Бүлгүүдийн гарчиг', count: 4, max: 40, itemLabel: 'Бүлэг', itemPreview: 'ch:' },
      ],
    },
    {
      id: 'ch1', title: 'I бүлэг · Чамаас өмнө', summary: 'Ганц од, харанхуй ертөнц чамтай танилцахаас өмнөх шөнүүд.', previewPage: 'before',
      fields: [
        { type: 'textarea', key: 'text.ch1', label: 'I бүлгийн бичвэр', max: 240, rows: 4 },
      ],
    },
    {
      id: 'ch2', title: 'II бүлэг · Яаж танилцсан', summary: 'Таницлсан түүхээ бичнэ', previewPage: 'meet',
      fields: [
        { type: 'textarea', key: 'text.ch2', label: 'II бүлгийн бичвэр', max: 240, rows: 4 },
      ],
    },
    {
      id: 'memories', title: 'III бүлэг · Бяцхан мөчүүд', summary: ' 5 зураг оруулна.', previewPage: 'moments',
      fields: [
        { type: 'images', key: 'memoryPhotos', label: 'Зургууд', max: 5 },
        { type: 'list', key: 'memoryCaptions', label: 'Зураг доорх сэтгэлийн үг', count: 5, max: 32, itemLabel: 'Бичвэр' },
        { type: 'textarea', key: 'text.ch3', label: 'III бүлгийн сэтгэлийн үг', max: 200, rows: 3 },
      ],
    },
    {
      id: 'count', title: 'IV бүлэг · Өдрүүдээ тоолох', summary: 'Амьд өдөр тоологч: хамтдаа өнгөрүүлсэн өдөр, дараагийн зорилго.', previewPage: 'count',
      fields: [
        { type: 'date', key: 'startDate', label: 'Анх үерхэж эхэлсэн өдөр', notFuture: true, help: '«Бидний өдрүүд» тоологчид ашиглагдана. Ирээдүйн өдөр сонгох боломжгүй.' },
        {
          type: 'select', key: 'milestone', label: 'Тоолох зорилго', daysSince: 'startDate',
          help: 'Хамтдаа өнгөрүүлсэн хоногоос урагш байх зорилгыг сонгоно. Өнгөрсөн зорилго хаагдсан байна.',
          options: [
            { value: '100', label: '100 хоног', days: 100 }, { value: '200', label: '200 хоног', days: 200 },
            { value: '365', label: '1 жил', days: 365 }, { value: '500', label: '500 хоног', days: 500 },
            { value: '730', label: '2 жил', days: 730 }, { value: '1000', label: '1000 хоног', days: 1000 },
            { value: '1500', label: '1500 хоног', days: 1500 }, { value: '2000', label: '2000 хоног', days: 2000 },
            { value: '3650', label: '10 жил', days: 3650 },
          ],
        },
        { type: 'text', key: 'text.ch4', label: 'Тоологчийн доорх сэтгэлийн үг', max: 120 },
      ],
    },
    {
      id: 'locket', title: 'V · Медальон', summary: 'Зүрхэн зүүлт доторх зураг.', previewPage: 'locket',
      fields: [
        { type: 'images', key: 'locketPhotos', label: 'Зүрхэн зүүлт зураг (зүүн, баруун)', max: 2 },
        { type: 'text', key: 'text.locketCap', label: 'Нээгдсэн зүүлтийн доорх үг', max: 60 },
      ],
    },
    {
      id: 'letter', title: 'Захидал', summary: 'Зүүлтнээс гарсан дугтуйнаас нээгдэх захидал.', previewPage: 'letter',
      fields: [
        { type: 'text', key: 'letterTitle', label: 'Захидлын гарчиг', max: 40 },
        { type: 'textarea', key: 'letterBody', label: 'Захидал', max: 2000, rows: 12, help: 'Догол мөр бүрийн хооронд нэг хоосон мөр үлдээнэ.' },
        { type: 'text', key: 'letterSignoff', label: 'Төгсгөлийн үг', max: 40 },
      ],
    },
    {
      id: 'final', title: 'Төгсгөл · Асуулт', summary: 'Эцсийн дэлгэц: таны асуулт ба «Тийм» гэсний дараах хариу.', previewPage: 'final',
      fields: [
        { type: 'textarea', key: 'text.finale', label: 'Төгсгөлийн үг', max: 160, rows: 3 },
        { type: 'text', key: 'text.question', label: 'Таны асуулт', max: 100 },
        { type: 'text', key: 'text.answer', label: '«Тийм» гэсний дараах үг', max: 100, previewPage: 'answer' },
      ],
    },
    {
      id: 'music', title: 'Хөгжим', summary: 'Түүх үзэх үеийн арын хөгжим.', previewPage: 'prologue',
      fields: [{ type: 'audio', key: 'music', label: 'Арын хөгжим (заавал биш)', tracks: ['aria', 'uyanga', 'nandin'] }],
    },
  ],
  defaults: {
    to: 'Хайрт минь',
    from: 'Бат',
    startDate: '2024-01-10',
    milestone: '1000',
    locketPhotos: [],
    memoryPhotos: [],
    memoryCaptions: ['анхны «сайн уу»', 'анхны болзоо', 'тэр инээд чинь', 'зөвхөн бид хоёр', 'өнөөдрийн бид'],
    chapters: ['Чамаас өмнө', 'Найзын бяцхан санаа', 'Бяцхан мөчүүд', 'Өдрүүдээ тоолохуй'],
    'text.prologue': 'Зарим түүх одод дээр бичигддэг.\nХарин бидний түүхийг бид өдөр бүр өөрсдөө бичсэн.',
    'text.ch1': 'Чамаас өмнө миний шөнүүд энгийн байлаа.\nОдод зүгээр л одод байсан,\nюуг хүлээж байгаагаа ч мэддэггүй байлаа.',
    'text.ch2': 'Тэгтэл нэг найз маань «Та хоёр танилцаач» гэлээ.\nЕрөө л ганц өгүүлбэр.\nТэр надад бүхэл бүтэн ертөнцийг бэлэглэж байгаагаа мэдээгүй.',
    'text.ch3': 'Тэгээд л бяцхан мөчүүд эхэлсэн —\nчамайг санах бүрт эргэн санагддаг тэр мөчүүд.',
    'text.ch4': 'тэр өдөр бүрт би чамайг л сонгох байсан.',
    'text.locketCap': 'Хоёр хагас. Нэг зүрх.',
    'text.finale': 'Энэ бол төгсгөл биш.\nБидний анхны бүлэг л дууслаа.',
    'text.question': 'Дараагийн мянган өдрийг надтай хамт бичих үү?',
    'text.answer': 'Тэгвэл эхэлцгээе. Мөнхийн түүх одоо эхэлж байна ♡',
    letterTitle: 'Хайрт минь',
    letterBody: [
      'Заримдаа би чамтай огт танилцахгүй өнгөрч болох байсан гэж бодоод айдаг. Нэг найзын ганцхан өгүүлбэр миний амьдралын чиглэлийг чимээгүйхэн өөрчилсөн.',
      'Чамаас өмнө би аз жаргал гэж юу болохыг мэднэ гэж боддог байлаа. Гэтэл чи миний нэг муу хошигнолд инээхэд л би зөвхөн таамаглаж явсан юм байна гэдгээ ойлгосон.',
      'Бид олон өдрийг хамт өнгөрөөлөө. Өглөө бүр чамайг бодсоор сэрсэн. Зарим өдөр амархан, зарим нь хэцүү байсан ч тэр өдөр бүрт би чамайг л сонгосон.',
      'Намайг ойлгоход хэцүү байсан өдрүүдэд ч хажууд минь үлдсэнд баярлалаа. Чи өөрөө санахгүй байж мэдэх тэр жижигхэн зүйлс л надад хамгийн их санагддаг.',
      'Энэ медальонд хоёр зураг бий, гэхдээ үнэндээ ганц л зүйл хадгалагдаж байгаа — бид.',
      'Тиймээс би амлая. Чамайг таньж мэдсээр байна. Чамайг сонгосоор байна. Чи зөвшөөрсөн цагт энэ түүхийг чамтай хамт өдөр бүр үргэлжлүүлэн бичнэ.',
    ].join('\n\n'),
    letterSignoff: 'Үүрд чинийх,',
    music: '',
  },
  demo: { locketPhotos: [PHOTOS.couple1, PHOTOS.couple7], memoryPhotos: [COUPLES[1], PHOTOS.mnGer2, COUPLES[2], PHOTOS.ubNight, COUPLES[4]] },
};
