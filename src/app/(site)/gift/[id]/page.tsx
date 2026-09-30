import Link from 'next/link';
import { notFound } from 'next/navigation';
import TourEmbed from '@/components/TourEmbed';
import { TEMPLATES, formatMnt, getTemplate, resolveContent } from '@/templates/registry';
import './gift.css';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const t = getTemplate((await params).id);
  return t ? { title: t.name, description: t.tagline } : { title: 'Загвар' };
}

const FAQ = [
  { q: 'Хэр удаан хадгалагдах вэ?', a: 'Нийтэлсэн бэлэг тань линкээрээ байнга нээгдэнэ — та өөрөө «Нийтлэлээс буцаах» хүртэл.' },
  { q: 'Утсан дээр ажиллах уу?', a: 'Тийм. Бүх загвар утсанд зориулж хийгдсэн — ямар ч апп суулгах шаардлагагүй, линкээ нээхэд л болно.' },
  { q: 'Нийтэлсний дараа засах боломжтой юу?', a: 'Тийм. Засвар тань шууд харагдана, линк өөрчлөгдөхгүй.' },
  { q: 'Хүлээн авагч бүртгүүлэх шаардлагатай юу?', a: 'Үгүй — зөвхөн линк нээнэ.' },
];

/** Template detail: live silent demo, how it works in 3 steps, FAQ, buy. */
export default async function GiftPage({ params }: { params: Promise<{ id: string }> }) {
  const t = getTemplate((await params).id);
  if (!t) notFound();
  const others = TEMPLATES.filter((x) => x.id !== t.id);
  const fan = [others[0], t, others[1]].filter(Boolean);
  return (
    <div className="container gift">
      <section className="gift-top">
        <div className="gift-demo">
          <TourEmbed templateId={t.id} content={resolveContent(t, null, true)} tour={t.tour} />
          <p className="gift-demo-cap">Хүлээн авагч ингэж харна · <Link href={`/templates/${t.id}`}>дуутай, бүтнээр нь үзэх ▶</Link></p>
        </div>
        <div className="gift-info">
          <span className="eyebrow">{t.category}{t.badge ? ` · ${t.badge}` : ''}</span>
          <h1>{t.name}</h1>
          <p className="gift-tagline">{t.tagline}</p>
          <div className="chips">{t.features.map((f) => <span className="chip" key={f}>{f}</span>)}</div>
          <div className="gift-buy">
            <span className="price">{formatMnt(t.price)}<small>нэг удаа</small></span>
            <Link href={`/buy/${t.id}`} className="btn btn-rose btn-lg">Өөрийнхөөрөө хийх</Link>
          </div>
          <p className="gift-desc">{t.description}</p>
        </div>
      </section>

      <section className="gift-how" aria-labelledby="how">
        <h2 id="how">Хэрхэн ажилладаг вэ?</h2>
        <ol>
          <li>
            <div className="how-art how-pick" aria-hidden>
              {fan.map((x, k) => <img key={x.id} src={x.cover} alt="" className={`c${k}`} loading="lazy" />)}
            </div>
            <b>1</b><strong>Загвараа сонго</strong><span>Бэлэг болгох загвараа сонгоно.</span>
          </li>
          <li>
            <div className="how-art how-fill" aria-hidden>
              <div className="how-phone"><i className="line" /><i className="line short" /><div className="how-tiles"><i /><i /><i /><i /></div><i className="cta" /></div>
            </div>
            <b>2</b><strong>Зураг, үгээ оруул</strong><span>Нэр, зураг, дурсамжаа оруулна. 3–5 минут.</span>
          </li>
          <li>
            <div className="how-art how-send" aria-hidden>
              <div className="how-bubble">💌 anu-bat.dearlove.mn</div>
              <div className="how-bubble them">Ууу 😍 дуугаа асаагаад нээлээ!</div>
            </div>
            <b>3</b><strong>Линкээ илгээ</strong><span>Хайртдаа линк илгээхэд утсан дээр нь нээгдэнэ.</span>
          </li>
        </ol>
        <div className="gift-how-cta"><Link href={`/buy/${t.id}`} className="btn btn-rose btn-lg">Эхлэх — {formatMnt(t.price)}</Link></div>
      </section>

      <section className="gift-faq" aria-labelledby="faq">
        <h2 id="faq">Түгээмэл асуулт</h2>
        {FAQ.map((f) => (
          <details key={f.q}>
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
      </section>
    </div>
  );
}
