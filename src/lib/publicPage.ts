import 'server-only';
import { revalidateTag, unstable_cache } from 'next/cache';
import { store } from './store';

const tag = (slug: string) => `public:${slug}`;

/** Published page by slug, cached for 60s so a crowd of viewers costs one DB read, not one per view. */
export const getPublicPage = (slug: string) =>
  unstable_cache(() => store().getPublishedBySlug(slug), ['public-page', slug], { tags: [tag(slug)], revalidate: 60 })();

/** Call after anything that changes what a public link shows (save, publish, unpublish, slug change). */
export function bustPublicPage(...slugs: (string | null | undefined)[]) {
  for (const s of new Set(slugs)) if (s) revalidateTag(tag(s), { expire: 0 });
}
