import type { ReactNode } from 'react';

/** A horizontally scrolling, snapping Netflix row with a bold 18px title. */
export default function Row({ title, children, className = '' }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`lf-row ${className}`}>
      <h2 className="lf-row-title">{title}</h2>
      <div className="lf-row-track">{children}</div>
    </section>
  );
}
