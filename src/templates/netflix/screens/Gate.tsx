'use client';
import { useState } from 'react';
import { initial, type LoveData } from '../data';

/** Two extra profiles, just for looks (not clickable) — they make it read as a real streaming app. */
const DECOYS = [
  { name: 'Хуучин найз', emoji: '🙈', bg: 'linear-gradient(135deg, #5b3fb5, #2b1a63)' },
  { name: 'Ээж', emoji: '👀', bg: 'linear-gradient(135deg, #2f7fc1, #14385c)' },
];

/** 1 · «Хэн үзэж байна?» — one profile: her photo and name. Tapping it unlocks sound and starts the show. */
export default function Gate({ data, onStart }: { data: LoveData; onStart: () => void }) {
  const [bad, setBad] = useState(false);
  return (
    <section className="lf-screen lf-gate">
      <div className="lf-wordmark">LOVEFLIX</div>
      <h1 className="lf-gate-title">Хэн үзэж байна?</h1>
      <div className="lf-profiles">
        <button type="button" className="lf-profile" onClick={onStart} aria-label={`${data.name1} — үзэж эхлэх`}>
          <span className="lf-avatar" data-field="profilePhoto">
            {data.profilePhoto && !bad
              ? <img src={data.profilePhoto} alt="" onError={() => setBad(true)} />
              : <span className="lf-avatar-fallback">{initial(data.name1)}</span>}
          </span>
          <span className="lf-profile-name" data-field="name1">{data.name1}</span>
        </button>
        {DECOYS.map((d) => (
          <div className="lf-profile lf-profile-decoy" key={d.name} aria-hidden>
            <span className="lf-avatar"><span className="lf-avatar-fallback" style={{ background: d.bg }}>{d.emoji}</span></span>
            <span className="lf-profile-name">{d.name}</span>
          </div>
        ))}
      </div>
      <p className="lf-gate-hint">Үзэж эхлэхийн тулд профайл дээрээ дарна уу</p>
    </section>
  );
}
