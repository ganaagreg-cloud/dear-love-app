import { LINES, arr, clip, pad, str, type QuickSpec, type Tone } from '../quick';

const MAX = 11;

const SHOW: Record<Tone, { synopsis: (them: string) => string; reasons: string[]; climaxSub: string }> = {
  cute: {
    synopsis: (t) => `${t} гэдэг хөөрхөн хүн нэгэн өдөр гэнэт миний амьдралд орж ирлээ. Үүнээс хойш бүх юм хөөрхөн болсон.`,
    reasons: ['Чиний инээд', 'Чиний «идсэн үү?»', 'Дулаахан тэврэлт', 'Хамт идсэн хоол', 'Зүгээр л чи'],
    climaxSub: 'Дараагийн анги ч гэсэн хамтдаа.',
  },
  romantic: {
    synopsis: (t) => `Хоёр хүн. Нэг санамсаргүй уулзалт. ${t}-тэй хамт бичигдэж буй хамгийн гоё түүх — дуусашгүй цуврал.`,
    reasons: ['Чиний инээмсэглэл', 'Анх гараа атгасан мөч', 'Оддын доорх яриа', 'Чимээгүй тэврэлт', 'Бидний маргааш'],
    climaxSub: 'Юу ч болсон би чамайг сонгоно.',
  },
  funny: {
    synopsis: (t) => `${t} нэг л өдөр намайг тэвчихээр шийдсэн. Үзэгчид одоо ч итгэхгүй байна. Ангиудын 90% нь хоолны тухай.`,
    reasons: ['Миний хошигнолд инээдэг', 'Хоолоо хуваалцдаг', 'Хөнжлөө булаацалддаг', 'Навигацад итгэдэг', 'Намайг тэвчдэг'],
    climaxSub: '«Үгүй» гэдэг товч ажиллахгүй. Уучлаарай.',
  },
  simple: {
    synopsis: (t) => `${t} ба би. Бидний түүх.`,
    reasons: ['Инээд', 'Аялал', 'Яриа', 'Тэврэлт', 'Бид'],
    climaxSub: 'Хамтдаа.',
  },
};

export const netflixQuick: QuickSpec = {
  maxPhotos: MAX,
  pins: { names: 'profiles', photos: 'browse', tone: 'browse' },
  messageKey: 'ov.synopsis',
  read: (c) => ({
    them: str(c.partnerName), you: str(c.yourName), date: '',
    photos: [str(c.heroPhoto), str(c.profilePhoto), str(c.climaxBg), ...arr(c.cwPhotos), str(c.ep1Bg), str(c.ep2Bg), ...arr(c.hitPhotos)].filter(Boolean),
  }),
  names: (q) => ({ partnerName: clip(q.them, 24), yourName: clip(q.you, 24) }),
  // most visible first: the big hero, the profile avatar, the finale, then the rows and episode backdrops
  photos: (q) => {
    const p = (i: number) => q.photos[i] ?? '';
    return {
      heroPhoto: p(0), profilePhoto: p(1), climaxBg: p(2),
      cwPhotos: pad(q.photos.slice(3, 7), 4), ep1Bg: p(7), ep2Bg: p(8), hitPhotos: pad(q.photos.slice(9, 11), 4),
    };
  },
  texts: (q) => {
    const s = SHOW[q.tone], them = q.them || 'Чи';
    return {
      'ov.synopsis': clip(q.message?.trim() || s.synopsis(them), 220),
      'ov.reasons': s.reasons,
      'ov.climaxSub': clip(q.tone === 'simple' ? LINES.simple.question : s.climaxSub, 80),
    };
  },
};
