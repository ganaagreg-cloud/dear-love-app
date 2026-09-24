import Link from 'next/link';
import TemplateCard from '@/components/TemplateCard';
import Collage from '@/components/Collage';
import { TEMPLATES } from '@/templates/registry';
import { PHOTOS } from '@/templates/photos';

const COLLAGE = [PHOTOS.couple1, PHOTOS.mnGer2, PHOTOS.couple3, PHOTOS.couple7, PHOTOS.mnYurtsSnow];

export default function Home() {
  return (
    <div className="container">
      <section className="hero">
        <span className="eyebrow">♥ Хайртай хүндээ зориулсан дижитал бэлэг</span>
        <h1>Хэлж амжаагүй үгээ <em>мартагдашгүйгээр</em> хэлээрэй</h1>
        <p>Кино шиг загвар сонгоод зураг, дуу, үгээ оруулаарай. Дараа нь ганцхан линкээр илгээнэ — тэр хүн утсаараа нээгээд л харна.</p>
        <div className="hero-cta">
          <Link href="#templates" className="btn btn-rose btn-lg">Загвар сонгох</Link>
          <Link href={`/templates/${TEMPLATES[0].id}`} className="btn btn-lg">Жишээ үзэх</Link>
        </div>
        <Collage photos={COLLAGE} />
        <div className="steps">
          <div className="step"><b>1</b><strong>Үзэх</strong><span>Загвар бүрийг яг хүлээн авагч шиг нь тоглуулж үзнэ.</span></div>
          <div className="step"><b>2</b><strong>QPay-ээр төлөх</strong><span>Нэг удаагийн тогтмол үнэ. Банкны аппаараа QR уншуулна.</span></div>
          <div className="step"><b>3</b><strong>Өөрийнхөөрөө болгох</strong><span>Зураг, дуу, нэр, үг бүрийг зөвхөн та л засна.</span></div>
          <div className="step"><b>4</b><strong>Линкээ илгээх</strong><span>anu-bat.dearlove.mn шиг өөрийн нэртэй линкээр илгээнэ.</span></div>
        </div>
      </section>

      <div id="templates" className="section-title">
        <h2>Загварууд</h2>
        <p>{TEMPLATES.length} загвар · удахгүй нэмэгдэнэ</p>
      </div>
      <div className="grid">{TEMPLATES.map((t) => <TemplateCard key={t.id} t={t} />)}</div>
    </div>
  );
}
