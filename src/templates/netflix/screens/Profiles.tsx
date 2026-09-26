'use client';
import { useState } from 'react';
import { initial, type ScreenProps } from './types';

const DECOYS = [
  { name: 'Хуучин найз', emoji: '🙈', bg: '#5b3fb5' },
  { name: 'Ээж', emoji: '👀', bg: '#3f7fb5' },
];

export default function Profiles({ data, onSelect }: ScreenProps & { onSelect: () => void }) {
  const [bad, setBad] = useState(false);
  const name = data.partnerName || 'Чи';
  return (
    <section className="lf-screen lf-profiles">
      <div className="lf-logo lf-logo-top">LoveFlix</div>
      <h1 className="lf-profiles-title">Хэн үзэж байна?</h1>
      <div className="lf-profiles-grid">
        <div
          className="lf-profile lf-profile-main" role="button" tabIndex={0} onClick={onSelect}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onSelect())}
        >
          <div className="lf-avatar lf-avatar-main">
            {data.profilePhoto && !bad ? (
              <img src={data.profilePhoto} alt={name} onError={() => setBad(true)} />
            ) : (
              <div className="lf-avatar-fallback" style={{ background: `linear-gradient(135deg, ${data.accent}, #b1060f)` }}>
                {initial(name)}
              </div>
            )}
          </div>
          <div className="lf-profile-name">{name}</div>
        </div>
        {DECOYS.map((d) => (
          <div key={d.name} className="lf-profile lf-profile-decoy" aria-disabled="true">
            <div className="lf-avatar lf-avatar-decoy" style={{ background: d.bg }}>
              <span className="lf-decoy-emoji">{d.emoji}</span>
            </div>
            <div className="lf-profile-name lf-profile-name-decoy">{d.name}</div>
          </div>
        ))}
      </div>
      <div className="lf-manage">Үзэж эхлэхийн тулд профайл дээрээ дарна уу</div>
    </section>
  );
}
