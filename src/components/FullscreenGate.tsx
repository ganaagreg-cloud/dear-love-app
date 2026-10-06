'use client';
import { useEffect, useState, type ReactNode } from 'react';
import './fullscreen.css';

type FsDoc = Document & { webkitFullscreenEnabled?: boolean; webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => Promise<void> | void };
type FsEl = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };

const fsOn = (d: FsDoc) => !!(d.fullscreenEnabled || d.webkitFullscreenEnabled);
const fsEl = (d: FsDoc) => d.fullscreenElement || d.webkitFullscreenElement || null;

/**
 * Asks «Бүтэн дэлгэцээр үзэх үү?» before a gift starts (nothing is rendered or played until the viewer answers),
 * and while it is fullscreen shows a ✕ in the corner to leave. Browsers that can't go fullscreen (iPhone Safari)
 * skip the question.
 */
export default function FullscreenGate({ children }: { children: ReactNode }) {
  const [step, setStep] = useState<'check' | 'ask' | 'go'>('check');
  const [full, setFull] = useState(false);

  useEffect(() => { setStep(fsOn(document as FsDoc) ? 'ask' : 'go'); }, []);
  useEffect(() => {
    const on = () => { const f = !!fsEl(document as FsDoc); setFull(f); document.documentElement.toggleAttribute('data-fs', f); };
    document.addEventListener('fullscreenchange', on); document.addEventListener('webkitfullscreenchange', on);
    return () => { document.removeEventListener('fullscreenchange', on); document.removeEventListener('webkitfullscreenchange', on); document.documentElement.removeAttribute('data-fs'); };
  }, []);

  const enter = async () => {
    const el = document.documentElement as FsEl;
    try { await (el.requestFullscreen ? el.requestFullscreen() : el.webkitRequestFullscreen?.()); } catch { /* the viewer said yes but the browser said no — carry on */ }
    setStep('go');
  };
  const leave = () => { const d = document as FsDoc; try { void (d.exitFullscreen ? d.exitFullscreen() : d.webkitExitFullscreen?.()); } catch { /* already out */ } };

  if (step === 'check') return <div className="fsg-wait" />;
  if (step === 'ask') {
    return (
      <div className="fsg-ask" role="dialog" aria-label="Бүтэн дэлгэц">
        <div className="fsg-card">
          <div className="fsg-icon" aria-hidden>⛶</div>
          <h1>Бүтэн дэлгэцээр үзэх үү?</h1>
          <p>Бүтэн дэлгэц дээр илүү гоё харагдана. Гарах бол буланд байгаа ✕ дээр дарна.</p>
          <button type="button" className="fsg-yes" onClick={enter}>Бүтэн дэлгэц</button>
          <button type="button" className="fsg-no" onClick={() => setStep('go')}>Үгүй, ингээд үзье</button>
        </div>
      </div>
    );
  }
  return (
    <>
      {children}
      {full && <button type="button" className="fsg-x" onClick={leave} aria-label="Бүтэн дэлгэцээс гарах" title="Бүтэн дэлгэцээс гарах">✕</button>}
    </>
  );
}
