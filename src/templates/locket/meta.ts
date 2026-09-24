import type { TemplateMeta } from '../types';
import { COUPLES, PHOTOS } from '../photos';

export const locketMeta: TemplateMeta = {
  id: 'locket',
  name: 'Медальон түүх',
  nameMn: 'Медальон түүх',
  tagline: 'Таван бүлэгтэй хайрын түүх — алтан медальон, өөрөө бичигдэх захидлаар төгсөнө.',
  description:
    'Одод, хувь заяаны улаан утас, дурсамжуудын од эрхэс, амьд өдөр тоологч — эцэст нь найгах зүрхэн медальон нээгдэж хоёр зураг гарч ирээд, далайн давалгаанаас захидал хөвөн гарна.',
  category: 'Ой',
  badge: 'ОНЦЛОХ',
  price: 29900,
  cover: '/covers/locket.jpg',
  accent: '#d9b46a',
  features: ['2 медальон зураг', '5 дурсамжийн зураг', 'Бичигдэх захидал', 'Өдөр тоологч', 'Өөрийн дуу (mp3)'],
  schema: [
    {
      id: 'names', title: 'Нэр ба анхны өдөр',
      fields: [
        { type: 'text', key: 'to', label: 'Түүнийг юу гэж дууддаг вэ?', max: 40, placeholder: 'Хайрт минь' },
        { type: 'text', key: 'from', label: 'Таны нэр / гарын үсэг', max: 40 },
        { type: 'date', key: 'startDate', label: 'Анх үерхэж эхэлсэн өдөр', help: '«Бидний өдрүүд» тоологчид ашиглагдана.' },
        {
          type: 'select', key: 'milestone', label: 'Тоолох зорилго',
          options: [
            { value: '100', label: '100 хоног' }, { value: '365', label: '1 жил (365)' },
            { value: '500', label: '500 хоног' }, { value: '1000', label: '1000 хоног' },
          ],
        },
      ],
    },
    {
      id: 'locket', title: 'Медальон',
      description: 'Зүрхэн медальон дотор нуугдах хоёр зураг.',
      fields: [
        { type: 'images', key: 'locketPhotos', label: 'Медальоны зураг (зүүн, баруун)', max: 2 },
        { type: 'text', key: 'text.locketCap', label: 'Нээгдсэн медальоны доорх үг', max: 60 },
      ],
    },
    {
      id: 'memories', title: 'III бүлэг · Бяцхан мөчүүд',
      fields: [
        { type: 'images', key: 'memoryPhotos', label: 'Дурсамжийн зургууд', max: 5 },
        { type: 'list', key: 'memoryCaptions', label: 'Зураг доорх бичвэр', count: 5, max: 32, itemLabel: 'Бичвэр' },
      ],
    },
    {
      id: 'story', title: 'Түүхийн бичвэр',
      description: 'Шинэ мөр оруулахдаа Enter дарна. {days}, {to}, {from} автоматаар бөглөгдөнө.',
      fields: [
        { type: 'list', key: 'chapters', label: 'Бүлгүүдийн гарчиг', count: 5, max: 40, itemLabel: 'Бүлэг' },
        { type: 'textarea', key: 'text.prologue', label: 'Эхлэлийн үг', max: 200, rows: 2 },
        { type: 'textarea', key: 'text.ch1', label: 'I бүлэг — чамаас өмнө', max: 240, rows: 3 },
        { type: 'textarea', key: 'text.ch2', label: 'II бүлэг — хэрхэн танилцсан', max: 240, rows: 3 },
        { type: 'textarea', key: 'text.ch3', label: 'III бүлэг — дурсамжууд', max: 200, rows: 2 },
        { type: 'text', key: 'text.ch4', label: 'IV бүлэг — тоологчийн доорх үг', max: 120 },
        { type: 'textarea', key: 'text.finale', label: 'Төгсгөлийн үг', max: 160, rows: 2 },
        { type: 'text', key: 'text.question', label: 'Таны асуулт', max: 100 },
        { type: 'text', key: 'text.answer', label: '«Тийм» гэсний дараах үг', max: 100 },
      ],
    },
    {
      id: 'letter', title: 'Захидал',
      fields: [
        { type: 'text', key: 'letterTitle', label: 'Захидлын гарчиг', max: 40 },
        { type: 'text', key: 'letterGreeting', label: 'Мэндчилгээ', max: 60 },
        { type: 'textarea', key: 'letterBody', label: 'Захидал', max: 4000, rows: 12, help: 'Догол мөр бүрийн хооронд нэг хоосон мөр үлдээнэ.' },
        { type: 'text', key: 'letterSignoff', label: 'Төгсгөлийн үг', max: 40 },
      ],
    },
    {
      id: 'music', title: 'Хөгжим',
      fields: [{ type: 'audio', key: 'music', label: 'Арын дуу (mp3, 10 MB хүртэл)', maxMB: 10 }],
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
    chapters: ['Чамаас өмнө', 'Найзын бяцхан санаа', 'Бяцхан мөчүүд', 'Өдрүүдээ тоолохуй', 'Дурсгал'],
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
    letterGreeting: '{to},',
    letterBody: [
      'Заримдаа би чамтай огт танилцахгүй өнгөрч болох байсан гэж бодоод айдаг. Нэг найзын ганцхан өгүүлбэр миний амьдралын чиглэлийг чимээгүйхэн өөрчилсөн.',
      'Чамаас өмнө би аз жаргал гэж юу болохыг мэднэ гэж боддог байлаа. Гэтэл чи миний нэг муу хошигнолд инээхэд л би зөвхөн таамаглаж явсан юм байна гэдгээ ойлгосон.',
      'Бид {days} өдрийг хамт өнгөрөөлөө. {days} өглөө чамайг бодсоор сэрсэн. Зарим өдөр амархан, зарим нь хэцүү байсан ч тэр өдөр бүрт би чамайг л сонгосон.',
      'Намайг ойлгоход хэцүү байсан өдрүүдэд ч хажууд минь үлдсэнд баярлалаа. Чи өөрөө санахгүй байж мэдэх тэр жижигхэн зүйлс л надад хамгийн их санагддаг.',
      'Энэ медальонд хоёр зураг бий, гэхдээ үнэндээ ганц л зүйл хадгалагдаж байгаа — бид.',
      'Тиймээс би амлая. Чамайг таньж мэдсээр байна. Чамайг сонгосоор байна. Чи зөвшөөрсөн цагт энэ түүхийг чамтай хамт өдөр бүр үргэлжлүүлэн бичнэ.',
    ].join('\n\n'),
    letterSignoff: 'Үүрд чинийх,',
    music: '',
  },
  demo: { locketPhotos: [PHOTOS.couple1, PHOTOS.couple7], memoryPhotos: [COUPLES[1], PHOTOS.mnGer2, COUPLES[2], PHOTOS.ubNight, COUPLES[4]] },
};
