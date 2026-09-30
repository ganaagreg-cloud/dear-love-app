import { Fragment } from 'react';
import s from './Scrapbook.module.css';
import { Page, Photo, Tape, Ransom, Clutter, Sticker, Lines } from './parts';
import type { ScrapbookData } from './scrapbookData';

const U = (id: string) => `https://images.unsplash.com/photo-${id}?w=1000&q=60&auto=format&fit=crop`;
// Stickers: hand-drawn die-cut SVGs made for this template (public/tpl/book/stickers).
const TULIPS = '/tpl/book/stickers/tulips.svg';
const ROSE = '/tpl/book/stickers/rose.svg';
const SPRIG = '/tpl/book/stickers/sprig.svg';
const CAT_SIT = '/tpl/book/stickers/cat-sit.svg';
const CAT_SLEEP = '/tpl/book/stickers/cat-sleep.svg';
const cap = (...c: string[]) => [s.caption, ...c].join(' ');
// Clutter overlays: free Unsplash textures
const C_FLOWER = U('1701637342019-55feedd6df58'); // dried flowers
const C_LOVE = U('1617901817432-9c76649beaf6');   // love letter
const C_RED = U('1600294421265-c354b772e790');    // red gingham

/** Returns the 12 page elements as direct siblings (required by react-pageflip + nth-child gutter shadow). */
export function renderPages(d: ScrapbookData, onPick?: (slot: number) => void, selected?: number | null) {
  const t = d.texts;
  // Every placement below has its own unique, non-shared slot (0-37) — no page ever
  // shows the same photo another page owns, and no reuse/cycling happens by default.
  // A buyer only needs to fill the first ~10 (the bulk sidebar upload's cap) to cover
  // the cover/record/lucky pages; every other tile starts empty until the buyer clicks
  // it directly in the preview to assign it its own photo.
  const p = (slot: number) => d.photos[slot] || '';
  const photo = (slot: number, className?: string) => (
    <Photo src={p(slot)} className={className} onClick={onPick ? () => onPick(slot) : undefined} selected={selected === slot} field={`photos.${slot}`} />
  );

  // A strip/row of small photos: dropped entirely for the recipient when none are filled.
  const strip = (className: string, ...slots: number[]) =>
    !onPick && slots.every((n) => !p(n)) ? null : <div className={className}>{slots.map((n) => <Fragment key={n}>{photo(n)}</Fragment>)}</div>;

  return [
    <Page key={0} n={0} hard className={s.frontCover}>
      <div className={s.crumples} data-bleed />
      <span className={s.coverStar} aria-hidden>✦</span>
      <span className={s.coverStarTwo} aria-hidden>✧</span>
      <div className={s.coverNote}>
        <span data-field="texts.coverEyebrow">{t.coverEyebrow}</span>
        <strong data-field="partnerName">{d.partnerName || 'хайрт минь'}</strong>
        <small data-field="texts.coverSub">{t.coverSub}</small>
      </div>
      {photo(0, s.coverFlowerPhoto)}
      {photo(1, s.coverSmallPhoto)}
      {photo(2, s.coverFilmPhoto)}
      <Sticker src={TULIPS} className={s.coverFlower} />
      <Tape className={s.coverTape} />
    </Page>,

    <Page key={1} n={1} className={s.recordPage}>
      <Clutter src={C_FLOWER} className={s.recordClutter} />
      <div className={s.vinyl} data-bleed><span /><i data-field="texts.recordLabel">{t.recordLabel}</i></div>
      {photo(3, s.recordPhotoOne)}
      {photo(4, s.recordPhotoTwo)}
      <Tape className={s.recordTape} />
      <p className={cap(s.recordWords, s.onKraft)} data-field="texts.recordWords">{t.recordWords}</p>
      <Sticker src={SPRIG} className={s.whiteFlowers} />
      {strip(s.recordMiniStrip, 5, 6, 7)}
    </Page>,

    <Page key={2} n={2} className={s.luckyPage}>
      <Clutter src={C_LOVE} className={s.luckyClutter} />
      <div className={s.luckyPaper} data-field="texts.lucky"><Lines text={t.lucky} /></div>
      {photo(8, s.luckyMainPhoto)}
      {photo(9, s.luckyTopPhoto)}
      {photo(10, s.cameraPhoto)}
      <div className={s.cameraFrame}><span /></div>
      <p className={cap(s.luckyNote)} data-field="texts.luckyNote">{t.luckyNote}</p>
      <span className={s.metalStar} aria-hidden>★</span>
    </Page>,

    <Page key={3} n={3} className={s.letterPage}>
      <Clutter src={C_FLOWER} className={s.letterClutter} />
      <div className={s.tornLayer} data-bleed />
      <div className={s.envelope} />
      <div className={s.letterCard}>
        <span data-field="texts.letterEyebrow">{t.letterEyebrow}</span>
        <strong data-field="texts.letterTitle">{t.letterTitle}</strong>
        <p className={s.caption} data-field="texts.letterBody">{t.letterBody}</p>
      </div>
      {photo(11, s.letterPhoto)}
      {photo(12, s.letterTinyPhoto)}
      <div className={s.ticket} data-field="texts.ticket">НЭГ ХҮН<br /><b>{t.ticket}</b></div>
      <Sticker src={ROSE} className={s.letterFlower} />
      <Tape className={s.letterTape} />
    </Page>,

    <Page key={4} n={4} className={s.littleThingsPage}>
      <Clutter src={C_RED} className={s.littleClutter} />
      <h2 data-field="texts.littleTitle">{t.littleTitle}</h2>
      {photo(13, s.littleMainPhoto)}
      {strip(s.contactStrip, 14, 15, 16)}
      <p className={cap(s.littleNote)} data-field="texts.littleNote">{t.littleNote}</p>
      <Sticker src={TULIPS} className={s.littleFlower} />
      <div className={s.mapScrap} data-bleed />
    </Page>,

    <Page key={5} n={5} className={s.placesPage}>
      <Clutter src={C_LOVE} className={s.placesClutter} />
      <div className={s.placesLabel} data-field="texts.placesLabel">{t.placesLabel}</div>
      <div className={s.mapLarge} data-bleed />
      {photo(17, s.placesPhotoOne)}
      {photo(18, s.placesPhotoTwo)}
      {photo(19, s.placesPhotoThree)}
      <p className={cap(s.placesNote)} data-field="texts.placesNote">{t.placesNote}</p>
      <div className={s.postmark} data-field="texts.postmark"><span><Lines text={t.postmark} /></span></div>
      <Tape className={s.placesTape} />
    </Page>,

    <Page key={6} n={6} className={s.notesPage}>
      <Clutter src={C_FLOWER} className={s.notesClutter} />
      <div className={s.notesTitle} data-field="texts.notesTitle">{t.notesTitle}</div>
      {photo(20, s.notesPhoto)}
      <div className={s.paperNoteOne}><small data-field="texts.noteOneLabel">{t.noteOneLabel}</small><p data-field="texts.noteOne">{t.noteOne}</p></div>
      <div className={s.paperNoteTwo}><small data-field="texts.noteTwoLabel">{t.noteTwoLabel}</small><p data-field="texts.noteTwo">{t.noteTwo}</p></div>
      <div className={s.paperNoteThree}><p data-field="texts.noteThree">{t.noteThree}</p></div>
      {strip(s.notesFilmStrip, 21, 22, 23)}
      <span className={s.threadHeart} aria-hidden>♡</span>
    </Page>,

    <Page key={7} n={7} className={s.soundtrackLeftPage}>
      <Clutter src={C_RED} className={s.soundtrackPaper} />
      <div className={s.soundtrackVinyl} data-bleed><span /></div>
      <Ransom className={s.soundtrackLeftTitle} field="texts.songsTitle">{t.songsTitle}</Ransom>
      {strip(s.soundtrackFilmStrip, 24, 25, 26, 27)}
      {photo(28, s.soundtrackSnapshot)}
      <Sticker src={CAT_SIT} className={`${s.catSprite} ${s.catSpriteOne}`} />
      <p className={cap(s.soundtrackHandNote)} data-field="texts.soundtrackHandNote">{t.soundtrackHandNote}</p>
      <div className={s.soundtrackTicket} data-field="texts.soundtrackTicket">НЭГ ХҮН<br /><b>{t.soundtrackTicket}</b></div>
    </Page>,

    <Page key={8} n={8} className={s.soundtrackRightPage}>
      <Clutter src={C_FLOWER} className={s.soundtrackFlowers} />
      <div className={s.spotifyCard} data-field="spotify">
        <span className={s.spotifyEyebrow} data-field="texts.soundtrackEyebrow">{t.soundtrackEyebrow}</span>
        {d.spotifyTrackId ? (
          <iframe
            title="Бидний дуу Spotify дээр"
            src={`https://open.spotify.com/embed/track/${encodeURIComponent(d.spotifyTrackId)}`}
            height={152}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          />
        ) : (
          <div className={s.spotifyPlaceholder}>
            <span className={s.spotifyDisc} aria-hidden>♫</span>
            <strong data-field="songName">{d.songName}</strong>
            <small data-field="songNote">{d.songNote}</small>
            <div className={s.fakePlayer}><i /><button type="button" tabIndex={-1} aria-hidden>▶</button><i /></div>
          </div>
        )}
      </div>
      <div className={s.cassette}><span data-field="texts.cassette">{t.cassette}</span><i /><b /></div>
      {photo(29, s.spotifyPhotoOne)}
      {photo(30, s.spotifyPhotoTwo)}
      <Sticker src={CAT_SLEEP} className={`${s.catSprite} ${s.catSpriteTwo}`} />
    </Page>,

    <Page key={9} n={9} className={s.finalDarkPage}>
      <Clutter src={C_LOVE} className={s.finalClutter} />
      {photo(31, s.finalHeroPhoto)}
      {photo(32, s.finalTinyPhoto)}
      <Sticker src={SPRIG} className={s.finalFern} />
      <p className={cap(s.finalList, s.onKraft)} data-field="texts.finalList">{t.finalList}</p>
    </Page>,

    <Page key={10} n={10} className={s.pocketPage}>
      <h2 data-field="texts.pocketTitle">{t.pocketTitle}</h2>
      {strip(s.pocketPhotos, 33, 34, 35)}
      <div className={s.keepsakePocket}><span data-field="keepsakeDate">{d.keepsakeDate}</span><i aria-hidden>✿</i></div>
      <p className={cap(s.tomorrow)} data-field="texts.tomorrow">{t.tomorrow}</p>
    </Page>,

    <Page key={11} n={11} hard className={s.backCover}>
      <div className={s.crumples} data-bleed />
      <Clutter src={C_RED} className={s.backClutter} />
      <Ransom className={s.backTitle} field="texts.backTitle">{t.backTitle}</Ransom>
      {photo(36, s.backPhoto)}
      {photo(37, s.backMiniPhoto)}
      <Sticker src={CAT_SLEEP} className={s.backCat} />
      <Sticker src={TULIPS} className={s.backFlower} />
      <div className={s.backTicket} data-field="texts.backTicket">ХАДГАЛ<br /><b>{t.backTicket}</b></div>
      <p className={s.caption} data-field="texts.backLine">{t.backLine}</p>
    </Page>,
  ];
}
