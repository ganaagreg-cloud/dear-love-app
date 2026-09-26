'use client';
import { useMemo } from 'react';
import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';
import '@fontsource/inter/900.css';
import '@fontsource/jetbrains-mono/700.css';
import '@fontsource/jetbrains-mono/800.css';
import './flight.css';
import Flight, { type FlightData } from './Flight';
import type { Content } from '../types';

const s = (v: unknown, d = '') => (typeof v === 'string' && v.trim() ? v : d);
const a = (v: unknown) => (Array.isArray(v) ? (v as string[]) : []);

export function toFlight(c: Content): FlightData {
  const names = a(c.stopNames), codes = a(c.stopCodes), dates = a(c.stopDates), notes = a(c.stopNotes), photos = a(c.stopPhotos);
  return {
    airline: s(c.airline, 'Love Air'), flightNo: s(c.flightNo, 'LV 214'),
    passenger: s(c.passenger, 'Зорчигч'), captain: s(c.captain, 'Би'),
    fromCode: s(c.fromCode, 'ULN').toUpperCase(), fromCity: s(c.fromCity, 'Улаанбаатар'),
    toCode: s(c.toCode, 'ҮҮРД').toUpperCase(), toCity: s(c.toCity, 'Үүрд'),
    date: s(c.date), boarding: s(c.boarding, '20:14'), gate: s(c.gate, '14'), seat: s(c.seat, 'Миний хажууд'), cabin: s(c.cabin, 'Нэгдүгээр зэрэг'),
    color: s(c.color, '#1f4fd1'),
    stops: Array.from({ length: 6 }, (_, i) => ({ name: names[i] || '', code: codes[i] || '', date: dates[i] || '', note: notes[i] || '', photo: photos[i] || '' })),
    finalTitle: s(c.finalTitle, 'Үүрдэд тавтай морил'), finalMessage: s(c.finalMessage), music: s(c.music),
  };
}

export default function FlightView({ content, pin }: { content: Content; pin?: string | number | null }) {
  const data = useMemo(() => toFlight(content), [content]);
  return <Flight key={JSON.stringify(data).length} data={data} pin={pin} />;
}
