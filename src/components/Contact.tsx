import { CONTACT, hasContact } from '@/lib/contact';

/** Contact channels from the environment (src/lib/contact.ts). Renders nothing while none is set. */
export default function Contact({ inline = false }: { inline?: boolean }) {
  if (!hasContact()) return null;
  const items = [
    CONTACT.facebook && <a key="fb" href={CONTACT.facebook} target="_blank" rel="noopener noreferrer">Facebook / Messenger</a>,
    CONTACT.email && <a key="em" href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>,
    CONTACT.phone && <a key="ph" href={`tel:${CONTACT.phone.replace(/\s+/g, '')}`}>{CONTACT.phone}</a>,
  ].filter(Boolean);
  if (inline) return <>{items.map((x, i) => <span key={i}>{i > 0 && ' · '}{x}</span>)}</>;
  return <ul>{items.map((x, i) => <li key={i}>{x}</li>)}</ul>;
}
