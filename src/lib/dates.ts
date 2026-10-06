/** ISO (YYYY-MM-DD) helpers for the editor's date fields. Pure — safe on the client and the server. */

const pad = (n: number) => String(n).padStart(2, '0');

/** The buyer's today, in their own time zone. */
export const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/**
 * The latest date the server accepts for a «not in the future» field: tomorrow in Ulaanbaatar (UTC+8).
 * The extra day keeps someone a few time zones east of us from being rejected for writing their own today.
 */
export const serverMaxIso = () => {
  const d = new Date(Date.now() + (8 + 24) * 3600e3);
  return d.toISOString().slice(0, 10);
};

/** Whole days from `iso` to today, counting the first day as day 1 (what the gifts show). 0 for an empty/invalid date. */
export const daysTogether = (iso: string) => {
  const t = Date.parse(`${iso}T00:00:00`);
  if (!iso || Number.isNaN(t)) return 0;
  return Math.max(1, Math.floor((Date.now() - t) / 864e5) + 1);
};
