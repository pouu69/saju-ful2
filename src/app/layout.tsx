import type { Metadata } from 'next';
import './globals.css';

const SITE_URL = 'https://main.d2myeapn5r14dx.amplifyapp.com';
const SITE_NAME = '사주명리의 미궁';
const TITLE = '사주명리의 미궁 - AI 사주풀이 | 무료 사주팔자 운세 보기';
const DESCRIPTION =
  '무료 AI 사주풀이 서비스. 생년월일시로 사주팔자, 오행 분석, 십신 해석, 대운 세운, 신살, 궁합까지. 한국 전통 사주명리학 기반 MUD 게임 스타일 터미널에서 나만의 운명을 탐험하세요.';
const KEYWORDS = [
  '사주',
  '사주팔자',
  '사주풀이',
  '무료사주',
  '무료 사주풀이',
  'AI 사주',
  'AI 사주풀이',
  '사주명리',
  '사주명리학',
  '운세',
  '무료운세',
  '오늘의 운세',
  '2026 운세',
  '신년운세',
  '토정비결',
  '생년월일 운세',
  '오행',
  '오행 분석',
  '십신',
  '십이운성',
  '대운',
  '세운',
  '신살',
  '궁합',
  '궁합보기',
  '무료궁합',
  '천간',
  '지지',
  '년주',
  '월주',
  '일주',
  '시주',
  '사주 보는 법',
  '내 사주 보기',
  '사주 무료 감정',
  '사주 운명',
  '사주 상담',
  '사주 해석',
  '사주 분석',
  '만세력',
  '음양오행',
  '격국',
  '용신',
  '팔자',
  '운명',
  '점술',
  '역학',
  '명리학',
  '동양철학',
  'fortune telling',
  'Korean fortune',
  'saju',
  'four pillars',
  'four pillars of destiny',
  'BaZi',
];

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  keywords: KEYWORDS,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  applicationName: SITE_NAME,
  category: 'entertainment',
  classification: 'Fortune Telling, Astrology, Korean Culture',

  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    locale: 'ko_KR',
    alternateLocale: ['en_US'],
  },

  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  alternates: {
    canonical: SITE_URL,
  },

  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
  },

  other: {
    'naver-site-verification': process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION || '',
  },
};

function JsonLd() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: SITE_NAME,
        url: SITE_URL,
        description: DESCRIPTION,
        applicationCategory: 'EntertainmentApplication',
        operatingSystem: 'Web Browser',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'KRW',
        },
        inLanguage: 'ko',
        keywords: KEYWORDS.slice(0, 20).join(', '),
      },
      {
        '@type': 'WebSite',
        name: SITE_NAME,
        url: SITE_URL,
        description: DESCRIPTION,
        inLanguage: 'ko',
        potentialAction: {
          '@type': 'SearchAction',
          target: `${SITE_URL}/?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/icon`,
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: '사주팔자란 무엇인가요?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: '사주팔자(四柱八字)는 태어난 연, 월, 일, 시를 천간과 지지로 표현한 8글자로, 동양 전통 명리학에서 개인의 운명과 성격을 분석하는 기초 자료입니다.',
            },
          },
          {
            '@type': 'Question',
            name: 'AI 사주풀이는 어떻게 작동하나요?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: '생년월일시 정보를 기반으로 만세력을 통해 사주팔자를 계산하고, AI가 오행 균형, 십신 관계, 대운과 세운 등을 종합적으로 분석하여 해석을 제공합니다.',
            },
          },
          {
            '@type': 'Question',
            name: '무료로 사주를 볼 수 있나요?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: '네, 사주명리의 미궁은 완전 무료 서비스입니다. 생년월일시만 입력하면 AI 기반 사주팔자 분석, 오행 분석, 궁합까지 무료로 이용할 수 있습니다.',
            },
          },
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/wan2land/d2coding/d2coding-ligature-full.css"
        />
        <JsonLd />
      </head>
      <body className="font-['D2Coding',_'D2_Coding_Ligature',_'Menlo',_'Consolas',_monospace] antialiased">
        {children}
      </body>
    </html>
  );
}
