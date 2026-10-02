import data from './music.json';

/**
 * The only music a gift can play. Buyers pick from this list — they can't upload their own,
 * so we never host or serve music we don't have the rights to.
 *
 * To add a track: put the licensed file in `public/music/` and add it to `music.json`:
 *   { "id": "soft-piano", "title": "Зөөлөн төгөлдөр хуур", "mood": "Романтик", "file": "soft-piano.mp3" }
 * (keep the license/source of every track in `public/music/SOURCES.md`).
 */
export type Track = { id: string; title: string; mood: string; file: string };

export const MUSIC: Track[] = (data as { tracks: Track[] }).tracks;
export const musicUrl = (t: Track) => `/music/${t.file}`;
export const isLibraryUrl = (u: unknown): u is string => typeof u === 'string' && MUSIC.some((t) => musicUrl(t) === u);
