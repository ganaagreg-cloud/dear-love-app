import type { TemplateMeta } from '../types';
import { COUPLES, PHOTOS } from '../photos';

const blankOverride = 'Хоосон орхивол сонгосон үйл явдлын үндсэн бичвэр гарна.';

export const netflixMeta: TemplateMeta = {
  id: 'netflix',
  name: 'LoveFlix',
  nameMn: 'LoveFlix',
  tagline: 'Та хоёрын гол дүрд тоглосон стриминг апп — сонголттой интерактив ангитай.',
  description:
    '«Хэн үзэж байна?», «та-дам» эхлэл, та хоёрын зурагтай мөрүүд, Топ-5 шалтгаан, замаа өөрөө сонгох анги, эцэст нь «ТИЙМ» дардаг финал. 4 төрөл: болзоонд урих, төрсөн өдөр, ой, хайрын захидал.',
  category: 'Болзоонд урих',
  badge: 'ШИНЭ',
  price: 19900,
  cover: '/covers/netflix.jpg',
  accent: '#e50914',
  features: ['4 төрөл', '11 хүртэл зураг', 'Интерактив анги', 'Зугтдаг «Үгүй» товч', 'Кино титр'],
  schema: [
    {
      id: 'basics', title: 'Төрөл ба нэрс', previewPage: 'browse',
      fields: [
        {
          type: 'select', key: 'occasion', label: 'Ямар үйл явдал вэ?',
          options: [
            { value: 'ask_out', label: 'Болзоонд урих' }, { value: 'birthday', label: 'Төрсөн өдөр' },
            { value: 'anniversary', label: 'Ой' }, { value: 'love_message', label: 'Хайрын захидал' },
          ],
        },
        { type: 'text', key: 'partnerName', label: 'Түүний нэр', max: 24 },
        { type: 'text', key: 'yourName', label: 'Таны нэр', max: 24 },
        { type: 'color', key: 'accent', label: 'Үндсэн өнгө', presets: ['#E50914', '#FF4D8D', '#8B5CF6', '#F59E0B', '#10B981'] },
        { type: 'toggle', key: 'funnyNoButton', label: 'Зугтдаг «Үгүй» товч (болзоонд урихад)' },
        { type: 'text', key: 'songName', label: 'Таны дуу (титрт гарна)', max: 60 },
      ],
    },
    {
      id: 'photos', title: 'Зургууд', previewPage: 'browse',
      fields: [
        { type: 'image', key: 'profilePhoto', label: 'Профайл зураг («Хэн үзэж байна?»)' },
        { type: 'image', key: 'heroPhoto', label: 'Том нүүр зураг' },
        { type: 'images', key: 'cwPhotos', label: '«Үргэлжлүүлэх» мөр', max: 4 },
        { type: 'images', key: 'hitPhotos', label: '«Тренд» мөр', max: 4 },
        { type: 'image', key: 'ep1Bg', label: 'Ангийн 1-р хэсгийн ар зураг' },
        { type: 'image', key: 'ep2Bg', label: 'Ангийн 2-р хэсгийн ар зураг' },
        { type: 'image', key: 'climaxBg', label: 'Финалын ар зураг' },
      ],
    },
    {
      id: 'show', title: 'Цуврал', previewPage: 'browse',
      description: blankOverride,
      fields: [
        { type: 'text', key: 'ov.heroTitle', label: 'Цувралын нэр', max: 40 },
        { type: 'textarea', key: 'ov.synopsis', label: 'Товч агуулга', max: 220, rows: 3 },
        { type: 'text', key: 'ov.row1', label: '1-р мөрийн гарчиг', max: 40 },
        { type: 'list', key: 'ov.cw', label: '1-р мөрийн картууд', count: 4, max: 30, itemLabel: 'Карт' },
        { type: 'text', key: 'ov.row2', label: 'Топ 5-ын гарчиг', max: 40 },
        { type: 'list', key: 'ov.reasons', label: 'Топ 5 шалтгаан', count: 5, max: 40, itemLabel: 'Шалтгаан' },
        { type: 'text', key: 'ov.row3', label: '3-р мөрийн гарчиг', max: 40 },
        { type: 'list', key: 'ov.hits', label: '3-р мөрийн картууд', count: 4, max: 30, itemLabel: 'Карт' },
      ],
    },
    {
      id: 'episode', title: 'Интерактив анги', previewPage: 'episode',
      description: blankOverride,
      fields: [
        { type: 'textarea', key: 'ov.ep1Narration', label: '1-р хэсгийн үг', max: 220, rows: 3 },
        { type: 'text', key: 'ov.ep1a', label: '1-р хэсэг · сонголт А', max: 30 },
        { type: 'text', key: 'ov.ep1b', label: '1-р хэсэг · сонголт Б', max: 30 },
        { type: 'textarea', key: 'ov.ep2Narration', label: '2-р хэсгийн үг', max: 220, rows: 3 },
        { type: 'text', key: 'ov.ep2a', label: '2-р хэсэг · сонголт А', max: 30 },
        { type: 'text', key: 'ov.ep2b', label: '2-р хэсэг · сонголт Б', max: 30 },
        { type: 'text', key: 'ov.climaxTitle', label: 'Финалын асуулт / гарчиг', max: 50 },
        { type: 'text', key: 'ov.climaxSub', label: 'Финалын доорх бичвэр', max: 80 },
      ],
    },
  ],
  defaults: {
    occasion: 'anniversary',
    pronoun: 'she',
    partnerName: 'Ану',
    yourName: '',
    accent: '#E50914',
    funnyNoButton: false,
    songName: '',
    profilePhoto: '', heroPhoto: '', ep1Bg: '', ep2Bg: '', climaxBg: '',
    cwPhotos: [], hitPhotos: [],
  },
  demo: {
    occasion: 'ask_out', partnerName: 'Ану', yourName: 'Бат', funnyNoButton: true,
    profilePhoto: COUPLES[3], heroPhoto: PHOTOS.mnYurtsSnow,
    cwPhotos: [COUPLES[0], COUPLES[1], COUPLES[2], COUPLES[4]], hitPhotos: [COUPLES[5], PHOTOS.ubNight, COUPLES[6], PHOTOS.mnGer2],
    ep1Bg: PHOTOS.ubNight, ep2Bg: PHOTOS.mnHills, climaxBg: COUPLES[7],
  },
};
