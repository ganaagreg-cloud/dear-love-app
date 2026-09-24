import 'server-only';
import { store, type PageRow } from './store';
import { SUPABASE_URL, isDemo } from './env';

export type { PageRow };

/** URL prefix every media file of this page must start with (enforced on save). */
export const mediaPrefix = (userId: string, pageId: string) =>
  isDemo() ? `/api/media/${userId}/${pageId}/` : `${SUPABASE_URL}/storage/v1/object/public/media/${userId}/${pageId}/`;

/** Loads a page only if it belongs to `userId`. */
export async function ownedPage(pageId: string, userId: string): Promise<PageRow | null> {
  if (!/^[0-9a-f-]{36}$/i.test(pageId)) return null;
  const p = await store().getPage(pageId);
  return p && p.user_id === userId ? p : null;
}
