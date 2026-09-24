import type { Copy } from '../copy';
import type { LoveData } from '../data';
export type ScreenProps = { data: LoveData; copy: Copy };
export const initial = (name: string) => (name?.trim()?.[0] ?? '♥').toUpperCase();
