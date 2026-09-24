import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { isDemo } from '@/lib/env';
import { getUser } from '@/lib/supabase/server';
import { ownedPage } from '@/lib/pages';
import { DEMO_DIR } from '@/lib/store';

const TYPES: Record<string, string> = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'audio/mpeg': 'mp3', 'audio/mp4': 'm4a', 'audio/x-m4a': 'm4a', 'audio/aac': 'aac', 'audio/ogg': 'ogg', 'audio/wav': 'wav' };

/** Demo mode only — in production files go straight to Supabase Storage from the browser. */
export async function POST(req: Request) {
  if (!isDemo()) return NextResponse.json({ error: 'Not available' }, { status: 404 });
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Эхлээд нэвтэрнэ үү' }, { status: 401 });
  const form = await req.formData();
  const pageId = String(form.get('pageId') ?? '');
  const file = form.get('file');
  const page = await ownedPage(pageId, user.id);
  if (!page || !page.paid_at) return NextResponse.json({ error: 'Энэ хуудсанд файл оруулах эрхгүй байна' }, { status: 403 });
  if (!(file instanceof Blob)) return NextResponse.json({ error: 'Файл алга' }, { status: 400 });
  const ext = TYPES[file.type];
  if (!ext) return NextResponse.json({ error: 'Энэ төрлийн файлыг дэмжихгүй' }, { status: 415 });
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'Файл хэт том (10MB хүртэл)' }, { status: 413 });
  const name = `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
  const dir = path.join(DEMO_DIR, 'media', user.id, page.id);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ url: `/api/media/${user.id}/${page.id}/${name}` });
}
