/** Mongolian Cyrillic → Latin, the way people usually spell their names in usernames. */
const MAP: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'j', з: 'z', и: 'i', й: 'i', к: 'k', л: 'l', м: 'm',
  н: 'n', о: 'o', ө: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ү: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh',
  щ: 'sh', ъ: '', ы: 'y', ь: 'i', э: 'e', ю: 'yu', я: 'ya',
};
export const latin = (s: string) => [...s.toLowerCase()].map((c) => MAP[c] ?? c).join('');

/** «Номин», «Тэмүүлэн» → "nomin-temuulen" (a friendly first link name; the server makes it unique). */
export function suggestSlug(...names: string[]) {
  return names.map((n) => latin(n.trim()).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')).filter(Boolean).join('-').slice(0, 36).replace(/-$/, '');
}
