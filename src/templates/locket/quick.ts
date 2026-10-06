import { arr, clip, str, type QuickSpec } from '../quick';

/**
 * The 4-step quick create flow is switched off, so there is no tone text here any more — the editor only uses
 * `read` (the two names, for the share-link suggestion and «Хүлээн авагч юу харах вэ?»). The rest stays so the
 * spec still satisfies `QuickSpec` if the flow is ever brought back.
 */
export const locketQuick: QuickSpec = {
  maxPhotos: 7,
  pins: { names: null, photos: null, tone: null },
  messageKey: 'letterBody',
  read: (c) => ({ them: str(c.to), you: str(c.from), date: str(c.startDate), photos: [...arr(c.locketPhotos), ...arr(c.memoryPhotos)].filter(Boolean) }),
  names: (q) => ({ to: clip(q.them, 40), from: clip(q.you, 40), startDate: q.date || new Date().toISOString().slice(0, 10) }),
  // the first two open inside the heart locket, the next five become the memory polaroids
  photos: (q) => ({ locketPhotos: q.photos.slice(0, 2), memoryPhotos: q.photos.slice(2, 7) }),
  texts: () => ({}),
};
