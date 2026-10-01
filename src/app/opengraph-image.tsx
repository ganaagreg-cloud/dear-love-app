import { OG_SIZE, OG_TYPE, coverUrl, ogCard } from '@/lib/og';

export const alt = 'Dear Love — хайртай хүндээ зориулсан дижитал бэлэг';
export const size = OG_SIZE;
export const contentType = OG_TYPE;

export default function Image() {
  return ogCard({
    title: 'Хайртай хүндээ дижитал бэлэг',
    sub: 'Загвараа сонго, зураг дуугаа оруул, нэг линкээр илгээ',
    pill: 'dearlove.mn',
    covers: ['wrapped', 'locket', 'flight'].map(coverUrl),
  });
}
