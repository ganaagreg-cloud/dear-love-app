import { locketMeta } from './locket/meta';
import { bookMeta } from './book/meta';
import { netflixMeta } from './netflix/meta';
import { questMeta } from './quest/meta';
import { wrappedMeta } from './wrapped/meta';
import { flightMeta } from './flight/meta';
import { allFields, type Content, type TemplateMeta } from './types';
import { isLibraryUrl } from '@/lib/music';

export const TEMPLATES: TemplateMeta[] = [wrappedMeta, flightMeta, questMeta, locketMeta, bookMeta, netflixMeta];
export const getTemplate = (id: string) => TEMPLATES.find((t) => t.id === id);

export const formatMnt = (n: number) => `${n.toLocaleString('en-US')}₮`;

/** What the viewer renders: defaults ← (demo when previewing) ← the buyer's saved content. */
export function resolveContent(meta: TemplateMeta, content: Content | null, demo = false): Content {
  const out = { ...meta.defaults, ...(demo ? meta.demo : {}), ...(content ?? {}) };
  // songs buyers uploaded before the music library existed no longer play
  for (const f of allFields(meta)) if (f.type === 'audio' && out[f.key] && !isLibraryUrl(out[f.key])) out[f.key] = '';
  return out;
}
