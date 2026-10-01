import { OG_SIZE, OG_TYPE, templateOgCard } from '@/lib/og';

export const alt = 'Dear Love — дижитал бэлгийн загвар';
export const size = OG_SIZE;
export const contentType = OG_TYPE;

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  return templateOgCard((await params).id);
}
