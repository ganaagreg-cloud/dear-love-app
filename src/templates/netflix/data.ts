import type { Copy, Occasion, Pronoun } from './copy';

/** Everything customizable lives here. Photos: put files in /public and use '/photo.jpg', or any URL. */
export const data = {
  occasion: 'ask_out' as Occasion, // ask_out | birthday | anniversary | love_message
  pronoun: 'she' as Pronoun,
  partnerName: 'Her Name',
  yourName: 'Ganaa',
  accent: '#E50914',
  funnyNoButton: false,
  /** true = show placeholder cards even without photos (handy while building). Set false for the real gift. */
  previewPlaceholders: true,
  songName: '',
  profilePhoto: '',
  heroPhoto: '',
  cwPhotos: ['', '', '', ''],
  hitPhotos: ['', '', '', ''],
  ep1Bg: '',
  ep2Bg: '',
  climaxBg: '',
  overrides: {} as Partial<Copy>, // any COPY key can be overridden
};

export type LoveData = typeof data;
