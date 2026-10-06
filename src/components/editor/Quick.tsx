'use client';
import { useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import Link from 'next/link';
import './quick.css';
import type { Content, TemplateMeta } from '@/templates/types';
import { TONES, str, type QuickInput, type QuickSpec, type Tone } from '@/templates/quick';
import { DateInput, TextBox, type Uploader } from './Fields';
import { PreviewFrame } from './PreviewFrame';
import { todayIso } from '@/lib/dates';
import type { SaveState } from './Editor';

type Props = {
  meta: TemplateMeta; spec: QuickSpec; content: Content;
  onPatch: (p: Content) => void; upload: Uploader;
  save: SaveState; saveLabel: string; status: 'paid' | 'published';
  publishing: boolean; publishErr: string;
  onPublish: () => void; onShare: () => void; onAdvanced: () => void;
  /** Reopen the 3-slide intro. */
  onHelp: () => void;
};

const STEPS = ['Нэрс', 'Зургууд', 'Үгс', 'Бэлэн'] as const;
type Step = 0 | 1 | 2 | 3;
type Tile = { id: string; url: string; busy?: boolean };
let seq = 0;
const tid = () => `t${++seq}`;

/**
 * The default create flow: 4 full-screen steps with the live preview on top (phone) or
 * beside (desktop). Every answer is written straight into content through the template's
 * QuickSpec, so the advanced editor always shows exactly what this flow produced.
 */
export function Quick({ meta, spec, content, onPatch, upload, save, saveLabel, status, publishing, publishErr, onPublish, onShare, onAdvanced, onHelp }: Props) {
  const [step, setStep] = useState<Step>(0);
  // The template's sample names (Ану / Бат) are for the demo — a new gift starts with empty boxes.
  const init = useRef((() => {
    const r = spec.read(content), d = spec.read(meta.defaults);
    return { ...r, them: r.them === d.them ? '' : r.them, you: r.you === d.you ? '' : r.you };
  })()).current;
  const [them, setThem] = useState(init.them);
  const [you, setYou] = useState(init.you);
  const [date, setDate] = useState(init.date);
  const [tiles, setTiles] = useState<Tile[]>(() => init.photos.map((url) => ({ id: tid(), url })));
  // A fresh gift gets the romantic texts as soon as the buyer reaches step 3. A gift whose
  // main message was already changed keeps its words until a tone is actually picked.
  const fresh = str(content[spec.messageKey]) === str(meta.defaults[spec.messageKey]);
  const [tone, setTone] = useState<Tone | null>(null);
  const [custom, setCustom] = useState(false);
  const [message, setMessage] = useState('');
  const [nameErr, setNameErr] = useState(false);

  const photos = tiles.filter((t) => !t.busy && t.url).map((t) => t.url);
  const input = (over: Partial<QuickInput> = {}): QuickInput => ({
    them: them.trim(), you: you.trim(), date, photos, tone: tone ?? 'romantic', message: custom ? message : undefined, ...over,
  });
  /** Write one step's answers (plus the texts, once a tone is chosen — they mention names/photo counts). */
  const apply = (q: QuickInput, part: 'names' | 'photos' | 'texts', withTexts = tone !== null) => {
    onPatch({ ...(part !== 'texts' ? spec[part](q) : {}), ...(withTexts || part === 'texts' ? spec.texts(q) : {}) });
  };

  const setName = (who: 'them' | 'you', v: string) => {
    (who === 'them' ? setThem : setYou)(v);
    setNameErr(false);
    apply(input({ [who]: v.trim() }), 'names');
  };
  const pickDate = (v: string) => { setDate(v); apply(input({ date: v }), 'names'); };
  const setPhotos = (next: Tile[]) => {
    setTiles(next);
    apply(input({ photos: next.filter((t) => !t.busy && t.url).map((t) => t.url) }), 'photos');
  };
  const chooseTone = (t: Tone) => { setTone(t); setCustom(false); apply(input({ tone: t, message: undefined }), 'texts', true); };
  const chooseCustom = () => {
    setCustom(true);
    const current = message || str(content[spec.messageKey]);
    setMessage(current);
    apply(input({ message: current }), 'texts', true);
  };
  const writeMessage = (v: string) => { setMessage(v); apply(input({ message: v }), 'texts', true); };

  const namesOk = !!them.trim() && !!you.trim();
  const go = (s: Step) => {
    if (s > 0 && !namesOk) { setStep(0); setNameErr(true); return; }
    if (s === 2 && tone === null && fresh) { setTone('romantic'); apply(input({ tone: 'romantic' }), 'texts', true); }
    setStep(s);
    window.scrollTo({ top: 0 });
  };

  const pin = step === 0 ? spec.pins.names : step === 1 ? spec.pins.photos : step === 2 ? spec.pins.tone : null;
  const [replay, setReplay] = useState(0);
  const [big, setBig] = useState(false); // phone: blow the preview up to most of the screen

  return (
    <div className="qk" data-step={step} data-big={big || undefined}>
      <header className="qk-top">
        {step > 0
          ? <button type="button" className="qk-icon" onClick={() => go((step - 1) as Step)} aria-label="Өмнөх алхам">←</button>
          : <Link href="/dashboard" className="qk-icon" aria-label="Миний хуудсууд руу буцах">←</Link>}
        <div className="qk-progress" aria-label={`${step + 1}/4 алхам: ${STEPS[step]}`}>
          <div className="qk-steps">
            {STEPS.map((l, i) => (
              <button key={l} type="button" className={i === step ? 'on' : i < step ? 'done' : ''} onClick={() => go(i as Step)} aria-current={i === step ? 'step' : undefined}>
                <i>{i < step ? '✓' : i + 1}</i><span>{l}</span>
              </button>
            ))}
          </div>
          <small className={`qk-save ${save}`}>{saveLabel}</small>
        </div>
        <button type="button" className="qk-icon qk-help" onClick={onHelp} aria-label="Хэрхэн ашиглах вэ?" title="Хэрхэн ашиглах вэ?">?</button>
        <button type="button" className="qk-adv" onClick={onAdvanced}>Дэлгэрэнгүй засах</button>
      </header>

      <div className="qk-body">
        <section className="qk-preview" aria-label="Шууд харагдац">
          <PreviewFrame
            key={step === 3 ? `result-${replay}` : 'edit'}
            templateId={meta.id} content={content} pin={pin} device="mobile" pad={step === 3 ? 24 : 12}
            debounceMs={250} recipient={step === 3} title={step === 3 ? 'Хүлээн авагчийн харах байдал' : 'Шууд харагдац'}
          />
          {step === 3 && <button type="button" className="qk-replay" onClick={() => setReplay((r) => r + 1)}>↺ Эхнээс нь үзэх</button>}
          {step < 3 && (
            <button type="button" className="qk-zoom" onClick={() => setBig((b) => !b)} aria-pressed={big} aria-label={big ? 'Жижгээр харах' : 'Томоор харах'}>
              {big ? '⤡ Жижигрүүлэх' : '⤢ Томоор'}
            </button>
          )}
        </section>

        <section className="qk-panel">
          {step === 0 && (
            <div className="qk-card">
              <h1>Хэнд зориулж байна вэ?</h1>
              <p className="qk-lead">Хоёр нэр л хангалттай. Бусдыг нь бид бэлдчихнэ.</p>
              <label className="qk-field">
                <span>Түүний нэр</span>
                <input className="qk-input" value={them} onChange={(e) => setName('them', e.target.value)} placeholder="ж: Ану" autoComplete="off" enterKeyHint="next" maxLength={40} aria-invalid={nameErr && !them.trim() || undefined} />
              </label>
              <label className="qk-field">
                <span>Таны нэр</span>
                <input className="qk-input" value={you} onChange={(e) => setName('you', e.target.value)} placeholder="ж: Бат" autoComplete="off" enterKeyHint="next" maxLength={40} aria-invalid={nameErr && !you.trim() || undefined} />
              </label>
              <div className="qk-field">
                <span>Танилцсан өдөр <small>заавал биш</small></span>
                <DateInput value={date} onChange={pickDate} max={todayIso()} />
                <small className="qk-hint">Хамт байгаа өдрүүдээ тоолоход ашиглана.</small>
              </div>
              {nameErr && <p className="qk-err" role="alert">{!them.trim() ? 'Түүний нэрийг бичээрэй 🙂' : 'Өөрийнхөө нэрийг бичээрэй 🙂'}</p>}
            </div>
          )}

          {step === 1 && <PhotoStep tiles={tiles} setTiles={setTiles} commit={setPhotos} max={spec.maxPhotos} upload={upload} />}

          {step === 2 && (
            <div className="qk-card">
              <h1>Ямар өнгө аястай байх вэ?</h1>
              <p className="qk-lead">Сонгосон аясаар бүх бичвэрийг {them.trim() || 'түүний'} нэртэй бөглөнө. Дараа нь үг бүрийг засаж болно.</p>
              <div className="qk-tones" role="radiogroup" aria-label="Өнгө аяс">
                {TONES.map((t) => (
                  <button key={t.id} type="button" role="radio" aria-checked={!custom && tone === t.id} className={`qk-tone ${!custom && tone === t.id ? 'on' : ''}`} onClick={() => chooseTone(t.id)}>
                    <b aria-hidden>{t.emoji}</b><strong>{t.label}</strong><small>{t.blurb}</small>
                  </button>
                ))}
                <button type="button" role="radio" aria-checked={custom} className={`qk-tone wide ${custom ? 'on' : ''}`} onClick={chooseCustom}>
                  <b aria-hidden>✍️</b><strong>Өөрөө бичих</strong><small>Гол захидлаа өөрийнхөөрөө бичнэ.</small>
                </button>
              </div>
              {custom && (
                <div className="qk-field">
                  <span>Таны захидал</span>
                  <TextBox multiline value={message} rows={5} onChange={writeMessage} tokens={meta.tokens} placeholder="Сэтгэлээсээ хэдэн өгүүлбэр бичээрэй…" label="Таны захидал" />
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="qk-card qk-done">
              <h1>{status === 'published' ? 'Таны бэлэг нийтлэгдсэн ✓' : 'Бэлэг бэлэн боллоо!'}</h1>
              <p className="qk-lead">Яг ингэж {them.trim() || 'тэр'} утсан дээрээ харна. Таалагдвал нийтлээд линкээ илгээгээрэй.</p>
              {publishErr && <p className="qk-err" role="alert">{publishErr}</p>}
            </div>
          )}

          <footer className="qk-foot">
            {step < 3 ? (
              <>
                {step === 1 && !tiles.length && <button type="button" className="qk-skip" onClick={() => go(2)}>Дараа нэмэх</button>}
                <button type="button" className="qk-next" onClick={() => go((step + 1) as Step)} disabled={step === 1 && tiles.some((t) => t.busy)}>
                  {step === 1 && tiles.some((t) => t.busy) ? 'Зураг орж байна…' : step === 2 ? 'Харах →' : 'Үргэлжлүүлэх →'}
                </button>
              </>
            ) : (
              <>
                {status === 'published'
                  ? <button type="button" className="qk-next" onClick={onShare}>Линкээ илгээх 💌</button>
                  : <button type="button" className="qk-next" onClick={onPublish} disabled={publishing}>{publishing ? 'Нийтэлж байна…' : 'Нийтлэх 💌'}</button>}
                <button type="button" className="qk-skip" onClick={onAdvanced}>Дэлгэрэнгүй засах</button>
              </>
            )}
          </footer>
        </section>
      </div>
    </div>
  );
}

/* ── step 2: one multi-upload, then a grid you reorder by dragging ⠿ ── */
function PhotoStep({ tiles, setTiles, commit, max, upload }: {
  tiles: Tile[]; setTiles: (f: (t: Tile[]) => Tile[]) => void; commit: (t: Tile[]) => void; max: number; upload: Uploader;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [errs, setErrs] = useState<string[]>([]);
  const latest = useRef(tiles); latest.current = tiles;
  const room = max - tiles.length;

  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    const list = [...files].slice(0, Math.max(0, room));
    const skipped = files.length - list.length;
    const pending = list.map(() => ({ id: tid(), url: '', busy: true }));
    setTiles((t) => [...t, ...pending]);
    setErrs(skipped > 0 ? [`Энэ загварт ${max} хүртэл зураг орно — ${skipped} зургийг орхилоо.`] : []);
    // 3 at a time: fast on phones without choking the connection
    let next = 0;
    const worker = async () => {
      while (next < list.length) {
        const i = next++;
        const url = await upload(list[i], 'image').catch((e: Error) => { setErrs((x) => [...x, `«${list[i].name}»: ${e.message}`]); return ''; });
        const cur = latest.current.map((t) => (t.id === pending[i].id ? { ...t, url, busy: false } : t)).filter((t) => t.busy || t.url);
        latest.current = cur;
        commit(cur);
      }
    };
    await Promise.all([worker(), worker(), worker()]);
  };

  /* drag ⠿ to reorder (pointer events — works with touch) */
  const grid = useRef<HTMLOListElement>(null);
  const drag = useRef<number | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const move = (from: number, to: number) => {
    const cur = latest.current;
    if (to < 0 || to >= cur.length || from === to) return;
    const next = [...cur]; next.splice(to, 0, ...next.splice(from, 1));
    latest.current = next;
    commit(next);
  };
  // Listen on window: re-ordering moves the tile's DOM node, which drops pointer capture,
  // so the handle itself would never hear the pointerup.
  const down = (i: number) => (e: RPointerEvent<HTMLButtonElement>) => {
    e.preventDefault(); drag.current = i; setDragging(i);
    const stop = () => { up(); window.removeEventListener('pointermove', over); window.removeEventListener('pointerup', stop); window.removeEventListener('pointercancel', stop); };
    window.addEventListener('pointermove', over); window.addEventListener('pointerup', stop); window.addEventListener('pointercancel', stop);
  };
  const over = (e: PointerEvent) => {
    const from = drag.current;
    if (from == null || !grid.current) return;
    const to = [...grid.current.children].findIndex((c) => {
      const r = c.getBoundingClientRect();
      return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    });
    if (to < 0 || to === from || to >= latest.current.length) return;
    move(from, to); drag.current = to; setDragging(to);
  };
  const up = () => { drag.current = null; setDragging(null); };

  return (
    <div className="qk-card">
      <h1>Хамтдаа авхуулсан зургууд</h1>
      <p className="qk-lead">5–{max} зураг сонгоход хамгийн гоё харагдана. Эхний зураг хамгийн томоор гарна.</p>
      <button type="button" className="qk-upload" onClick={() => input.current?.click()} disabled={room <= 0}>
        <b aria-hidden>📷</b>
        <span>{tiles.length ? 'Дахиад зураг нэмэх' : 'Зургаа сонгох'}</span>
        <small>{tiles.length}/{max} · нэг дор олныг сонгож болно</small>
      </button>
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => { void add(e.target.files); e.target.value = ''; }} />
      {errs.map((m, i) => <p key={i} className="qk-err" role="alert">{m}</p>)}
      {tiles.length > 0 && (
        <>
          <ol className="qk-grid" ref={grid}>
            {tiles.map((t, i) => (
              <li key={t.id} className={`qk-tile ${dragging === i ? 'dragging' : ''}`}>
                {t.busy ? <span className="ed-spin" /> : <img src={t.url} alt={`${i + 1}-р зураг`} draggable={false} />}
                <span className="qk-num">{i + 1}</span>
                {!t.busy && (
                  <>
                    <button type="button" className="qk-drag" aria-label={`${i + 1}-р зургийг зөөх (← → товчоор)`}
                      onPointerDown={down(i)}
                      onKeyDown={(e) => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); move(i, i + (e.key === 'ArrowLeft' ? -1 : 1)); } }}
                    >⠿</button>
                    <button type="button" className="qk-del" aria-label={`${i + 1}-р зургийг хасах`} onClick={() => commit(latest.current.filter((x) => x.id !== t.id))}>✕</button>
                  </>
                )}
              </li>
            ))}
          </ol>
          <p className="qk-hint">⠿ дээр дараад чирж дарааллыг нь солино.</p>
        </>
      )}
    </div>
  );
}
