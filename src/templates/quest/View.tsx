'use client';
import { useMemo } from 'react';
import '@fontsource/press-start-2p/400.css';
import './quest.css';
import Quest, { type Look, type QuestData } from './Quest';
import type { Content } from '../types';

const str = (v: unknown, d = '') => (typeof v === 'string' && v ? v : d);
const arr = (v: unknown) => (Array.isArray(v) ? (v as string[]) : []);
const look = (v: unknown, d: Look): Look => (v === 'girl' || v === 'boy' ? v : d);

export function toQuest(c: Content): QuestData {
  const photos = arr(c.memoryPhotos), titles = arr(c.memoryTitles), texts = arr(c.memoryTexts);
  return {
    title: str(c.title, 'ХАЙРЫН АЯЛАЛ'), subtitle: str(c.subtitle, 'Зүрх рүү чинь хүрэх зам'),
    playerName: str(c.playerName, 'Чи'), playerLook: look(c.playerLook, 'girl'), playerColor: str(c.playerColor, '#ff5d8f'),
    npcName: str(c.npcName, 'Би'), npcLook: look(c.npcLook, 'boy'), npcColor: str(c.npcColor, '#5b8cff'),
    consoleColor: str(c.consoleColor, '#ff8fb8'), startDate: str(c.startDate),
    intro: str(c.intro, 'Сайн уу, {player}!'),
    memories: Array.from({ length: 5 }, (_, i) => ({ src: photos[i] || '', title: titles[i] || `Дурсамж ${i + 1}`, text: texts[i] || '♥' })),
    npcGreeting: str(c.npcGreeting), question: str(c.question, 'Минийх болох уу?'),
    yesA: str(c.yesA, 'ТИЙМ'), yesB: str(c.yesB, 'ТИЙМ!!'),
    ending: str(c.ending), music: str(c.music),
  };
}

export default function QuestView({ content }: { content: Content; pin?: string | number | null }) {
  const data = useMemo(() => toQuest(content), [content]);
  // remount the game when the content changes (editor live preview)
  const key = useMemo(() => JSON.stringify(data).length + ':' + data.title + data.playerName + data.consoleColor, [data]);
  return <Quest key={key} data={data} />;
}
