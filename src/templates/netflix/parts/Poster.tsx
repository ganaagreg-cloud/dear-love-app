'use client';
import type { CSSProperties } from 'react';

/** A 2:3 poster card: the buyer's photo, a big number or title on it. Photo-less cards fall back to a dark gradient. */
export default function Poster({ photo, title, tag, field, photoField, titleField, onClick, style, className = '' }: {
  photo: string; title: string; tag?: string; field?: string; photoField?: string; titleField?: string;
  onClick?: () => void; style?: CSSProperties; className?: string;
}) {
  return (
    <button type="button" className={`lf-poster ${className}`} onClick={onClick} style={style} data-field={field}>
      {photo ? <img src={photo} alt="" loading="lazy" data-field={photoField} /> : <span className="lf-poster-bg" />}
      <span className="lf-poster-shade" />
      {tag && <span className="lf-poster-tag">{tag}</span>}
      {title && <span className="lf-poster-title" data-field={titleField}>{title}</span>}
    </button>
  );
}
