import { locketMeta } from './locket/meta';
import { bookMeta } from './book/meta';
import { netflixMeta } from './netflix/meta';
import { questMeta } from './quest/meta';
import { wrappedMeta } from './wrapped/meta';
import { flightMeta } from './flight/meta';
import type { Content, TemplateMeta } from './types';

export const TEMPLATES: TemplateMeta[] = [wrappedMeta, flightMeta, questMeta, locketMeta, bookMeta, netflixMeta];
export const getTemplate = (id: string) => TEMPLATES.find((t) => t.id === id);

export const formatMnt = (n: number) => `${n.toLocaleString('en-US')}₮`;

/** What the viewer renders: defaults ← (demo when previewing) ← the buyer's saved content. */
export function resolveContent(meta: TemplateMeta, content: Content | null, demo = false): Content {
  return { ...meta.defaults, ...(demo ? meta.demo : {}), ...(content ?? {}) };
}
