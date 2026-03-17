import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '사주명리의 미궁 - Labyrinth of Four Pillars',
  description: 'MUD 스타일 사주 풀이 서비스',
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
      <body className="font-['D2Coding',_'D2_Coding_Ligature',_monospace]">
        {children}
      </body>
    </html>
  );
}
