'use client';
import { useMemo } from 'react';
import '@fontsource/oswald/cyrillic-500.css';
import '@fontsource/oswald/cyrillic-700.css';
import '@fontsource/oswald/latin-500.css';
import '@fontsource/oswald/latin-700.css';
import '@fontsource/inter/cyrillic-400.css';
import '@fontsource/inter/cyrillic-600.css';
import '@fontsource/inter/cyrillic-700.css';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import './loveflix.css';
import LoveFlix from './LoveFlix';
import { BRANCH_EP, parsePin, toLoveData } from './data';
import type { Content } from '../types';

export default function NetflixView({ content, pin, editable = false }: { content: Content; pin?: string | number | null; editable?: boolean }) {
  const view = useMemo(() => parsePin(pin), [pin]);
  // the episode the editor is showing stays in the list even while it's still empty
  const pinEp = view?.name === 'ep' ? view.n : view?.name === 'branch' ? BRANCH_EP : null;
  const data = useMemo(() => toLoveData(content, editable, pinEp), [content, editable, pinEp]);
  return <LoveFlix data={data} pin={view} />;
}
