import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '사주명리의 미궁 - Labyrinth of Four Pillars',
    short_name: '사주미궁',
    description: 'AI 기반 사주명리 풀이 서비스. 나만의 사주 카드를 만들고 공유하세요.',
    start_url: '/',
    display: 'standalone',
    background_color: '#080600',
    theme_color: '#D4A020',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
