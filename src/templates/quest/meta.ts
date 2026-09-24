import type { TemplateMeta } from '../types';
import { COUPLES, PHOTOS } from '../photos';

const looks = [{ value: 'girl', label: 'Охин' }, { value: 'boy', label: 'Хүү' }];
const outfits = ['#FF5D8F', '#5B8CFF', '#FFB02E', '#2FC08D', '#9B6BFF', '#FF6B4A'];

export const questMeta: TemplateMeta = {
  id: 'quest',
  name: 'Хайрын адал явдал',
  nameMn: 'Хайрын адал явдал',
  tagline: 'Пастел өнгийн гар консол дээрх тоглоом — тэр чам руу алхаж, дурсамжаар дүүрэн авдруудыг нээнэ.',
  description:
    'Гэрэлтсэн ретро консол дээр START дарна. Тэр өөрөө гол дүрд тоглож, зүрх цуглуулан, 5 эрдэнэсийн авдар нээнэ — авдар бүрээс таны зураг пикселээс тодорч, тэмдэглэл гарч ирнэ. Чам руу ойртох тусам өдөр үдэш, дараа нь шөнө болж, эцэст нь зүрхэн хаалган дээр тантай уулзаад асуултад тань хариулна. Пиксел салют, чиптюн хөгжим, эцсийн оноо.',
  category: 'Бүх үйл явдалд',
  badge: 'ОНЦЛОХ',
  price: 29900,
  cover: '/covers/quest.jpg',
  accent: '#ff5d8f',
  features: ['Жинхэнэ тоглоом', '5 дурсамжийн авдар', 'Өөрсдийн дүр', 'Чиптюн хөгжим', 'Пиксел салют'],
  schema: [
    {
      id: 'game', title: 'Тоглоом ба консол',
      fields: [
        { type: 'text', key: 'title', label: 'Тоглоомын нэр', max: 16, placeholder: 'ХАЙРЫН АЯЛАЛ' },
        { type: 'text', key: 'subtitle', label: 'Дэд гарчиг', max: 36 },
        { type: 'color', key: 'consoleColor', label: 'Консолын өнгө', presets: ['#FF8FB8', '#B9A3FF', '#8FE3C7', '#FFD66B', '#FF7A7A', '#8EC9FF'] },
        { type: 'date', key: 'startDate', label: 'Үерхэж эхэлсэн өдөр (заавал биш)', help: 'Тоглоомын дээд хэсэг болон эцсийн оноонд «…-р өдөр» гэж гарна.' },
      ],
    },
    {
      id: 'chars', title: 'Дүрүүд',
      description: 'Тэр өөрөө тоглоно. Та түүнийг төгсгөлд нь хүлээж байна.',
      fields: [
        { type: 'text', key: 'playerName', label: 'Түүний нэр (тоглогч)', max: 14 },
        { type: 'select', key: 'playerLook', label: 'Түүний дүр', options: looks },
        { type: 'color', key: 'playerColor', label: 'Түүний хувцасны өнгө', presets: outfits },
        { type: 'text', key: 'npcName', label: 'Таны нэр', max: 14 },
        { type: 'select', key: 'npcLook', label: 'Таны дүр', options: looks },
        { type: 'color', key: 'npcColor', label: 'Таны хувцасны өнгө', presets: outfits },
      ],
    },
    {
      id: 'memories', title: 'Эрдэнэсийн авдрууд (дурсамж)',
      description: 'Авдар бүр нэг зураг + тэмдэглэл нээнэ. {player}, {npc}, {days} автоматаар бөглөгдөнө.',
      fields: [
        { type: 'images', key: 'memoryPhotos', label: 'Авдрын зургууд (дарааллаар)', max: 5 },
        { type: 'list', key: 'memoryTitles', label: 'Авдрын гарчиг', count: 5, max: 22, itemLabel: 'Гарчиг' },
        { type: 'list', key: 'memoryTexts', label: 'Авдрын тэмдэглэл', count: 5, max: 160, itemLabel: 'Тэмдэглэл' },
      ],
    },
    {
      id: 'story', title: 'Түүх ба сүүлийн асуулт',
      fields: [
        { type: 'textarea', key: 'intro', label: 'Эхлэлийн мессеж', max: 160, rows: 3 },
        { type: 'textarea', key: 'npcGreeting', label: 'Тэр тан дээр ирэхэд хэлэх үг', max: 160, rows: 3 },
        { type: 'text', key: 'question', label: 'Таны асуулт', max: 70 },
        { type: 'text', key: 'yesA', label: 'Хариултын 1-р товч', max: 12 },
        { type: 'text', key: 'yesB', label: 'Хариултын 2-р товч', max: 12 },
        { type: 'textarea', key: 'ending', label: 'Төгсгөлийн мессеж', max: 220, rows: 4 },
      ],
    },
    {
      id: 'music', title: 'Хөгжим',
      description: 'Хоосон орхивол тоглоомын чиптюн хөгжим эгшиглэнэ.',
      fields: [{ type: 'audio', key: 'music', label: 'Оронд нь өөрийн дуу (mp3, заавал биш)', maxMB: 10 }],
    },
  ],
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
    memoryTexts: [
      'Нэг найз «та хоёр танилцаач» гэсэн тэр өдөр. Хэн нэгний надад өгсөн хамгийн зөв зөвлөгөө.',
      'Би их сандарсан болохоор юу захиалснаа ч мартчихсан. Чи инээхэд л би дуусаа.',
      'Буруу эргэлт, муу хоол, төгс хамтрагч. Чамтай хамт дахиад төөрөхөд бэлэн.',
      'Миний хачин хошигнолыг чам шиг ойлгодог хүн байхгүй. Битгий инээхээ болиорой.',
      '{days} өдрийн дараа ч чи миний хамгийн дуртай газар хэвээрээ.',
    ],
    intro: 'Сайн уу, {player}! Хэн нэгэн энэ замын дагуу 5 дурсамж нуужээ. Авдар бүрийг нээгээд зүрхнүүдийг дагаад төгсгөл хүртэл яваарай...',
    npcGreeting: '{player}! Чи бүх дурсамжийг олчихлоо... тэгээд намайг ч олчихлоо. Би чамайг хүлээж байсан.',
    question: 'Энэ тоглоомыг надтай үүрд хамт тоглох уу?',
    yesA: 'ТИЙМ ♥',
    yesB: 'МЭДЭЭЖ!!',
    ending: 'Миний 2-р тоглогч болсонд баярлалаа.\nЧамтай бол түвшин бүр илүү гоё.\nХайртай, {npc}',
    music: '',
  },
  demo: { memoryPhotos: [COUPLES[0], PHOTOS.mnGer2, COUPLES[2], PHOTOS.mnYurtsSnow, COUPLES[6]], startDate: '2024-01-10' },
};
