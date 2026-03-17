# 사주명리의 미궁 (Labyrinth of Four Pillars)

MUD 게임 스타일의 한국 전통 사주풀이(명리학) 웹 서비스.

```
╔═══════════════════════════════════════╗
║                                       ║
║    사 주 명 리 의   미 궁             ║
║    Labyrinth of Four Pillars          ║
║                                       ║
╚═══════════════════════════════════════╝
```

## 소개

이름, 생년월일, 태어난 시간을 입력하면 터미널 스타일 UI에서 방을 탐험하며 사주 풀이를 확인할 수 있습니다.
옛날 MUD 게임처럼 텍스트 커맨드로 이동하며, 고대의 현자가 사주를 해석해줍니다.

## 기능

- **사주팔자 계산** - 만세력 기반 연주/월주/일주/시주 계산
- **오행 분석** - 오행(木火土金水) 균형과 강약 분석
- **십성 해석** - 비견, 식신, 편재, 정관 등 10가지 관계 분석
- **대운/세운** - 10년 단위 대운 흐름과 올해 세운 해석
- **종합 풀이** - 모든 분석을 종합한 그랜드 피날레
- **MUD 탐험** - 방 이동, 커맨드 입력, 터미널 UI
- **AI 해석** - OpenAI / Gemini 스트리밍 (키 없으면 템플릿 폴백)

## 실행

```bash
npm install
npm run dev
```

http://localhost:3000 접속

## AI 설정 (선택)

`.env.local` 파일에 API 키를 설정하면 AI 해석을 사용할 수 있습니다.
키가 없으면 자동으로 템플릿 기반 풀이로 동작합니다.

```env
# 우선순위: OPENAI > GEMINI > 템플릿 폴백

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# Google Gemini
GEMINI_API_KEY=AIza...
GEMINI_MODEL=gemini-2.0-flash
```

## 사용법

```
> 홍길동              ← 이름 입력
> 1990-03-15          ← 생년월일
> 14:30               ← 태어난 시간 (모르면 "모름")
> 남                  ← 성별

[사주의 동굴]에서 사주팔자 확인 후:
> 동                  ← 오행의 방
> 서                  ← 십성의 방
> 남                  ← 운세의 방
> 북                  ← 종합 풀이
> 도움                ← 도움말
> 다시                ← 처음부터
```

## 기술 스택

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS** - 터미널 테마, CRT 스캔라인 효과
- **@fullstackfamily/manseryeok** - 만세력 사주 계산
- **OpenAI / Google Gemini** - AI 스트리밍 해석
- **D2Coding** - 한국어 모노스페이스 폰트

## 프로젝트 구조

```
src/
├── app/                    # Next.js 페이지 + API
├── components/terminal/    # 터미널 UI 컴포넌트
├── components/saju/        # 사주 ASCII 표시
├── hooks/                  # useGame, useTerminal, useStreaming
└── lib/
    ├── saju/               # 사주 계산 엔진 (팔자, 오행, 십성, 대운)
    ├── mud/                # MUD 게임 엔진 (방, 커맨드, 엔진)
    └── ai/                 # AI 프롬프트 + 템플릿 폴백
```
