'use client';
import { useEffect, useState } from 'react';
import './guide.css';
import type { Content } from '@/templates/types';
import { PreviewFrame } from './PreviewFrame';
import { dative } from '@/lib/mn';
import QrCode from '@/components/QrCode';

/* ─────────── first-open intro (3 slides, once per user) ─────────── */

const SLIDES = [
  { art: 'live', title: 'Бөглөхөд баруун талд шууд харагдана', text: 'Нэр, үг, зураг оруулах бүрт бэлэг тань тэр дороо шинэчлэгдэнэ. Утсан дээр «Харах» дээр дарж үзнэ.' },
  { art: 'tap', title: 'Зураг дээр дарж шууд засна', text: 'Бэлэг дээрх бичиг, зураг дээр дарахад тэр хэсгийн талбар нээгдэнэ. «📍» товч юу хаана байгааг дугаарлаж харуулна.' },
  { art: 'save', title: 'Бүгд автоматаар хадгалагдана — бэлэн бол «Нийтлэх»', text: 'Хадгалах товч хэрэггүй. Нийтэлсний дараа линкээ илгээхэд л болно, дараа нь ч засаж болно.' },
] as const;

export function IntroModal({ onClose }: { onClose: () => void }) {
  const [i, setI] = useState(0);
  const s = SLIDES[i], last = i === SLIDES.length - 1;
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); if (e.key === 'ArrowRight' && !last) setI(i + 1); if (e.key === 'ArrowLeft' && i) setI(i - 1); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [i, last, onClose]);
  return (
    <div className="gd-backdrop" role="dialog" aria-modal="true" aria-label="Засварлагчийг хэрхэн ашиглах вэ">
      <div className="gd-intro">
        <button type="button" className="gd-skip" onClick={onClose}>Алгасах</button>
        <div className={`gd-art gd-art-${s.art}`} aria-hidden>
          {s.art === 'live' && <><div className="gd-form"><i /><i /><i className="on" /></div><b>→</b><div className="gd-phone"><span>♥</span></div></>}
          {s.art === 'tap' && <div className="gd-phone wide"><span className="gd-target">Анхны болзоо</span><em>✎</em><div className="gd-sheet"><i /></div></div>}
          {s.art === 'save' && <><div className="gd-saved">● Бүгд хадгалагдсан</div><div className="gd-publish">Нийтлэх 💌</div></>}
        </div>
        <h2>{s.title}</h2>
        <p>{s.text}</p>
        <div className="gd-dots" role="tablist" aria-label="Слайд">
          {SLIDES.map((_, k) => <button key={k} type="button" role="tab" aria-selected={k === i} aria-label={`${k + 1}-р слайд`} className={k === i ? 'on' : ''} onClick={() => setI(k)} />)}
        </div>
        <div className="gd-actions">
          {i > 0 && <button type="button" className="btn" onClick={() => setI(i - 1)}>← Өмнөх</button>}
          <button type="button" className="btn btn-primary" onClick={() => (last ? onClose() : setI(i + 1))}>{last ? 'Эхэлье ♥' : 'Дараах →'}</button>
        </div>
      </div>
    </div>
  );
}

/** Remember «intro seen» for this user (DB) — and locally, in case the DB flag can't be written. */
export function markIntroSeen() {
  try { localStorage.setItem('dl_intro_seen', '1'); } catch { /* private mode */ }
  void fetch('/api/prefs', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ flag: 'editorIntro' }) }).catch(() => {});
}
export function introSeenLocally() {
  try { return localStorage.getItem('dl_intro_seen') === '1'; } catch { return false; }
}

/* ─────────── «Хүлээн авагч юу харах вэ?» ─────────── */

export function RecipientView({ templateId, content, name, onClose }: { templateId: string; content: Content; name: string; onClose: () => void }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="gd-backdrop dark" role="dialog" aria-modal="true" aria-label="Хүлээн авагчийн харах байдал">
      <div className="gd-recipient">
        <header>
          <span>Яг ингэж {name || 'түүний'} утсан дээр нээгдэнэ</span>
          <button type="button" className="btn btn-sm" onClick={onClose}>✕ Хаах</button>
        </header>
        <PreviewFrame templateId={templateId} content={content} pin={null} device="mobile" recipient pad={16} className="gd-recipient-frame" title="Хүлээн авагчийн харах байдал" />
      </div>
    </div>
  );
}

/* ─────────── after publish: send it ─────────── */

const mobile = () => typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

type ShareProps = {
  url: string; slug: string; name: string;
  slugDraft: string; setSlugDraft: (v: string) => void; saveSlug: () => void; slugErr: string;
  linkBase: string; subdomain: boolean;
  unpublish: () => void; close: () => void;
};

export function ShareScreen({ url, slug, name, slugDraft, setSlugDraft, saveSlug, slugErr, linkBase, subdomain, unpublish, close }: ShareProps) {
  const [toast, setToast] = useState('');
  const [editSlug, setEditSlug] = useState(false);
  const [qr, setQr] = useState(false);
  const say = (t: string) => { setToast(t); setTimeout(() => setToast(''), 2600); };
  const copy = async (text = url, msg = 'Линк хуулагдлаа ✓') => {
    try { await navigator.clipboard.writeText(text); say(msg); } catch { say('Хуулж чадсангүй — линкийг удаан дараад хуулна уу'); }
  };
  const message = `Чамд бяцхан бэлэг байна 💌 Дуугаа асаагаад нээгээрэй 🔊\n${url}`;
  const messenger = async () => {
    if (mobile()) { window.location.href = `fb-messenger://share/?link=${encodeURIComponent(url)}`; return; }
    await copy(message, 'Мессеж хуулагдлаа — Messenger дээр чатандаа буулгаарай');
    window.open('https://www.messenger.com/', '_blank', 'noopener,noreferrer');
  };
  const instagram = async () => {
    await copy(message, 'Мессеж хуулагдлаа — Instagram DM дээр буулгаарай');
    if (mobile()) window.location.href = 'instagram://direct-inbox';
    else window.open('https://www.instagram.com/direct/inbox/', '_blank', 'noopener,noreferrer');
  };
  const native = typeof navigator !== 'undefined' && 'share' in navigator;

  return (
    <div className="gd-backdrop" role="dialog" aria-modal="true" aria-label="Бэлэг бэлэн боллоо" onClick={(e) => e.target === e.currentTarget && close()}>
      <div className="gd-share">
        <button type="button" className="gd-close" onClick={close} aria-label="Хаах">✕</button>
        <div className="gd-hero" aria-hidden>💌</div>
        <h2>Бэлэг бэлэн! Одоо {name ? dative(name) : 'түүнд'} илгээе</h2>

        <div className="gd-link">
          <input readOnly value={url} onFocus={(e) => e.target.select()} aria-label="Бэлгийн линк" />
          <button type="button" className="btn btn-primary" onClick={() => copy()}>Хуулах</button>
        </div>

        <div className="gd-share-row">
          <button type="button" className="gd-app messenger" onClick={messenger}><b aria-hidden>💬</b>Messenger</button>
          <button type="button" className="gd-app instagram" onClick={instagram}><b aria-hidden>📷</b>Instagram DM</button>
          <button type="button" className="gd-app" onClick={() => (native ? navigator.share({ title: 'Чамд зориулав ♡', text: 'Дуугаа асаагаад нээгээрэй 🔊', url }).catch(() => {}) : copy())}>
            <b aria-hidden>{native ? '↗' : '🔗'}</b>{native ? 'Бусад' : 'Линк хуулах'}
          </button>
        </div>

        <button type="button" className="gd-copy-msg" onClick={() => setQr((v) => !v)} aria-expanded={qr}>▦ QR код {qr ? 'нуух' : 'үзүүлэх / татах'}</button>
        {qr && <><QrCode url={url} /><p className="gd-note">Утсаараа уншуулбал бэлэг шууд нээгдэнэ — карт, боодол дээр наахад тохиромжтой.</p></>}

        <ol className="gd-how" aria-label="Яаж илгээх вэ">
          <li><b>1</b><span><strong>Линкээ хуул</strong>дээрх «Хуулах» товч</span></li>
          <li><b>2</b><span><strong>Түүнд илгээ</strong>Messenger, Instagram эсвэл SMS-ээр</span></li>
          <li><b>3</b><span><strong>«Дуугаа асаагаад нээгээрэй 🔊» гэж хэл</strong>хөгжимтэй нь илүү гоё</span></li>
        </ol>
        <button type="button" className="gd-copy-msg" onClick={() => copy(message, 'Мессеж хуулагдлаа ✓')}>✎ Бэлэн мессеж хуулах</button>

        <p className="gd-note">Нийтэлсний дараа ч засах боломжтой, линк өөрчлөгдөхгүй.</p>

        <div className="gd-foot">
          <a className="btn btn-sm" href={url} target="_blank" rel="noreferrer">Нээж үзэх</a>
          <button type="button" className="btn btn-sm" onClick={() => setEditSlug((v) => !v)} aria-expanded={editSlug}>Линкийн нэр солих</button>
          <button type="button" className="btn btn-sm btn-ghost" onClick={close}>Засвар руу буцах</button>
        </div>
        {editSlug && (
          <div className="gd-slug">
            <div className="slug-row">
              {!subdomain && <span>{linkBase}</span>}
              <input value={slugDraft} onChange={(e) => setSlugDraft(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').slice(0, 40))} onKeyDown={(e) => e.key === 'Enter' && saveSlug()} placeholder="anu-bat" aria-label="Линкийн нэр" />
              {subdomain && <span>{linkBase}</span>}
              {slugDraft !== slug && <button type="button" className="btn btn-sm btn-primary" style={{ margin: 4 }} onClick={saveSlug}>Хадгалах</button>}
            </div>
            <p className={`ed-help ${slugErr ? 'err' : ''}`}>{slugErr || 'Латин жижиг үсэг, тоо, зураас. Нэр солиход хуучин линк ажиллахаа болино.'}</p>
            <button type="button" className="btn btn-ghost btn-sm" onClick={unpublish}>Нийтлэлээс буцаах</button>
          </div>
        )}
        {toast && <div className="gd-toast" role="status">{toast}</div>}
      </div>
    </div>
  );
}
