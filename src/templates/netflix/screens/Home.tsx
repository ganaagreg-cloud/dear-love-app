'use client';
import { useState } from 'react';
import Billboard from '../parts/Billboard';
import Row from '../parts/Row';
import Poster from '../parts/Poster';
import type { LoveData } from '../data';

/** 3 · The menu: billboard, «Үргэлжлүүлэн үзэх», «Бүлэг», «Топ 5 шалтгаан». */
export default function Home({ data, watched, onPlay, openInfo = false }: { data: LoveData; watched: number[]; onPlay: (epN: number) => void; openInfo?: boolean }) {
  const [info, setInfo] = useState(openInfo);
  const eps = data.episodes;
  if (!eps.length) return <section className="lf-screen lf-home"><Billboard data={data} onPlay={() => {}} onInfo={() => setInfo(true)} /></section>;
  const next = eps.find((e) => !watched.includes(e.n)) ?? eps[0];
  const cover = (e: (typeof eps)[number]) => e.slides.find((s) => s.photo)?.photo ?? '';
  const nextSlide = next.slides.findIndex((s) => s.photo);
  return (
    <section className="lf-screen lf-home">
      <div className="lf-home-scroll">
        <Billboard data={data} onPlay={() => onPlay(next.n)} onInfo={() => setInfo(true)} />

        <Row title="Үргэлжлүүлэн үзэх">
          <button type="button" className="lf-continue" onClick={() => onPlay(next.n)} data-field={`ep${next.n}.photos.${Math.max(0, nextSlide)}`}>
            {cover(next) ? <img src={cover(next)} alt="" loading="lazy" /> : <span className="lf-poster-bg" />}
            <span className="lf-poster-shade" />
            <span className="lf-play-ring" aria-hidden>▶</span>
            <span className="lf-continue-meta"><b>Бүлэг {next.n}</b>{next.title && <> · <span data-field={`ep${next.n}.title`}>{next.title}</span></>}</span>
            <span className="lf-progress"><i style={{ width: watched.includes(next.n) ? '100%' : '34%' }} /></span>
          </button>
        </Row>

        <Row title="Бүлэг">
          {eps.map((e) => (
            <Poster
              key={e.n} photo={cover(e)} title={e.title} tag={String(e.n)} onClick={() => onPlay(e.n)}
              className={watched.includes(e.n) ? 'watched' : ''}
              photoField={`ep${e.n}.photos.${Math.max(0, e.slides.findIndex((s) => s.photo))}`} titleField={`ep${e.n}.title`}
            />
          ))}
        </Row>

        {data.top.length > 0 && (
          <Row title="Топ 5 шалтгаан" className="lf-top">
            {data.top.map((t, k) => (
              <div className="lf-top-item" key={t.i}>
                <span className="lf-top-num" aria-hidden>{k + 1}</span>
                <Poster photo={t.photo} title={t.text} photoField={`top.photos.${t.i}`} titleField={`top.texts.${t.i}`} />
              </div>
            ))}
          </Row>
        )}
        <p className="lf-footnote">LOVEFLIX · {data.year}</p>
      </div>

      {info && (
        <div className="lf-sheet-wrap" onClick={(e) => e.target === e.currentTarget && setInfo(false)}>
          <div className="lf-sheet" role="dialog" aria-label="Дэлгэрэнгүй">
            <button type="button" className="lf-x" onClick={() => setInfo(false)} aria-label="Хаах">✕</button>
            <h2 className="lf-sheet-title">{data.title}</h2>
            <div className="lf-badges"><span className="lf-match">98% тохирол</span><span>{data.year}</span><span>{eps.length} бүлэг</span></div>
            {data.synopsis && <p className="lf-sheet-text" data-field="synopsis">{data.synopsis}</p>}
            <p className="lf-sheet-meta"><i>Гол дүрд:</i> {data.name1}{data.name2 && `, ${data.name2}`}</p>
            <p className="lf-sheet-meta"><i>Төрөл:</i> Хайр · Дурсамж · Инээд</p>
          </div>
        </div>
      )}
    </section>
  );
}
