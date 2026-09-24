import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { isDemo } from '@/lib/env';
import { DEMO_DIR } from '@/lib/store';

const MIME: Record<string, string> = { webp: 'image/webp', jpg: 'image/jpeg', png: 'image/png', gif: 'image/gif', mp3: 'audio/mpeg', m4a: 'audio/mp4', aac: 'audio/aac', ogg: 'audio/ogg', wav: 'audio/wav' };

/** Demo mode only: serves locally uploaded files. */
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  if (!isDemo()) return new NextResponse(null, { status: 404 });
  const parts = (await params).path;
  if (parts.length !== 3 || parts.some((p) => !/^[A-Za-z0-9._-]+$/.test(p) || p.includes('..'))) return new NextResponse(null, { status: 400 });
  const file = path.join(DEMO_DIR, 'media', ...parts);
  try {
    const buf = await fs.readFile(file);
    return new NextResponse(new Uint8Array(buf), { headers: { 'content-type': MIME[parts[2].split('.').pop()!] ?? 'application/octet-stream', 'cache-control': 'public, max-age=31536000, immutable' } });
  } catch { return new NextResponse(null, { status: 404 }); }
}
