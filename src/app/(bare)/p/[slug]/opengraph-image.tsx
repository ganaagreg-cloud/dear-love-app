import { OG_SIZE, OG_TYPE, coverUrl, ogCard } from '@/lib/og';
import { getPublicPage } from '@/lib/publicPage';
import { getTemplate } from '@/templates/registry';

export const alt = 'Хэн нэгэн танд зориулж юм хийжээ';
export const size = OG_SIZE;
export const contentType = OG_TYPE;

/** A gift is a surprise: the preview shows the template's look but nothing the buyer wrote. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const page = /^[a-z0-9-]{3,40}$/.test(slug) ? await getPublicPage(slug) : null;
  const t = page && getTemplate(page.template_id);
  return ogCard({
    title: 'Танд зориулсан бэлэг байна',
    sub: 'Дуугаа асаагаад, тайван нэг минут гаргаж нээгээрэй',
    pill: 'Нээхийн тулд дарна уу',
    covers: [coverUrl(t ? t.id : 'wrapped')],
  });
}
