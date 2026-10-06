'use client';
import { useState } from 'react';
import type { LoveData } from '../data';

/** 6b · Quiet end credits that roll, then «Та одоо ч үзэж байна уу?» → back to the menu. `still` = all at once (editor). */
export default function Credits({ data, still, onBack }: { data: LoveData; still: boolean; onBack: () => void }) {
  const [done, setDone] = useState(false);
  const stars = [data.name1, data.name2].filter(Boolean);
  const show = still || done;
  return (
    <section className={`lf-screen lf-credits ${still ? 'still' : ''}`}>
      <div className="lf-roll" onAnimationEnd={() => setDone(true)}>
        <div className="lf-credit"><small>Гол дүрд</small>{stars.map((n, i) => <b key={i} data-field={i ? 'name2' : 'name1'}>{n}</b>)}</div>
        {data.credits.director && <div className="lf-credit"><small>Найруулсан</small><b data-field="credits.director">{data.credits.director}</b></div>}
        {data.credits.thanks.length > 0 && (
          <div className="lf-credit"><small>Тусгай талархал</small>{data.credits.thanks.map((t, i) => <b key={i}>{t}</b>)}</div>
        )}
        {data.songName && <div className="lf-credit"><small>Дуу</small><b data-field="songName">{data.songName}</b></div>}
        <div className="lf-credit lf-credit-end"><span className="lf-wordmark">LOVEFLIX</span><small>Оригинал · {data.year}</small></div>
      </div>
      {show && (
        <div className="lf-still-watching">
          <p>Та одоо ч үзэж байна уу?</p>
          <button type="button" className="lf-btn lf-btn-play" onClick={onBack}>Тийм, үргэлжлүүлэх</button>
        </div>
      )}
    </section>
  );
}
