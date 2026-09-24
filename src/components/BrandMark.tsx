import { useId } from 'react';

const HEART = 'M50 86 C22 68 8 52 8 36 C8 22 18 12 31 12 C40 12 46.5 17 50 24 C53.5 17 60 12 69 12 C82 12 92 22 92 36 C92 52 78 68 50 86 Z';

/** Dear Love лого: захидлын хавтастай зүрх. */
export default function BrandMark() {
  const id = useId().replace(/:/g, '');
  return (
    <span className="brand-mark">
      <svg viewBox="0 0 100 100" width="18" height="18" aria-hidden="true">
        <clipPath id={id}><path d={HEART} /></clipPath>
        <path fill="#fff" d={HEART} />
        <path d="M2 26 L50 58 L98 26" clipPath={`url(#${id})`} fill="none" stroke="#e2557a" strokeWidth="7" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
