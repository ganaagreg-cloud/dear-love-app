'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import './editor.css';
import { allFields, type Content, type ContentValue, type Field, type Section, type TemplateMeta } from '@/templates/types';
import { FieldControl, ImageSlot, TextBox, asArr } from './Fields';
import { Cards } from './Cards';
import { ItemStep, buildSteps, itemFields, stepKeyFor, stepPin, stepTitle } from './Steps';
import { uploadMedia } from '@/lib/upload';
import { PreviewFrame, type Device } from './PreviewFrame';
import { QUICK } from '@/templates/quickRegistry';
import { IntroModal, RecipientView, ShareScreen, introSeenLocally, markIntroSeen } from './Guide';
import { suggestSlug } from '@/lib/slug';
import { dative } from '@/lib/mn';

type Props = {
  meta: TemplateMeta;
  pageId: string;
  userId: string;
  initialContent: Content;
  initialStatus: 'paid' | 'published';
  initialSlug: string | null;
  initialUrl: string;
  /** ".dearlove.mn" (subdomain mode) or "dearlove.mn/p/" */
  linkBase: string;
  subdomain: boolean;
  /** This user already saw (or skipped) the 3-slide editor intro. */
  introSeen: boolean;
};

export type SaveState = 'saved' | 'dirty' | 'saving' | 'error';
const cleanSlug = (v: string) => v.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').slice(0, 40);

/** A `required` field counts as filled when every slot/item has something in it. */
const filled = (f: Field, v: ContentValue | undefined) =>
  f.type === 'images' ? Array.from({ length: f.max }, (_, i) => asArr(v)[i]).every(Boolean)
  : f.type === 'list' ? Array.from({ length: f.count }, (_, i) => asArr(v)[i]?.trim()).every(Boolean)
  : typeof v === 'string' ? v.trim() !== '' : v != null;
const missing = (s: Section, c: Content) => s.fields.some((f) => f.required && !filled(f, c[f.key]));

export default function Editor({ meta, pageId, userId, initialContent, initialStatus, initialSlug, initialUrl, linkBase, subdomain, introSeen }: Props) {
  const [content, setContent] = useState<Content>(initialContent);
  const [save, setSave] = useState<SaveState>('saved');
  const [status, setStatus] = useState(initialStatus);
  const [slug, setSlug] = useState(initialSlug);
  const [url, setUrl] = useState(initialUrl);
  const [slugDraft, setSlugDraft] = useState(initialSlug ?? '');
  const [slugErr, setSlugErr] = useState('');
  const [intro, setIntro] = useState(false);
  useEffect(() => { if (!introSeen && !introSeenLocally()) setIntro(true); }, [introSeen]);
  const closeIntro = useCallback(() => { setIntro(false); markIntroSeen(); }, []);
  const [recipientView, setRecipientView] = useState(false);
  const [open, setOpen] = useState<string>(meta.schema[0] ? stepKeyFor(meta.schema[0], null) : '');
  // the preview scene of whatever field/card has focus; falls back to the step's own scene
  const [focusPin, setFocusPin] = useState<string | number | null>(null);
  // A jump from the preview / «Анхаарах зүйл» opens a step with a specific scene already set —
  // don't let the step change wipe it; and keep that scene while the buyer stays on that field.
  const keepPin = useRef(false);
  const pinLock = useRef<{ base: string } | null>(null);
  useEffect(() => { if (keepPin.current) { keepPin.current = false; return; } setFocusPin(null); }, [open]);
  const [device, setDevice] = useState<Device>('mobile');
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');
  // Phone/tablet: the form is the editor; the preview tab is a view-only look at the page (no tap-to-edit, no accidental page flips).
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)');
    const f = () => setNarrow(mq.matches);
    f(); mq.addEventListener('change', f);
    return () => mq.removeEventListener('change', f);
  }, []);
  const [share, setShare] = useState(false);
  const [publishing, setPublishing] = useState(false);

  
  /* ── live preview ── */
  const latest = useRef(content); latest.current = content;
  const [previewingFull, setPreviewingFull] = useState(false);
  // the walk-through: one step per page (a section with many items gives one step per item)
  const steps = useMemo(() => buildSteps(meta, content, open), [meta, content, open]);
  const openIndex = Math.max(0, steps.findIndex((x) => x.key === open));
  const step = steps[openIndex];
  const currentSection = step?.sec;
  const prevStep = openIndex > 0 ? steps[openIndex - 1] : undefined;
  const nextStep = openIndex < steps.length - 1 ? steps[openIndex + 1] : undefined;
  const pin = previewingFull ? null : (focusPin ?? (step ? stepPin(step) : null));
  const debounce = meta.previewDebounceMs ?? 700;

  /* ── autosave ── */
  const persist = useCallback(async () => {
    setSave('saving');
    const r = await fetch(`/api/pages/${pageId}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ content: latest.current }) }).catch(() => null);
    setSave(r?.ok ? 'saved' : 'error');
  }, [pageId]);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setSave('dirty');
    const t = setTimeout(() => { void persist(); }, 1200);
    return () => clearTimeout(t);
  }, [content, persist]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (save === 'dirty' || save === 'saving') e.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [save]);

  const set = (key: string, v: ContentValue) => setContent((c) => ({ ...c, [key]: v }));
  const patch = (p: Content) => setContent((c) => ({ ...c, ...p }));
  const tracksRequired = meta.schema.some((s) => s.fields.some((f) => f.required));
  const upload = useCallback((file: File, kind: 'image' | 'audio', maxMB?: number) => uploadMedia(file, userId, pageId, kind, maxMB), [userId, pageId]);

  /* ── click a photo tile in the live preview (currently only Book does this) to
     replace that exact slot, instead of the buyer only being able to add photos to
     a pool and hope they land on the right page ── */
  const pickPhotoInput = useRef<HTMLInputElement>(null);
  const pickSlot = useRef<number | null>(null);
  useEffect(() => {
    const onPick = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.data?.type !== 'dear:pick-photo') return;
      pickSlot.current = e.data.slot;
      pickPhotoInput.current?.click();
    };
    window.addEventListener('message', onPick);
    return () => window.removeEventListener('message', onPick);
  }, []);
  const onPickPhotoFile = async (file: File | undefined) => {
    const slot = pickSlot.current;
    if (!file || slot == null) return;
    const url = await upload(file, 'image').catch(() => null);
    if (!url) return;
    // 'photos' is Book's own images-field key — this message only ever comes from Book's preview.
    setContent((c) => {
      const arr = Array.isArray(c.photos) ? [...(c.photos as string[])] : [];
      while (arr.length <= slot) arr.push('');
      arr[slot] = url;
      return { ...c, photos: arr };
    });
  };

  const callPublish = async (body: Record<string, unknown>) => {
    const r = await fetch(`/api/pages/${pageId}/publish`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    return { ok: r.ok, j: await r.json().catch(() => ({})) };
  };
  const [publishErr, setPublishErr] = useState('');
  const publish = async () => {
    setPublishing(true); setPublishErr('');
    if (save !== 'saved') await persist();
    // first publish gets a readable link from the two names («nomin-temuulen»)
    const names = QUICK[meta.id]?.read(content);
    const suggest = names ? suggestSlug(names.them, names.you) : '';
    const { ok, j } = await callPublish({ publish: true, suggest }).catch(() => ({ ok: false, j: {} as Record<string, string> }));
    setPublishing(false);
    if (ok) { setStatus('published'); setSlug(j.slug); setSlugDraft(j.slug); setUrl(j.url); setShare(true); }
    else setPublishErr(j.error || 'Нийтэлж чадсангүй. Интернэтээ шалгаад дахин дарна уу.');
  };
  const saveSlug = async () => {
    setSlugErr('');
    const want = cleanSlug(slugDraft).replace(/^-|-$/g, '');
    if (!want || want === slug) return;
    const { ok, j } = await callPublish({ publish: true, slug: want });
    if (!ok) { setSlugErr(j.error || 'Алдаа гарлаа'); return; }
    setSlug(j.slug); setSlugDraft(j.slug); setUrl(j.url); setStatus('published');
  };
  const unpublish = async () => {
    const { ok } = await callPublish({ publish: false });
    if (ok) { setStatus('paid'); setShare(false); }
  };

  /* ── field ↔ preview mapping (see src/templates/fieldHighlight.ts for the preview side) ──
     Sidebar controls carry data-edit-field="<key>" or "<key>.<i>"; preview elements carry
     the same id as data-field. */
  const side = useRef<HTMLElement>(null);
  const fieldOf = useCallback((id: string) => {
    const base = id.replace(/(\.\d+)+$/, '');
    const idx = base === id ? null : Number(id.slice(base.length + 1).split('.')[0]);
    for (const sec of meta.schema) {
      const f = sec.fields.find((x) => x.key === base);
      if (f) return { sec, f, idx };
    }
    return null;
  }, [meta]);
  const inCards = (sec: Section, key: string) => !!sec.cards && [sec.cards.image, sec.cards.title, sec.cards.text].includes(key);
  const pinFor = useCallback((id: string): string | number | null => {
    const r = fieldOf(id); if (!r) return null;
    const { sec, f, idx } = r;
    if (inCards(sec, f.key) && sec.cards!.previewPrefix) return `${sec.cards!.previewPrefix}${idx ?? 0}`;
    if (f.itemPreview && idx != null) return `${f.itemPreview}${idx}`;
    return f.previewPage ?? sec.previewPage ?? null;
  }, [fieldOf]);
  const labelFor = useCallback((id: string) => {
    const r = fieldOf(id); if (!r) return id;
    const { sec, f, idx } = r;
    if (idx == null) return f.label;
    if (inCards(sec, f.key)) return `${sec.cards!.itemLabel} ${idx + 1} · ${f.key === sec.cards!.image ? 'зураг' : f.key === sec.cards!.title ? 'гарчиг' : 'тэмдэглэл'}`;
    return `${('itemLabel' in f && f.itemLabel) || f.label} ${idx + 1}`;
  }, [fieldOf]);
  const broadcast = (msg: object) => document.querySelectorAll<HTMLIFrameElement>('iframe[src^="/render/"]')
    .forEach((f) => f.contentWindow?.postMessage(msg, window.location.origin));

  // what the buyer is on right now: the focused control, else the hovered one
  const [active, setActive] = useState<string | null>(null);
  const [sheet, setSheet] = useState<string | null>(null); // phone: field opened from the preview
  useEffect(() => {
    const el = side.current; if (!el) return;
    const idOf = (t: EventTarget | null) => (t instanceof Element ? t.closest('[data-edit-field]')?.getAttribute('data-edit-field') ?? null : null);
    let focused: string | null = null, hovered: string | null = null, t = 0;
    const upd = () => setActive(focused ?? hovered);
    const fin = (e: FocusEvent) => { focused = idOf(e.target); upd(); };
    const fout = (e: FocusEvent) => { focused = el.contains(e.relatedTarget as Node) ? idOf(e.relatedTarget) : null; upd(); };
    const over = (e: PointerEvent) => { const id = idOf(e.target); clearTimeout(t); t = window.setTimeout(() => { hovered = id; upd(); }, id ? 180 : 60); };
    const leave = () => { clearTimeout(t); hovered = null; upd(); };
    el.addEventListener('focusin', fin); el.addEventListener('focusout', fout);
    el.addEventListener('pointerover', over); el.addEventListener('pointerleave', leave);
    return () => {
      clearTimeout(t);
      el.removeEventListener('focusin', fin); el.removeEventListener('focusout', fout);
      el.removeEventListener('pointerover', over); el.removeEventListener('pointerleave', leave);
    };
  }, []);
  const current = sheet ?? active;
  useEffect(() => {
    broadcast({ type: 'dear:focus-field', field: current, label: current ? labelFor(current) : '' });
    if (!current) return;
    // landed on the whole field (e.g. its «＋ add» button) after a jump to one of its items: keep that item's scene
    if (pinLock.current && pinLock.current.base === current) return;
    pinLock.current = null;
    const p = pinFor(current); if (p != null) setFocusPin(p);
  }, [current, labelFor, pinFor]);

  // a preview that (re)loads gets the current highlight too
  const sync = useRef(() => {});
  sync.current = () => {
    broadcast({ type: 'dear:focus-field', field: current, label: current ? labelFor(current) : '' });
  };
  // preview → field: open its step, scroll to it, focus it, flash it (phone: a bottom sheet)
  const [pending, setPending] = useState<string | null>(null);
  const openField = useRef((id: string) => {});
  openField.current = (id: string) => {
    const r = fieldOf(id); if (!r) return;
    const key = stepKeyFor(r.sec, r.idx);
    if (key !== open) keepPin.current = true;
    setOpen(key);
    const p = pinFor(id);
    if (p != null) { setFocusPin(p); pinLock.current = { base: r.f.key }; }
    if (tab === 'preview' && window.innerWidth < 900) { setSheet(id); return; }
    setPending(id);
  };
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === 'dear:ready') setTimeout(() => sync.current(), 80);
      if (e.data?.type === 'dear:field-click' && typeof e.data.field === 'string') openField.current(e.data.field);
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);
  useEffect(() => {
    if (!pending) return;
    const id = pending, base = id.replace(/(\.\d+)+$/, '');
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => {
      const root = side.current;
      const el = root?.querySelector<HTMLElement>(`[data-edit-field="${CSS.escape(id)}"]`) ?? root?.querySelector<HTMLElement>(`[data-edit-field="${CSS.escape(base)}"]`);
      if (el) {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        const input = el.querySelector<HTMLElement>('textarea, input:not([type=file]):not([type=color]):not([type=date]), button');
        input?.focus({ preventScroll: true });
        // the click that got us here focuses the preview iframe once it finishes — take the caret back
        setTimeout(() => { if (document.activeElement?.tagName === 'IFRAME') input?.focus({ preventScroll: true }); }, 160);
        el.classList.remove('ed-flash'); void el.offsetWidth; el.classList.add('ed-flash');
        setTimeout(() => el.classList.remove('ed-flash'), 1400);
      }
      setPending(null);
    }));
    return () => cancelAnimationFrame(raf);
  }, [pending, open]);

  /* ── things worth fixing, in plain words, each with a one-tap fix ── */
  const issues = useMemo(() => {
    const out: { id: string; text: string }[] = [];
    const dat = (w: string) => dative(w.toLowerCase());
    for (const sec of meta.schema) {
      for (const f of sec.fields) {
        if (f.required && !filled(f, content[f.key])) out.push({ id: f.key, text: `«${f.label}» хоосон байна — энд дарж бөглөх` });
      }
      // items that have words but no photo (Quest chests, Flight stops) — optional, but the gift looks better with one
      const c = sec.cards;
      const photosF = c ? sec.fields.find((x) => x.key === c.image) : sec.fields.find((x) => x.type === 'images' && x.itemPreview);
      const wordsF = c ? sec.fields.find((x) => x.key === c.title) : sec.fields.find((x) => x.type === 'list');
      if (photosF && wordsF) {
        const photos = asArr(content[photosF.key]), words = asArr(content[wordsF.key]);
        const label = c?.itemLabel ?? ('itemLabel' in wordsF && wordsF.itemLabel) ?? 'Хэсэг';
        words.forEach((w, i) => {
          if (w?.trim() && !photos[i]) out.push({ id: `${photosF.key}.${i}`, text: `${i + 1}-р ${dat(String(label))} зураг алга — энд дарж нэмэх` });
        });
      }
    }
    return out;
  }, [meta, content]);
  const [issuesOpen, setIssuesOpen] = useState(false);

  const saveLabel = { saved: 'Бүгд хадгалагдсан', dirty: 'Хадгалаагүй өөрчлөлт…', saving: 'Хадгалж байна…', error: 'Хадгалж чадсангүй — дараагийн засвараар дахин оролдоно' }[save];

  const themName = QUICK[meta.id]?.read(content).them ?? '';
  const shareModal = (
    <>
      {share && slug && (
        <ShareScreen
          url={url} slug={slug} name={themName} slugDraft={slugDraft} setSlugDraft={setSlugDraft} saveSlug={saveSlug} slugErr={slugErr}
          linkBase={linkBase} subdomain={subdomain} unpublish={unpublish} close={() => setShare(false)}
        />
      )}
      {intro && <IntroModal onClose={closeIntro} />}
      {recipientView && <RecipientView templateId={meta.id} content={content} name={themName} onClose={() => setRecipientView(false)} />}
    </>
  );

  return (
    <div className="ed" data-tab={tab}>
      <header className="ed-top">
        <div className="row" style={{ minWidth: 0 }}>
          <Link href="/dashboard" className="ed-back" aria-label="Миний хуудсууд руу буцах">←</Link>
          <div style={{ minWidth: 0 }}>
            <div className="ed-title">{meta.name}</div>
            <div className={`ed-save ${save}`}>
              {saveLabel}
              {save === 'error' && <button type="button" className="ed-retry" onClick={() => void persist()}>↻ Дахин</button>}
            </div>
          </div>
        </div>
        <div className="ed-tabs">
          <button className={tab === 'edit' ? 'on' : ''} onClick={() => setTab('edit')}>Засах</button>
          <button className={tab === 'preview' ? 'on' : ''} onClick={() => setTab('preview')}>Харах</button>
        </div>
        <div className="row">
            <button className="btn btn-sm ed-icon-btn" onClick={() => setIntro(true)} aria-label="Хэрхэн ашиглах вэ?" title="Хэрхэн ашиглах вэ?">?</button>
          <button className="btn btn-sm ed-recipient-btn" onClick={() => setRecipientView(true)} title="Утсан дээр яг ингэж нээгдэнэ">👁<span className="ed-lbl"> Хүлээн авагч юу харах вэ?</span></button>
          <div className="ed-devices">
            <button className={device === 'desktop' ? 'on' : ''} onClick={() => setDevice('desktop')} title="Компьютер">🖥</button>
            <button className={device === 'mobile' ? 'on' : ''} onClick={() => setDevice('mobile')} title="Утас">📱</button>
          </div>
          <button
            className={`btn btn-sm ed-full-btn ${previewingFull ? 'btn-primary' : ''}`}
            onClick={() => setPreviewingFull((v) => !v)}
            title="Хэсэг тус бүрт зогсолгүй, эхнээс дуустал бүтнээр нь үзэх"
          >
            ▶<span className="ed-lbl"> Бүтнээр</span>
          </button>
          {status === 'published'
            ? <button className="btn btn-sm btn-rose" onClick={() => setShare(true)}>Хуваалцах</button>
            : <button className="btn btn-sm btn-rose" onClick={publish} disabled={publishing}>{publishing ? 'Нийтэлж байна…' : 'Нийтлэх'}</button>}
        </div>
      </header>

      <aside className="ed-side" ref={side}>
        <div className="ed-lock">🔒 Энэ хуудсыг зөвхөн та засах эрхтэй</div>
        {issues.length > 0 && (
          <div className={`ed-issues ${issuesOpen ? 'open' : ''}`}>
            <button type="button" className="ed-issues-head" onClick={() => setIssuesOpen((o) => !o)} aria-expanded={issuesOpen}>
              <span>⚠ Анхаарах зүйл ({issues.length})</span><i aria-hidden>{issuesOpen ? '▴' : '▾'}</i>
            </button>
            {issuesOpen && (
              <ul>
                {issues.map((it) => (
                  <li key={it.id}><button type="button" onClick={() => openField.current(it.id)}>{it.text}</button></li>
                ))}
              </ul>
            )}
          </div>
        )}
        <p className="ed-steps-hint"><span aria-hidden>👇</span> Хуудас солихдоо доорх дугааруудыг дарна. Бэлэг дээрх дэлгэцийг дарснаар хуудас эргэхгүй.</p>
        <nav className="ed-steps" aria-label="Хэсгүүд">
          {steps.map((st, i) => {
            // Page-based templates (Book: numeric previewPage) label each step with the page
            // number the preview's counter shows for it; sections that aren't tied to one
            // page (Book's bulk photo upload) get an icon. Everything else is numbered 1..n in walk order.
            const s = st.sec;
            const pageNo = st.item == null && typeof s.previewPage === 'number' ? s.previewPage + 1 : null;
            const paged = meta.schema.some((x) => typeof x.previewPage === 'number');
            const label = st.item != null ? i + 1 : (s.short ?? (paged ? (pageNo ?? '▦') : i + 1));
            // ⚠ = something required is still empty; ✓ = nothing required is missing
            const state = !tracksRequired || st.item != null ? null : missing(s, content) ? 'todo' : 'done';
            const stateLabel = state === 'todo' ? ' · дутуу' : state === 'done' ? ' · бэлэн' : '';
            const name = (pageNo ? `${pageNo}-р хуудас · ` : `${i + 1}. `) + stepTitle(st);
            return (
              <button
                key={st.key}
                type="button"
                className={`ed-step ${s.short && st.item == null ? 'wide' : ''} ${open === st.key ? 'on' : ''} ${state ?? ''}`}
                aria-current={open === st.key ? 'step' : undefined}
                aria-label={name + stateLabel}
                title={name + stateLabel}
                onClick={() => setOpen(st.key)}
              >
                {label}
                {state && <i aria-hidden>{state === 'todo' ? '⚠' : '✓'}</i>}
              </button>
            );
          })}
        </nav>
        {currentSection && (
          <section className="ed-sec open">
            <h2 className="ed-sec-title">
              <span><small className="ed-progress">Алхам {openIndex + 1}/{steps.length}</small>{stepTitle(step)}</span>
              {/* mini-map: the page/scene this step controls, with the focused element marked */}
              <PreviewFrame
                inert thumb className="ed-minimap" title={`${stepTitle(step)} — бяцхан зураг`}
                templateId={meta.id} content={content} pin={pin} device="mobile" pad={0} debounceMs={1500}
              />
            </h2>
            <div className="ed-sec-body">
              {currentSection.summary && <p className="ed-summary">{currentSection.summary}</p>}
              {currentSection.description && <p className="ed-help" style={{ marginTop: 0 }}>{currentSection.description}</p>}
              {step.item != null && <ItemStep step={step} content={content} onPatch={patch} upload={upload} tokens={meta.tokens} />}
              {(() => {
                const cards = step.item != null ? undefined : currentSection.cards;
                const itemKeys = new Set(step.item != null ? itemFields(currentSection).map((f) => f.key) : []);
                const inCards = (k: string) => itemKeys.has(k) || (!!cards && (k === cards.image || k === cards.title || k === cards.text));
                const maxOf = (k: string) => { const f = currentSection.fields.find((x) => x.key === k); return f && 'max' in f ? f.max : undefined; };
                const tokensFor = (k: string) => (currentSection.fields.find((x) => x.key === k)?.tokens ? meta.tokens : undefined);
                return (
                  <>
                    {cards && (
                      <Cards
                        key={currentSection.id} cfg={cards} content={content} onPatch={patch} upload={upload}
                        tokens={tokensFor(cards.text)} titleMax={maxOf(cards.title)} textMax={maxOf(cards.text)}
                        onFocusCard={(i) => cards.previewPrefix && setFocusPin(`${cards.previewPrefix}${i}`)}
                      />
                    )}
                    {currentSection.fields.filter((f) => !inCards(f.key)).map((f) => (
                      <FieldControl
                        key={f.key} field={f} value={content[f.key]} onChange={(v) => set(f.key, v)} upload={upload}
                        tokens={f.tokens ? meta.tokens : undefined}
                      />
                    ))}
                  </>
                );
              })()}
              <div className="ed-step-nav">
                {prevStep
                  ? <button className="btn" onClick={() => setOpen(prevStep.key)} title={stepTitle(prevStep)}>← Өмнөх</button>
                  : <span />}
                {nextStep ? (
                  <button className="btn btn-primary" onClick={() => setOpen(nextStep.key)} title={stepTitle(nextStep)}>
                    Дараах: {stepTitle(nextStep)} →
                  </button>
                ) : status !== 'published' ? (
                  <button className="btn btn-rose" onClick={publish} disabled={publishing}>{publishing ? 'Нийтэлж байна…' : 'Дуусгах · Нийтлэх 💌'}</button>
                ) : (
                  <button className="btn btn-rose" onClick={() => setShare(true)}>Дуусгах · Хуваалцах 🔗</button>
                )}
              </div>
              {publishErr && <p className="err" role="alert" style={{ margin: '10px 0 0' }}>{publishErr}</p>}
            </div>
          </section>
        )}
        <p className="ed-help" style={{ padding: '6px 4px 30px' }}>
          Өөрчлөлт автоматаар хадгалагдана. {status === 'published' ? 'Таны линк шууд шинэчлэгдэнэ.' : 'Бэлэн болмогц «Нийтлэх» дарна уу.'}
        </p>
      </aside>

      <section className="ed-stage">
        <PreviewFrame
          key={previewingFull ? 'full' : 'pinned'} className="ed-stage-frame" edit={!previewingFull && !narrow} inert={narrow && !previewingFull}
          templateId={meta.id} content={content} pin={pin} device={device} debounceMs={debounce}
        />
        {narrow && tab === 'preview' && (
          <button type="button" className="ed-float-edit" onClick={() => setTab('edit')}>✎ Засах</button>
        )}
        <input
          ref={pickPhotoInput} type="file" accept="image/*" hidden
          onChange={(e) => { void onPickPhotoFile(e.target.files?.[0]); e.target.value = ''; }}
        />
      </section>

      {sheet && (() => {
        const r = fieldOf(sheet); if (!r) return null;
        const { f, idx } = r, arr = asArr(content[f.key]);
        const setItem = (v: string) => { const next = Array.from({ length: Math.max(arr.length, (idx ?? 0) + 1) }, (_, k) => arr[k] ?? ''); next[idx!] = v; set(f.key, next); };
        return (
          <div className="ed-sheet-wrap" onClick={(e) => e.target === e.currentTarget && setSheet(null)}>
            <div className="ed-sheet" role="dialog" aria-label={labelFor(sheet)}>
              <header><b>✎ {labelFor(sheet)}</b><button type="button" className="btn btn-sm btn-primary" onClick={() => setSheet(null)}>Болсон</button></header>
              {idx != null && f.type === 'list' ? <TextBox multiline value={arr[idx] ?? ''} max={f.max} rows={3} onChange={setItem} tokens={f.tokens ? meta.tokens : undefined} label={labelFor(sheet)} />
                : idx != null && f.type === 'images' ? <ImageSlot url={arr[idx] ?? ''} onChange={setItem} upload={upload} />
                : <FieldControl field={f} value={content[f.key]} onChange={(v) => set(f.key, v)} upload={upload} tokens={f.tokens ? meta.tokens : undefined} />}
            </div>
          </div>
        );
      })()}
      {shareModal}
    </div>
  );
}
