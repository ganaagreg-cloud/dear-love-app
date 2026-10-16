'use client';
import { useEffect, useState } from 'react';

/**
 * Facebook / Messenger / Instagram (and other apps') built-in browsers can't sign in with Google —
 * Google refuses OAuth inside embedded webviews («Error 403: disallowed_useragent»). Ad clicks land
 * exactly there, so on the login page we spot the in-app browser and help the buyer reopen this
 * same page (with its ?next=) in Chrome / Safari.
 */
const IN_APP = /FBAN|FBAV|FB_IAB|FBIOS|FB4A|Messenger|Instagram|Line\/|KAKAOTALK|Snapchat|TikTok|musical_ly|BytedanceWebview|; wv\)/i;

type Env = { app: string; android: boolean } | null;

function detect(): Env {
  const ua = navigator.userAgent || '';
  if (!IN_APP.test(ua)) return null;
  const app = /Instagram/i.test(ua) ? 'Instagram' : /Messenger/i.test(ua) ? 'Messenger' : /FBAN|FBAV|FB_IAB|FBIOS|FB4A/i.test(ua) ? 'Facebook' : 'энэ апп';
  return { app, android: /Android/i.test(ua) };
}

export default function InAppBrowserNotice() {
  const [env, setEnv] = useState<Env>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => setEnv(detect()), []);
  if (!env) return null;

  const url = window.location.href;
  // Android webviews honour intent:// links — this opens the same URL in Chrome (or the default browser).
  const intent = `intent://${url.replace(/^https?:\/\//, '')}#Intent;scheme=${url.startsWith('http://') ? 'http' : 'https'};S.browser_fallback_url=${encodeURIComponent(url)};end`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { window.prompt('Линкийг хуулаад хөтөч дээрээ нээнэ үү:', url); }
  };

  return (
    <div className="inapp" role="alert">
      <strong>{env.app} доторх хөтөч дээр Google-ээр нэвтрэх боломжгүй</strong>
      {env.android ? (
        <>
          <p>Энэ хуудсыг Chrome дээр нээгээд үргэлжлүүлээрэй — сонгосон загвар тань хэвээр үлдэнэ.</p>
          <a className="btn btn-rose btn-block" href={intent}>Chrome-оор нээх</a>
        </>
      ) : (
        <p>Баруун дээд (эсвэл доод) буланд байгаа <b>•••</b> товчийг дараад <b>«Open in browser» / «Safari-д нээх»</b>-ийг сонгоно уу — сонгосон загвар тань хэвээр үлдэнэ.</p>
      )}
      <button type="button" className="btn btn-ghost btn-sm" onClick={copy}>{copied ? 'Хуулсан ✓ — хөтөч дээрээ буулгана уу' : 'Линк хуулах'}</button>
    </div>
  );
}
