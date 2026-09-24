import type { Metadata, Viewport } from 'next';
import '@fontsource/manrope/400.css';
import '@fontsource/manrope/500.css';
import '@fontsource/manrope/600.css';
import '@fontsource/manrope/700.css';
import '@fontsource/manrope/800.css';
import '@fontsource/lora/500.css';
import '@fontsource/lora/600.css';
import '@fontsource/lora/500-italic.css';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Dear Love — хайртай хүндээ зориулсан дижитал бэлэг', template: '%s · Dear Love' },
  description: 'Кино шиг загвар сонгоод зураг, дуу, үгээ оруулж, QPay-ээр төлөөд хайртай хүндээ ганц линкээр илгээгээрэй.',
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#fbf6f8' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mn">
      <body>{children}</body>
    </html>
  );
}
