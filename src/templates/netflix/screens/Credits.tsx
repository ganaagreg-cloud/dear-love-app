'use client';
import { useState } from 'react';
import { FINALE } from '../copy';
import type { ScreenProps } from './types';

export default function Credits({ data, copy, onRestart }: ScreenProps & { onRestart: () => void }) {
  const [finished, setFinished] = useState(false);
  const [rollKey, setRollKey] = useState(0);
  const partner = data.partnerName || 'Чи';
  const me = data.yourName?.trim();

  if (finished) {
    const h1 = data.occasion === 'ask_out' ? 'Бидний дараагийн улирал одоо эхэлж байна.' : FINALE[data.occasion].tag;
    return (
      <section className="lf-screen lf-credits lf-credits-finished">
        <div className="lf-credits-endcard">
          <div className="lf-logo">LoveFlix</div>
          <p>ТӨГСГӨЛ</p>
          <h1>{h1}</h1>
          <div className="lf-credits-actions">
            <button onClick={() => { setRollKey((k) => k + 1); setFinished(false); }}>Титрийг дахин үзэх</button>
            <button onClick={onRestart}>Эхнээс нь үзэх</button>
          </div>
        </div>
      </section>
    );
  }

  const credits = [
    ['Гол дүрд', me ? `${partner} & ${me}` : partner],
    ['Найруулагч', me || 'Бага зэрэг зориг'],
    ['Зохиолч', 'Бидний илгээсэн мессеж бүр'],
    ['Кино хөгжим', data.songName?.trim() || 'Бидний дуу'],
    ['Шилдэг хэсэг', copy.cw[0] || 'Хараахан болоогүй тэр хэсэг'],
    ['Шалтгаан', copy.reasons[0] || 'Тоглуулах товч дарсан чи'],
  ];

  return (
    <section className="lf-screen lf-credits">
      <div className="lf-credits-controls">
        <button onClick={() => setFinished(true)}>Титр алгасах</button>
        <button onClick={onRestart}>Эхнээс нь</button>
      </div>
      <div key={rollKey} className="lf-credits-roll" onAnimationEnd={() => setFinished(true)}>
        <div className="lf-credits-kicker">{copy.badge}</div>
        <h1 className="lf-credits-title">{copy.heroTitle}</h1>
        <p className="lf-credits-note">{copy.synopsis}</p>
        <div className="lf-credits-list">
          {credits.map(([role, name]) => (
            <div key={role}>
              <div className="lf-credit-role">{role}</div>
              <div className="lf-credit-name">{name}</div>
            </div>
          ))}
        </div>
        <div className="lf-credits-dedication">
          <div>Зориулав</div>
          <p>{partner}</p>
        </div>
        <div className="lf-credits-last-line">{copy.climaxSub || 'Юу ч болсон би чамайг сонгоно.'}</div>
        <div className="lf-credits-heart">♥</div>
      </div>
    </section>
  );
}
