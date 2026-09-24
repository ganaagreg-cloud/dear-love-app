import Link from 'next/link';
import { formatMnt } from '@/templates/registry';
import type { TemplateMeta } from '@/templates/types';

export default function TemplateCard({ t }: { t: TemplateMeta }) {
  return (
    <article className="tcard">
      <Link href={`/templates/${t.id}`} className="tcard-media" aria-label={`${t.name} — жишээ үзэх`}>
        <img src={t.cover} alt="" loading="lazy" />
        <span className="tcard-tag">{t.category}</span>
      </Link>
      <div className="tcard-body">
        <div className="tcard-head">
          <h3>{t.name}</h3>
          {t.badge && <span className="badge">{t.badge}</span>}
        </div>
        <p>{t.tagline}</p>
        <div className="chips">{t.features.slice(0, 4).map((f) => <span className="chip" key={f}>{f}</span>)}</div>
        <div className="tcard-foot">
          <span className="price">{formatMnt(t.price)}<small>нэг удаа</small></span>
          <div className="tcard-actions">
            <Link href={`/templates/${t.id}`} className="btn btn-sm">Үзэх</Link>
            <Link href={`/buy/${t.id}`} className="btn btn-sm btn-rose">Үүсгэх</Link>
          </div>
        </div>
      </div>
    </article>
  );
}
