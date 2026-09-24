/** Everything editable lives here — swap names, photos, texts, song, colour. */
export interface ScrapbookData {
  partnerName: string;
  heartColor: string;
  /** Up to 10 photo URLs. Slots cycle through them; empty strings show a soft grey tile. */
  photos: string[];
  spotifyTrackId: string;
  songName: string;
  songNote: string;
  keepsakeDate: string;
  texts: {
    coverEyebrow: string; coverSub: string;
    recordLabel: string; recordWords: string;
    lucky: string; luckyNote: string;
    letterEyebrow: string; letterTitle: string; letterBody: string; ticket: string;
    littleTitle: string; littleNote: string;
    placesLabel: string; placesNote: string; postmark: string;
    notesTitle: string; noteOneLabel: string; noteOne: string; noteTwoLabel: string; noteTwo: string; noteThree: string;
    songsTitle: string; soundtrackHandNote: string; soundtrackTicket: string;
    soundtrackEyebrow: string; cassette: string;
    finalList: string;
    pocketTitle: string; tomorrow: string;
    backTitle: string; backTicket: string; backLine: string;
  };
}

export const HEART_PRESETS = ['#FFF7E8', '#F1A7B7', '#E94F64', '#F6C86B', '#B9E3C6'] as const;

/** Free Unsplash photos (unsplash.com/license) — replace with your own. */
const u = (id: string, w = 900) => `https://images.unsplash.com/photo-${id}?w=${w}&q=75&auto=format&fit=crop`;

export const scrapbookData: ScrapbookData = {
  partnerName: '',
  heartColor: '#fff7e9',
  photos: [
    u('1540076156429-35ffe82b7870'),
    u('1541089404510-5c9a779841fc'),
    u('1615966650071-855b15f29ad1'),
    u('1501901609772-df0848060b33'),
    u('1513279922550-250c2129b13a'),
    u('1496602910407-bacda74a0fe4'),
    u('1525206809752-65312b959c88'),
    u('1591969851586-adbbd4accf81'),
    u('1426543881949-cbd9a76740a4'),
    u('1521033719794-41049d18b8d4'),
  ],
  spotifyTrackId: '',
  songName: 'the song that feels like us',
  songNote: 'choose a Spotify song in the editor',
  keepsakeDate: '15 · 11 · 21',
  texts: {
    coverEyebrow: 'a love letter',
    coverSub: 'my favorite pages are us',
    recordLabel: 'our song',
    recordWords: 'the one we always play twice',
    lucky: 'LUCKY\nLUCKY',
    luckyNote: 'somewhere in all the ordinary days, you became home.',
    letterEyebrow: 'somewhere between',
    letterTitle: 'then & now',
    letterBody: 'one ordinary moment quietly changed everything.',
    ticket: 'LOVE',
    littleTitle: 'the little things',
    littleNote: 'morning coffees, inside jokes, long walks, and how you always make me laugh.',
    placesLabel: 'places we became us',
    placesNote: 'the place mattered less than who was beside me.',
    postmark: 'WITH YOU\nANYWHERE',
    notesTitle: 'things worth keeping',
    noteOneLabel: 'our comfort watch', noteOne: 'the one we quote badly',
    noteTwoLabel: 'our private joke', noteTwo: 'still impossible to explain',
    noteThree: 'you make the everyday worth remembering.',
    songsTitle: 'our songs',
    soundtrackHandNote: 'play this when you miss me',
    soundtrackTicket: 'US',
    soundtrackEyebrow: 'our soundtrack',
    cassette: 'songs for late nights',
    finalList: 'morning coffees\nwalks with no plans\ninside jokes\nlate night talks\nthe way you laugh',
    pocketTitle: 'still collecting moments',
    tomorrow: 'leave a little room for tomorrow',
    backTitle: 'still collecting',
    backTicket: 'FOREVER',
    backLine: 'made by hand, kept by heart.',
  },
};
