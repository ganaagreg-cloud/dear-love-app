import type { TemplateMeta } from '../types';
import { COUPLES, PHOTOS } from '../photos';

const looks = [{ value: 'girl', label: 'Охин' }, { value: 'boy', label: 'Хүү' }];
const outfits = ['#FF5D8F', '#5B8CFF', '#FFB02E', '#2FC08D', '#9B6BFF', '#FF6B4A'];

/** Sample notes: grey placeholders in the editor and the demo's content — the buyer writes their own. */
const NOTES = [
  'Найз маань «та хоёр танилцаач» гэсэн тэр өдөр. Дараа нь бүх юм өөрчлөгдсөн дээ.',
  'Сандраад юу захиалснаа ч мартчихсан. Чи инээхэд л би ухаан алдах шахсан.',
  'Буруу эргэлт, муухай хоол, гэхдээ чамтай бол л сайхан. Дахиад хамт төөрөхөд бэлэн шүү.',
  'Миний хачин хошигнолыг чам шиг ойлгодог хүн байхгүй. Битгий инээхээ болиорой шүү.',
  'Өдрүүд өнгөрсөн ч чи миний хамгийн дуртай газар хэвээрээ.',
];

export const questMeta: TemplateMeta = {
  id: 'quest',
  name: 'Хайрын адал явдал',
  nameMn: 'Хайрын адал явдал',
  tagline: 'Пастел өнгийн гар консол дээрх тоглоом — тэр чам руу алхаж, дурсамжаар дүүрэн авдруудыг нээнэ.',
  description:
    'Гэрэлтсэн ретро консол дээр START дарна. Тэр өөрөө гол дүрд тоглож, зүрх цуглуулан, эрдэнэсийн авдруудыг (12 хүртэл) нээнэ — авдар бүрээс таны зураг пикселээс тодорч, тэмдэглэл гарч ирнэ. Чам руу ойртох тусам өдөр үдэш, дараа нь шөнө болж, эцэст нь зүрхэн хаалган дээр тантай уулзаад асуултад тань хариулна. Пиксел салют, чиптюн хөгжим, эцсийн оноо.',
  category: 'Бүх үйл явдалд',
  badge: 'ОНЦЛОХ',
  price: 300,
  cover: '/covers/quest.jpg',
  accent: '#ff5d8f',
  features: ['Жинхэнэ тоглоом', '12 хүртэл дурсамжийн авдар', 'Өөрсдийн дүр', 'Чиптюн хөгжим', 'Пиксел салют'],
  schema: [
    {
      id: 'game', title: 'Тоглоом ба консол', summary: 'Тоглоомын нүүр дэлгэц ба консолын өнгө — бэлгийг нээхэд хамгийн түрүүнд харагдана.', short: 'Тоглоом', previewPage: 'title',
      fields: [
        { type: 'text', key: 'title', label: 'Тоглоомын нэр', max: 16, placeholder: 'ХАЙРЫН АЯЛАЛ' },
        { type: 'text', key: 'subtitle', label: 'Дэд гарчиг', max: 36 },
        { type: 'color', key: 'consoleColor', label: 'Консолын өнгө', presets: ['#FF8FB8', '#B9A3FF', '#8FE3C7', '#FFD66B', '#FF7A7A', '#8EC9FF'] },
        { type: 'date', notFuture: true, key: 'startDate', label: 'Үерхэж эхэлсэн өдөр (заавал биш)', help: 'Тоглоомын дээд хэсэг болон эцсийн оноонд «…-р өдөр» гэж гарна.' },
      ],
    },
    {
      id: 'chars', title: 'Дүрүүд', summary: 'Тоглоомын хоёр дүр: тэр тоглогч болно, та төгсгөлд нь зүрхэн хаалган дээр хүлээнэ.', short: 'Дүрүүд', previewPage: 'characters',
      description: 'Тэр өөрөө тоглоно. Та түүнийг төгсгөлд нь хүлээж байна.',
      fields: [
        { type: 'text', key: 'playerName', label: 'Түүний нэр (тоглогч)', max: 14, required: true },
        { type: 'select', key: 'playerLook', label: 'Түүний дүр', options: looks },
        { type: 'color', key: 'playerColor', label: 'Түүний хувцасны өнгө', presets: outfits },
        { type: 'text', key: 'npcName', label: 'Таны нэр', max: 14, required: true },
        { type: 'select', key: 'npcLook', label: 'Таны дүр', options: looks },
        { type: 'color', key: 'npcColor', label: 'Таны хувцасны өнгө', presets: outfits },
      ],
    },
    {
      id: 'memories', title: 'Эрдэнэсийн авдрууд (дурсамж)', summary: 'Замын дагуух эрдэнэсийн авдрууд — авдар бүр нэг зураг, нэг дурсамж нээнэ.', short: 'Авдрууд', previewPage: 'chest:0',
      description: 'Авдар бүр нэг зураг + тэмдэглэл нээнэ. 12 хүртэл авдар нэмж болно. Картыг чирж дарааллыг нь солино.',
      cards: { count: 12, image: 'memoryPhotos', title: 'memoryTitles', text: 'memoryTexts', itemLabel: 'Авдар', previewPrefix: 'chest:', placeholders: NOTES },
      fields: [
        { type: 'images', key: 'memoryPhotos', label: 'Авдрын зургууд (дарааллаар)', max: 12 },
        { type: 'list', key: 'memoryTitles', label: 'Авдрын гарчиг', count: 12, max: 22, itemLabel: 'Гарчиг' },
        { type: 'list', key: 'memoryTexts', label: 'Авдрын тэмдэглэл', count: 12, max: 160, itemLabel: 'Тэмдэглэл', placeholders: NOTES },
      ],
    },
    {
      id: 'story', title: 'Түүх ба сүүлийн асуулт', summary: 'Тоглоомын яриа: эхлэлийн мэндчилгээ, таны асуулт, хоёр хариулт, төгсгөлийн мессеж.', short: 'Түүх', previewPage: 'dialog:intro',
      fields: [
        { type: 'textarea', key: 'intro', label: 'Эхлэлийн мессеж', max: 160, rows: 3, previewPage: 'dialog:intro' },
        { type: 'textarea', key: 'npcGreeting', label: 'Тэр тан дээр ирэхэд хэлэх үг', max: 160, rows: 3, previewPage: 'dialog:greeting' },
        { type: 'text', key: 'question', label: 'Таны асуулт', max: 70, previewPage: 'dialog:question' },
        { type: 'text', key: 'yesA', label: 'Хариултын 1-р товч', max: 12, previewPage: 'dialog:question' },
        { type: 'text', key: 'yesB', label: 'Хариултын 2-р товч', max: 12, previewPage: 'dialog:question' },
        { type: 'textarea', key: 'ending', label: 'Төгсгөлийн мессеж', max: 220, rows: 4, previewPage: 'ending' },
      ],
    },
  ],
  tour: ['title', 'characters', 'chest:0', 'chest:2', 'dialog:question', 'ending'],
  defaults: {
    title: 'ХАЙРЫН АЯЛАЛ',
    subtitle: 'Зүрх рүү чинь хүрэх зам',
    consoleColor: '#FF8FB8',
    startDate: '',
    playerName: 'Ану',
    playerLook: 'girl',
    playerColor: '#FF5D8F',
    npcName: 'Бат',
    npcLook: 'boy',
    npcColor: '#5B8CFF',
    memoryPhotos: [],
    memoryTitles: ['Анхны «сайн уу»', 'Анхны болзоо', 'Тэр аялал', 'Тэнэг хоёр', 'Яг одоо'],
    memoryTexts: ['', '', '', '', ''],
    intro: 'Сайн уу! Энэ замд дурсамжууд нуугдаж байна. Авдар бүрийг нээгээд, зүрхнүүдийг дагаад төгсгөл хүртэл яваарай...',
    npcGreeting: 'Чи бүх дурсамжийг олчихлоо... тэгээд намайг ч олчихлоо. Би чамайг хүлээж байсан.',
    question: 'Энэ тоглоомыг надтай үүрд хамт тоглох уу?',
    yesA: 'ТИЙМ ♥',
    yesB: 'МЭДЭЭЖ!!',
    ending: 'Миний 2-р тоглогч болсонд баярлалаа.\nЧамтай бол түвшин бүр илүү гоё.',
    music: '',
  },
  previewDebounceMs: 150,
  demo: { memoryTexts: NOTES, memoryPhotos: [COUPLES[0], PHOTOS.mnGer2, COUPLES[2], PHOTOS.mnYurtsSnow, COUPLES[6]], startDate: '2024-01-10' },
};
