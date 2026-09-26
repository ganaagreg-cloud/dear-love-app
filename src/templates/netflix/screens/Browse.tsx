'use client';
import { initial, type ScreenProps } from './types';

const NEBULA =
  'radial-gradient(circle at 20% 30%, rgba(255,255,255,.08), transparent 35%),' +
  'radial-gradient(circle at 75% 65%, rgba(255,91,106,.18), transparent 40%),' +
  'radial-gradient(circle at 55% 15%, rgba(120,80,255,.12), transparent 30%), #1c1c1c';
const PROGRESS = [70, 40, 25, 10];

type CardItem = { title: string; photo: string; progress?: number };

function Card({ item, accent, onPlay }: { item: CardItem; accent: string; onPlay: () => void }) {
  return (
    <div className="lf-card" role="button" tabIndex={0} onClick={onPlay} onKeyDown={(e) => e.key === 'Enter' && onPlay()}>
      <div className="lf-card-img">
        {item.photo ? (
          <img src={item.photo} alt={item.title || 'хайрын зураг'} loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        ) : (
          <div className="lf-card-placeholder" style={{ background: `linear-gradient(135deg, ${accent}55, rgba(20,20,20,.55)), ${NEBULA}` }} />
        )}
        {item.progress != null && <div className="lf-progress"><span style={{ width: `${item.progress}%` }} /></div>}
        <div className="lf-card-play">▶</div>
      </div>
      <div className="lf-card-title">{item.title}</div>
    </div>
  );
}

const scrollTo = (selector: string) => document.querySelector(selector)?.scrollIntoView({ behavior: 'smooth' });

export default function Browse({ data, copy, onPlay }: ScreenProps & { onPlay: () => void }) {
  const ov = data.overrides as Record<string, unknown>;
  // Viewer mode: a photo card only shows if it has a photo OR a custom (overridden) title.
  const build = (titles: readonly string[], photos: string[], key: 'cw' | 'hits', withProgress: boolean): CardItem[] => {
    const custom = (ov[key] as string[] | undefined) ?? [];
    return titles
      .map((title, i) => ({ title, photo: photos[i] ?? '', progress: withProgress ? PROGRESS[i] : undefined, custom: !!custom[i]?.trim() }))
      .filter((c) => c.photo || c.custom || data.previewPlaceholders);
  };
  const row1 = build(copy.cw, data.cwPhotos, 'cw', true);
  const row3 = build(copy.hits, data.hitPhotos, 'hits', false);
  const name = data.partnerName || 'Чи';

  return (
    <section className="lf-screen lf-browse">
      <nav className="lf-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <div className="lf-logo">LoveFlix</div>
          <div className="lf-nav-links">
            <span onClick={() => scrollTo('.lf-hero')} style={{ cursor: 'pointer' }}>Нүүр</span>
            <span onClick={() => scrollTo('.lf-rows')} style={{ cursor: 'pointer' }}>Бид</span>
            <span onClick={() => scrollTo('.lf-row-cta')} style={{ cursor: 'pointer' }}>Миний жагсаалт</span>
          </div>
        </div>
        <div className="lf-nav-avatar">{initial(name)}</div>
      </nav>

      <div className="lf-hero">
        <div className="lf-hero-bg">
          <div className="lf-hero-placeholder" />{data.heroPhoto && <img className="lf-hero-img" src={data.heroPhoto} alt={copy.heroTitle || 'хайрын зураг'} onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
          <div className="lf-hero-fade" />
          <div className="lf-hero-fade-bottom" />
        </div>
        <div className="lf-hero-content">
          <div className="lf-hero-badge"><span className="lf-n-mark">L</span>{copy.badge}</div>
          <h1 className="lf-hero-title">{copy.heroTitle}</h1>
          <div className="lf-hero-meta">
            <span className="lf-match">99% тохирол</span>
            <span className="lf-rating">U/A 16+</span>
            <span>1 улирал</span>
            <span className="lf-hd">HD</span>
          </div>
          <p className="lf-hero-synopsis">{copy.synopsis}</p>
          <div className="lf-hero-actions">
            <button className="lf-btn lf-btn-play" onClick={onPlay}><span className="lf-play-tri" /> Тоглуулах</button>
            <button className="lf-btn lf-btn-info" onClick={onPlay}><i className="lf-info-i">i</i> Дэлгэрэнгүй</button>
          </div>
        </div>
      </div>

      <div className="lf-rows">
        {row1.length > 0 && (
          <div className="lf-row">
            <h2 className="lf-row-title">{copy.row1}</h2>
            <div className="lf-row-scroll">{row1.map((c, i) => <Card key={i} item={c} accent={data.accent} onPlay={onPlay} />)}</div>
          </div>
        )}

        <div className="lf-row">
          <h2 className="lf-row-title">{copy.row2}</h2>
          <div className="lf-row-scroll lf-top10">
            {copy.reasons.slice(0, 5).map((r, i) => (
              <div className="lf-rank" key={i}>
                <span className="lf-rank-num">{i + 1}</span>
                <div className="lf-rank-card">
                  <span className="lf-rank-heart">♥</span>
                  <span className="lf-rank-text">{r}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {row3.length > 0 && (
          <div className="lf-row">
            <h2 className="lf-row-title">{copy.row3}</h2>
            <div className="lf-row-scroll">{row3.map((c, i) => <Card key={i} item={c} accent={data.accent} onPlay={onPlay} />)}</div>
          </div>
        )}

        <div className="lf-row-cta">
          <button className="lf-btn lf-btn-play lf-btn-big" onClick={onPlay}><span className="lf-play-tri" /> Интерактив ангийг тоглуулах</button>
        </div>
      </div>
    </section>
  );
}
