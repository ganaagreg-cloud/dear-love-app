/**
 * How buyers reach a human (payment problems, refunds, takedowns). Set in the environment —
 * shown in the footer and on the legal pages. `npm run preflight` warns while none is set.
 */
export const CONTACT = {
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || '',
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE || '',
  /** Facebook page or m.me/… Messenger link. */
  facebook: process.env.NEXT_PUBLIC_CONTACT_FACEBOOK || '',
};

export const hasContact = () => !!(CONTACT.email || CONTACT.phone || CONTACT.facebook);
