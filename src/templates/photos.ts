/**
 * Free photos from Unsplash (unsplash.com/license — free for commercial use, no attribution required,
 * credit appreciated). Loaded from Unsplash's CDN, which is how Unsplash asks apps to use them.
 * Used only for demo previews; buyers upload their own photos.
 */
const u = (id: string, w = 1100) => `https://images.unsplash.com/photo-${id}?w=${w}&q=78&auto=format&fit=crop`;

export const PHOTOS = {
  // Mongolia
  mnGer1: u('1575415868394-e3b78f3e9b3f'),      // Vince Gx — gers on the steppe
  mnGer2: u('1591804860948-cdb450a32b77'),      // Dembee Tsogoo — ger by the water
  mnYurtsSnow: u('1742205024727-245bb73b38e5'), // Fadhil Abhimantra — gers before snowy mountains
  mnHills: u('1751255593200-87d5abfe1bc8'),     // Jimmy Liu — green hills, blue sky
  ubNight: u('1646700513730-235e99c61bf6'),     // duku. Fill — Ulaanbaatar at night
  ubCity: u('1684814833784-c9c8cdba1d20'),      // naraa .in.ub — Ulaanbaatar
  // Couples
  couple1: u('1540076156429-35ffe82b7870'),     // Allef Vinicius
  couple2: u('1541089404510-5c9a779841fc'),
  couple3: u('1615966650071-855b15f29ad1'),     // Vows on the Move
  couple4: u('1501901609772-df0848060b33'),
  couple5: u('1513279922550-250c2129b13a'),
  couple6: u('1496602910407-bacda74a0fe4'),
  couple7: u('1525206809752-65312b959c88'),
  couple8: u('1591969851586-adbbd4accf81'),     // Jonathan Borba
  couple9: u('1426543881949-cbd9a76740a4'),
  couple10: u('1521033719794-41049d18b8d4'),
};

export const COUPLES = [PHOTOS.couple1, PHOTOS.couple2, PHOTOS.couple3, PHOTOS.couple4, PHOTOS.couple5, PHOTOS.couple6, PHOTOS.couple7, PHOTOS.couple8, PHOTOS.couple9, PHOTOS.couple10];
