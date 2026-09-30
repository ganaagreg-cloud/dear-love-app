import s from './Scrapbook.module.css';
import { Page, Photo, Tape, Ransom, Clutter, Sticker, Lines } from './parts';
import type { ScrapbookData } from './scrapbookData';

const U = (id: string) => `https://images.unsplash.com/photo-${id}?w=1000&q=60&auto=format&fit=crop`;
// Stickers: Twemoji (CC-BY 4.0, github.com/jdecked/twemoji)
const FLOWER = '/tpl/book/stickers/1f490.svg';   // bouquet
const ROSE = '/tpl/book/stickers/1f940.svg';     // pressed rose
const CAT_GLASSES = '/tpl/book/stickers/1f63b.svg';
const CAT_HUG = '/tpl/book/stickers/1f408.svg';
// Clutter overlays: free Unsplash textures
const C_FLOWER = U('1701637342019-55feedd6df58'); // dried flowers
const C_LOVE = U('1617901817432-9c76649beaf6');   // love letter
const C_RED = U('1600294421265-c354b772e790');    // red gingham

/** Returns the 12 page elements as direct siblings (required by react-pageflip + nth-child gutter shadow). */
export function renderPages(d: ScrapbookData, onPick?: (slot: number) => void) {
  const t = d.texts;
  const p = (slot: number) => (d.photos.length ? d.photos[slot % d.photos.length] : '');
  // Same 10 photos are deliberately reused across many placements (a real scrapbook
  // repeats its favorite handful of photos) — `slot` is the literal, non-cycling
  // identity a click assigns to, so replacing it here updates every place it repeats.
  const photo = (slot: number, className?: string) => (
    <Photo src={p(slot)} className={className} onClick={onPick ? () => onPick(slot) : undefined} />
  );

  return [
    <Page key={0} n={0} hard className={s.frontCover}>
      <div className={s.crumples} />
      <span className={s.coverStar} aria-hidden>✦</span>
      <span className={s.coverStarTwo} aria-hidden>✧</span>
      <div className={s.coverNote}>
        <span>{t.coverEyebrow}</span>
        <strong>{d.partnerName || 'хайрт минь'}</strong>
        <small>{t.coverSub}</small>
      </div>
      {photo(0, s.coverFlowerPhoto)}
      {photo(1, s.coverSmallPhoto)}
      {photo(2, s.coverFilmPhoto)}
      <Sticker src={FLOWER} className={s.coverFlower} />
      <Tape className={s.coverTape} />
    </Page>,

    <Page key={1} n={1} className={s.recordPage}>
      <Clutter src={C_FLOWER} className={s.recordClutter} />
      <div className={s.vinyl}><span /><i>{t.recordLabel}</i></div>
      {photo(3, s.recordPhotoOne)}
      {photo(4, s.recordPhotoTwo)}
      <Tape className={s.recordTape} />
      <p className={s.recordWords}>{t.recordWords}</p>
      <Sticker src={FLOWER} className={s.whiteFlowers} />
      <div className={s.recordMiniStrip}>
        {photo(5)}{photo(6)}{photo(7)}
      </div>
    </Page>,

    <Page key={2} n={2} className={s.luckyPage}>
      <Clutter src={C_LOVE} className={s.luckyClutter} />
      <div className={s.luckyPaper}><Lines text={t.lucky} /></div>
      {photo(8, s.luckyMainPhoto)}
      {photo(9, s.luckyTopPhoto)}
      {photo(0, s.cameraPhoto)}
      <div className={s.cameraFrame}><span /><i /></div>
      <p className={s.luckyNote}>{t.luckyNote}</p>
      <span className={s.metalStar} aria-hidden>★</span>
    </Page>,

    <Page key={3} n={3} className={s.letterPage}>
      <Clutter src={C_FLOWER} className={s.letterClutter} />
      <div className={s.tornLayer} />
      <div className={s.envelope} />
      <div className={s.letterCard}>
        <span>{t.letterEyebrow}</span>
        <strong>{t.letterTitle}</strong>
        <p>{t.letterBody}</p>
      </div>
      {photo(1, s.letterPhoto)}
      {photo(2, s.letterTinyPhoto)}
      <div className={s.ticket}>НЭГ ХҮН<br /><b>{t.ticket}</b></div>
      <Sticker src={ROSE} className={s.letterFlower} />
      <Tape className={s.letterTape} />
    </Page>,

    <Page key={4} n={4} className={s.littleThingsPage}>
      <Clutter src={C_RED} className={s.littleClutter} />
      <h2>{t.littleTitle}</h2>
      {photo(3, s.littleMainPhoto)}
      <div className={s.contactStrip}>
        {photo(4)}{photo(5)}{photo(6)}
      </div>
      <p className={s.littleNote}>{t.littleNote}</p>
      <Sticker src={FLOWER} className={s.littleFlower} />
      <div className={s.mapScrap} />
    </Page>,

    <Page key={5} n={5} className={s.placesPage}>
      <Clutter src={C_LOVE} className={s.placesClutter} />
      <div className={s.placesLabel}>{t.placesLabel}</div>
      <div className={s.mapLarge} />
      {photo(7, s.placesPhotoOne)}
      {photo(8, s.placesPhotoTwo)}
      {photo(9, s.placesPhotoThree)}
      <p className={s.placesNote}>{t.placesNote}</p>
      <div className={s.postmark}><span><Lines text={t.postmark} /></span></div>
      <Tape className={s.placesTape} />
    </Page>,

    <Page key={6} n={6} className={s.notesPage}>
      <Clutter src={C_FLOWER} className={s.notesClutter} />
      <div className={s.notesTitle}>{t.notesTitle}</div>
      {photo(0, s.notesPhoto)}
      <div className={s.paperNoteOne}><small>{t.noteOneLabel}</small><p>{t.noteOne}</p></div>
      <div className={s.paperNoteTwo}><small>{t.noteTwoLabel}</small><p>{t.noteTwo}</p></div>
      <div className={s.paperNoteThree}><p>{t.noteThree}</p></div>
      <div className={s.notesFilmStrip}>
        {photo(1)}{photo(2)}{photo(3)}
      </div>
      <span className={s.threadHeart} aria-hidden>♡</span>
    </Page>,

    <Page key={7} n={7} className={s.soundtrackLeftPage}>
      <Clutter src={C_RED} className={s.soundtrackPaper} />
      <div className={s.soundtrackVinyl}><span /></div>
      <Ransom className={s.soundtrackLeftTitle}>{t.songsTitle}</Ransom>
      <div className={s.soundtrackFilmStrip}>
        {photo(4)}{photo(5)}{photo(6)}{photo(7)}
      </div>
      {photo(8, s.soundtrackSnapshot)}
      <Sticker src={CAT_GLASSES} className={`${s.catSprite} ${s.catSpriteOne}`} />
      <p className={s.soundtrackHandNote}>{t.soundtrackHandNote}</p>
      <div className={s.soundtrackTicket}>НЭГ ХҮН<br /><b>{t.soundtrackTicket}</b></div>
    </Page>,

    <Page key={8} n={8} className={s.soundtrackRightPage}>
      <Clutter src={C_FLOWER} className={s.soundtrackFlowers} />
      <Ransom className={s.soundtrackTitle}>{t.songsTitle}</Ransom>
      <div className={s.spotifyCard}>
        <span className={s.spotifyEyebrow}>{t.soundtrackEyebrow}</span>
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
            <strong>{d.songName}</strong>
            <small>{d.songNote}</small>
            <div className={s.fakePlayer}><i /><button type="button" tabIndex={-1} aria-hidden>▶</button><i /></div>
          </div>
        )}
      </div>
      <div className={s.cassette}><span>{t.cassette}</span><i /><b /></div>
      {photo(9, s.spotifyPhotoOne)}
      {photo(0, s.spotifyPhotoTwo)}
      <Sticker src={CAT_HUG} className={`${s.catSprite} ${s.catSpriteTwo}`} />
      <div className={s.headphoneWire} />
    </Page>,

    <Page key={9} n={9} className={s.finalDarkPage}>
      <Clutter src={C_LOVE} className={s.finalClutter} />
      {photo(1, s.finalHeroPhoto)}
      {photo(2, s.finalTinyPhoto)}
      <Sticker src={FLOWER} className={s.finalFern} />
      <p className={s.finalList}>{t.finalList}</p>
    </Page>,

    <Page key={10} n={10} className={s.pocketPage}>
      <h2>{t.pocketTitle}</h2>
      <div className={s.pocketPhotos}>
        {photo(3)}{photo(4)}{photo(5)}
      </div>
      <div className={s.keepsakePocket}><span>{d.keepsakeDate}</span><i aria-hidden>✿</i></div>
      <p className={s.tomorrow}>{t.tomorrow}</p>
      <div className={s.looseThread} />
    </Page>,

    <Page key={11} n={11} hard className={s.backCover}>
      <div className={s.crumples} />
      <Clutter src={C_RED} className={s.backClutter} />
      <Ransom className={s.backTitle}>{t.backTitle}</Ransom>
      {photo(6, s.backPhoto)}
      {photo(7, s.backMiniPhoto)}
      <Sticker src={CAT_HUG} className={s.backCat} />
      <Sticker src={FLOWER} className={s.backFlower} />
      <div className={s.backTicket}>ХАДГАЛ<br /><b>{t.backTicket}</b></div>
      <p>{t.backLine}</p>
    </Page>,
  ];
}
