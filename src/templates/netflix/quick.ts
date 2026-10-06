import { arr, clip, str, type QuickSpec } from '../quick';

/**
 * The 4-step quick create flow is switched off for every template, so this only has to satisfy `QuickSpec`.
 * The editor still uses `read` — the two names — for the share-link suggestion and «Хүлээн авагч юу харах вэ?».
 */
export const netflixQuick: QuickSpec = {
  maxPhotos: 6,
  pins: { names: 'gate', photos: 'home', tone: 'home' },
  messageKey: 'synopsis',
  read: (c) => ({ them: str(c.name1), you: str(c.name2), date: '', photos: [str(c.profilePhoto), ...arr(c.trailerPhotos)].filter(Boolean) }),
  names: (q) => ({ name1: clip(q.them, 22), name2: clip(q.you, 22) }),
  photos: (q) => ({ profilePhoto: q.photos[0] ?? '', trailerPhotos: q.photos.slice(0, 6) }),
  texts: () => ({}),
};
