import { allFields, type Content, type Field, type TemplateMeta } from './types';

const COLOR = /^#[0-9a-fA-F]{6}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const SPOTIFY = /(?:open\.spotify\.com\/(?:intl-[a-z]+\/)?track\/|spotify:track:)?([A-Za-z0-9]{22})/;

export const spotifyId = (v: string) => v.match(SPOTIFY)?.[1] ?? '';

const clip = (v: unknown, max = 2000) =>
  typeof v === 'string' ? v.replace(/\r\n/g, '\n').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').slice(0, max) : '';

/**
 * Server-side gate for every save. Only keys declared in the template schema survive,
 * every value is coerced to its field type, and media URLs must live in THIS page's folder.
 */
export function sanitizeContent(meta: TemplateMeta, input: unknown, mediaPrefix: string): Content {
  const src = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const out: Content = {};
  const okMedia = (u: unknown) => (typeof u === 'string' && u.startsWith(mediaPrefix) && u.length < 600 ? u : '');

  for (const f of allFields(meta) as Field[]) {
    if (!(f.key in src)) continue;
    const v = src[f.key];
    switch (f.type) {
      case 'text': case 'textarea': out[f.key] = clip(v, f.max ?? 2000); break;
      case 'image': case 'audio': out[f.key] = okMedia(v); break;
      case 'images': out[f.key] = (Array.isArray(v) ? v : []).map(okMedia).filter(Boolean).slice(0, f.max); break;
      case 'color': out[f.key] = typeof v === 'string' && COLOR.test(v) ? v : String(meta.defaults[f.key] ?? '#ffffff'); break;
      case 'date': out[f.key] = typeof v === 'string' && DATE.test(v) ? v : String(meta.defaults[f.key] ?? ''); break;
      case 'select': out[f.key] = f.options.some((o) => o.value === v) ? (v as string) : String(meta.defaults[f.key] ?? f.options[0].value); break;
      case 'toggle': out[f.key] = v === true; break;
      case 'list': {
        const arr = Array.isArray(v) ? v : [];
        out[f.key] = Array.from({ length: f.count }, (_, i) => clip(arr[i], f.max ?? 200));
        break;
      }
      case 'spotify': out[f.key] = typeof v === 'string' ? spotifyId(v) : ''; break;
    }
  }
  return out;
}
