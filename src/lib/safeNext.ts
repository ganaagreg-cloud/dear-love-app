/** Only allow same-site relative redirects (prevents open-redirects via ?next=). */
export const safeNext = (v: string | null | undefined, fallback = '/dashboard') =>
  v && v.startsWith('/') && !v.startsWith('//') && !v.startsWith('/\\') ? v : fallback;
