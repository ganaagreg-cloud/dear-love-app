'use client';
import { useState } from 'react';

export default function CopyLink({ url, className = 'btn btn-sm' }: { url: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button className={className} onClick={async () => {
      await navigator.clipboard?.writeText(url);
      setDone(true); setTimeout(() => setDone(false), 1600);
    }}>{done ? 'Хуулсан ✓' : 'Линк хуулах'}</button>
  );
}
