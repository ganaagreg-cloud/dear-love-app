import { LINES, arr, clip, memories, pad, str, type QuickSpec, type Tone } from '../quick';

const MAX = 12;
/** One chest per photo (at least 3 so there's still a game), or 5 text-only chests. */
const chests = (photos: number) => (photos ? Math.max(3, Math.min(MAX, photos)) : 5);

const TITLE: Record<Tone, [string, string]> = {
  cute: ['ЗҮРХНИЙ АЯЛАЛ', 'Хөөрхөн дурсамжуудын зам'],
  romantic: ['ХАЙРЫН АЯЛАЛ', 'Зүрх рүү чинь хүрэх зам'],
  funny: ['ХАЙРЫН ТОГЛООМ', 'Хэцүү түвшин: намайг тэвчих'],
  simple: ['БИДНИЙ АЯЛАЛ', 'Хамтдаа туулсан зам'],
};

export const questQuick: QuickSpec = {
  maxPhotos: MAX,
  pins: { names: 'characters', photos: 'chest:0', tone: 'dialog:intro' },
  messageKey: 'ending',
  read: (c) => ({ them: str(c.playerName), you: str(c.npcName), date: str(c.startDate), photos: arr(c.memoryPhotos).filter(Boolean) }),
  names: (q) => ({ playerName: clip(q.them, 14), npcName: clip(q.you, 14), startDate: q.date }),
  photos: (q) => ({ memoryPhotos: pad(q.photos.slice(0, MAX), MAX) }),
  texts: (q) => {
    const n = chests(q.photos.length), L = LINES[q.tone], mem = memories(q.tone, n);
    // {player}/{npc}/{days} stay as tokens — the game fills them in live (and {days} keeps counting).
    return {
      title: TITLE[q.tone][0], subtitle: TITLE[q.tone][1],
      memoryTitles: pad(mem.map((m) => m.title), MAX),
      memoryTexts: pad(mem.map((m, i) => (i === n - 1 && q.date ? `${m.note} ({days} дахь өдөр)` : m.note)), MAX),
      intro: `${L.hello('{player}')} Замын дагуу ${n} дурсамж нуугдаж байна — авдар бүрийг нээгээд зүрхнүүдийг дагаарай.`,
      npcGreeting: q.tone === 'funny'
        ? '{player}! Бүх авдрыг олчихлоо. Одоо сүүлийн бэрхшээл: би.'
        : '{player}! Чи бүх дурсамжийг олчихлоо... тэгээд намайг ч олчихлоо.',
      question: L.question, yesA: L.yes[0], yesB: L.yes[1],
      ending: q.message?.trim() || `${L.message('{player}', '{npc}', 0)}\n${L.signoff} {npc}`,
    };
  },
};
