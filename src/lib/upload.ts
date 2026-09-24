'use client';
import { supabaseBrowser } from './supabase/client';

const rand = () => Math.random().toString(36).slice(2, 8);
const USE_SUPABASE = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

/** Resize + re-encode photos in the browser (fast uploads, strips EXIF/GPS). */
export async function compressImage(file: File, maxSide = 1800, quality = 0.86): Promise<Blob> {
  if (file.type === 'image/gif') return file;
  const bmp = await createImageBitmap(file).catch(() => null);
  if (!bmp) throw new Error('Энэ зургийн форматыг дэмжихгүй байна — JPG, PNG эсвэл WebP ашиглана уу.');
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, w, h);
  bmp.close?.();
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/webp', quality));
  return blob ?? file;
}

export async function uploadMedia(file: File, userId: string, pageId: string, kind: 'image' | 'audio', maxMB = 10) {
  let body: Blob = file, ext = file.name.split('.').pop()?.toLowerCase() || 'bin', type = file.type;
  if (kind === 'image') {
    if (!file.type.startsWith('image/')) throw new Error('Зургийн файл сонгоно уу.');
    body = await compressImage(file);
    if (body !== file) { ext = 'webp'; type = 'image/webp'; }
  } else if (!file.type.startsWith('audio/')) {
    throw new Error('Аудио файл (mp3) сонгоно уу.');
  }
  if (body.size > maxMB * 1024 * 1024) throw new Error(`Файл хэт том байна (${maxMB} MB хүртэл).`);

  if (!USE_SUPABASE) {
    const fd = new FormData();
    fd.append('pageId', pageId);
    fd.append('file', new File([body], `upload.${ext}`, { type }));
    const r = await fetch('/api/uploads', { method: 'POST', body: fd });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || 'Файл оруулж чадсангүй.');
    return j.url as string;
  }
  const path = `${userId}/${pageId}/${Date.now()}-${rand()}.${ext.replace(/[^a-z0-9]/g, '')}`;
  const sb = supabaseBrowser();
  const { error } = await sb.storage.from('media').upload(path, body, { contentType: type, upsert: false, cacheControl: '31536000' });
  if (error) throw new Error(error.message.includes('row-level') ? 'Энэ хуудсанд файл оруулах эрхгүй байна.' : error.message);
  return sb.storage.from('media').getPublicUrl(path).data.publicUrl;
}
