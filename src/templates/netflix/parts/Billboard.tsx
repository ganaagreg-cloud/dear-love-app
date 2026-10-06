'use client';
import KenBurns from './KenBurns';
import type { LoveData } from '../data';

/** The 70vh hero: the photo trailer, the title, who stars, the badges and the two buttons. */
export default function Billboard({ data, onPlay, onInfo }: { data: LoveData; onPlay: () => void; onInfo: () => void }) {
  const n = data.episodes.length;
  return (
    <header className="lf-billboard">
      <KenBurns photos={data.trailer} field="trailerPhotos" />
      <div className="lf-billboard-shade" />
      <div className="lf-billboard-body">
        <h1 className="lf-hero-title" data-field="title">{data.title}</h1>
        <p className="lf-cast">Гол дүрд: <b data-field="name1">{data.name1}</b>{data.name2 && <>, <b data-field="name2">{data.name2}</b></>}</p>
        <div className="lf-badges">
          <span className="lf-match">98% тохирол</span>
          <span className="lf-rating">Зөвхөн чамд · 18+</span>
          <span data-field="year">{data.year}</span>
          <span>{n} бүлэг</span>
        </div>
        <div className="lf-actions">
          <button type="button" className="lf-btn lf-btn-play" onClick={onPlay}><i aria-hidden>▶</i> Тоглуулах</button>
          <button type="button" className="lf-btn lf-btn-info" onClick={onInfo}><i aria-hidden>ⓘ</i> Дэлгэрэнгүй</button>
        </div>
      </div>
    </header>
  );
}
