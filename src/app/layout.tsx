import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '사주명리의 미궁 - Labyrinth of Four Pillars',
  description: 'MUD 게임 스타일 한국 전통 사주풀이 서비스',
  openGraph: {
    title: '사주명리의 미궁',
    description: 'MUD 게임 스타일 한국 전통 사주풀이 서비스',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/wan2land/d2coding/d2coding-ligature-full.css"
        />
      </head>
      <body className="font-['D2Coding',_'D2_Coding_Ligature',_'Menlo',_'Consolas',_monospace] antialiased">
        {children}
      </body>
    </html>
  );
}
