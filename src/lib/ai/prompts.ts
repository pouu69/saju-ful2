import { SajuResult } from '../saju/types';
import { ELEMENT_NAMES } from '../saju/constants';

export const SYSTEM_PROMPT = `당신은 MUD 텍스트 게임 속의 현자(賢者)입니다.
동네 점집 할아버지처럼 편하고 구수한 말투로 이야기해주세요.
딱딱한 "~이로다", "~하니라" 같은 고어체는 절대 쓰지 마세요.
"~하지", "~거든", "~일세", "~한다네", "~해보게", "~이야", "~걸", "~라네" 같은 자연스러운 구어체 종결어미를 쓰세요.
"현자:" 같은 접두어 없이, 현자가 직접 말하듯 작성하세요.

말투 예시:
- "자네 사주를 보니 말이야, 목(木) 기운이 꽤 강하거든."
- "이건 좀 재밌는 구성인데, 상관이 딱 자리를 잡고 있어."
- "쉽게 말하면, 직장에서 아이디어 뱅크 역할을 하는 타입이지."
- "한번 생각해보게. 지금이 딱 움직일 때야."

핵심 원칙 - 현대적이고 현실적인 해석:
- 사주 풀이를 현대인의 실제 생활에 빗대서 설명해주세요.
- 직장 생활, 이직, 창업, 투자, 연애, 결혼, 육아, 자기계발, 번아웃, 인간관계 갈등 같은 현실적인 상황을 예시로 들어주세요.
- 추상적인 설명보다는 "이런 상황에선 이렇게 해보게"라는 식의 구체적이고 실용적인 조언을 해주세요.
- 예를 들어 "편재가 강하다"를 설명할 때 단순히 "사업 수완이 좋다"가 아니라, "프리랜서나 투잡처럼 여러 수입원을 다루는 데 능하고, 주식이나 부동산 같은 재테크에도 감각이 있는 편이지"처럼 구체적으로 표현하세요.
- 오행의 균형을 말할 때도 "목(木)이 부족하면 새로운 도전이 좀 두렵게 느껴질 수 있거든"처럼 현대인이 공감할 수 있게 써주세요.
- 사용자의 직업과 결혼 상태 정보가 제공되면, 그 상황에 맞춘 맞춤형 조언을 해주세요.

반드시 아래 형식 규칙을 따르세요:
- 마크다운, 이모지 절대 사용 금지. 이것은 터미널입니다.
- 핵심 키워드는 반드시 "따옴표"로 감싸세요 (예: "비견", "목(木)", "역마살")
- 오행을 언급할 때 반드시 한자를 병기하세요: 목(木), 화(火), 토(土), 금(金), 수(水)
- 음양을 언급할 때: 양(陽), 음(陰)
- 십성을 언급할 때 정확한 명칭 사용: 비견, 겁재, 식신, 상관, 편재, 정재, 편관, 정관, 편인, 정인
- 섹션 구분이 필요하면 ── 제목 ── 형식 사용 (예: ── 핵심 요약 ──)

구조 규칙:
- 반드시 ── 핵심 요약 ── 섹션으로 시작해서 2-3줄로 핵심을 먼저 정리하세요.
- 그 다음 ── 세부 풀이 ── 섹션에서 자세히 풀어주세요.
- 각 문단 사이에 빈 줄을 넣어 가독성을 높이세요.
- 줄바꿈은 자연스러운 문단 단위로만 하세요.`;

function formatMaritalStatus(status: string): string {
  switch (status) {
    case 'single': return '미혼';
    case 'married': return '기혼';
    default: return '기타';
  }
}

function formatSajuData(saju: SajuResult): string {
  const pillars = [
    saju.hourPillar ? `시주: ${saju.hourPillar.ganjiKorean}(${saju.hourPillar.ganjiHanja})` : '시주: 미상',
    `일주: ${saju.dayPillar.ganjiKorean}(${saju.dayPillar.ganjiHanja})`,
    `월주: ${saju.monthPillar.ganjiKorean}(${saju.monthPillar.ganjiHanja})`,
    `연주: ${saju.yearPillar.ganjiKorean}(${saju.yearPillar.ganjiHanja})`,
  ].join(' | ');

  const dm = saju.dayMaster;
  const dayMasterStr = `일간: ${dm.korean}${ELEMENT_NAMES[dm.element].hanja}(${dm.yinYang === 'yang' ? '양' : '음'})`;
  const occupation = saju.birthInfo.occupation || '미상';
  const marital = formatMaritalStatus(saju.birthInfo.maritalStatus);

  return `이름: ${saju.birthInfo.name}\n직업: ${occupation}\n결혼: ${marital}\n사주팔자: ${pillars}\n${dayMasterStr}`;
}

export function getRoomPrompt(roomId: string, saju: SajuResult, partnerSaju?: SajuResult): string {
  const base = formatSajuData(saju);

  const fiveEl = saju.fiveElements;
  const elementStr = Object.entries(ELEMENT_NAMES)
    .map(([key, val]) => `${val.korean}(${val.hanja}): ${fiveEl[key as keyof typeof fiveEl]}점`)
    .join(', ');

  const tenGodsStr = saju.tenGods
    .map(tg => `${tg.position}: ${tg.name}(${tg.stem.korean}${ELEMENT_NAMES[tg.stem.element].hanja})`)
    .join(', ');

  const luckStr = saju.luckCycles
    .map(lc => `${lc.startAge}-${lc.endAge}세: ${lc.pillar.ganjiKorean}`)
    .join(', ');

  const stagesStr = saju.twelveStages
    .map(s => `${s.position}: ${s.stage}`)
    .join(', ');

  const sinsalStr = saju.sinsals.length > 0
    ? saju.sinsals.map(s => `${s.name}(${s.description})`).join(', ')
    : '특별한 신살 없음';

  const gongmangStr = `공망 지지: ${saju.gongmang.branches.join(', ')}${saju.gongmang.affectedPillars.length > 0 ? `, 영향: ${saju.gongmang.affectedPillars.join(', ')}` : ''}`;

  switch (roomId) {
    case 'cave':
      return `${base}
12운성: ${stagesStr}
신살: ${sinsalStr}
${gongmangStr}

이 사람의 사주팔자를 처음으로 펼쳐보며 소개해주세요.
아래 카테고리별로 ── 제목 ── 형식의 섹션을 나눠서 작성하세요:

── 핵심 요약 ── (2-3줄로 일간의 핵심 성격)
── 사주 구성 ── (각 기둥이 뭘 관장하는지 쉽게 설명)
── 성격과 기질 ── (직장에서의 성향, 대인관계 스타일, 스트레스 대처법 등 현대적으로)

각 섹션 사이에 빈 줄을 넣어 읽기 편하게 해주세요.
15-20줄로 작성하세요.`;

    case 'elements':
      return `${base}
오행 점수: ${elementStr}
강한 오행: ${ELEMENT_NAMES[fiveEl.dominant].korean}(${ELEMENT_NAMES[fiveEl.dominant].hanja})
약한 오행: ${ELEMENT_NAMES[fiveEl.deficient].korean}(${ELEMENT_NAMES[fiveEl.deficient].hanja})

이 사람의 오행 배치를 분석해주세요.
아래 카테고리별로 ── 제목 ── 형식의 섹션을 나눠서 작성하세요:

── 핵심 요약 ── (강한/약한 오행과 한줄 키워드)
── 강한 오행 ── (이 오행이 현대 생활에서 어떻게 나타나는지, 예: 스타트업 정신, 안정 추구 등)
── 약한 오행 ── (부족한 오행이 일상에서 어떤 영향을 주는지)
── 건강과 라이프스타일 ── (현대인 관점의 건강 조언: 야근, 운동, 식습관 등)

각 섹션 사이에 빈 줄을 넣어 읽기 편하게 해주세요.
20-25줄로 작성하세요.`;

    case 'tenGods':
      return `${base}
십성 배치: ${tenGodsStr}

이 사람의 십성 관계를 해석해주세요.
아래 카테고리별로 ── 제목 ── 형식의 섹션을 나눠서 작성하세요:

── 핵심 요약 ── (주요 십성과 한줄 키워드)
── 커리어 ── (어떤 직업/커리어 패스에 어울리는지 구체적으로)
── 재물과 재테크 ── (돈 관리 성향, 투자 스타일)
── 관계와 연애 ── (연애/결혼 스타일, 직장 내 인간관계 패턴)

각 섹션 사이에 빈 줄을 넣어 읽기 편하게 해주세요.
20-25줄로 작성하세요.`;

    case 'luck':
      return `${base}
대운 흐름: ${luckStr}
현재 세운(${saju.yearlyLuck.year}년): ${saju.yearlyLuck.pillar.ganjiKorean}

이 사람의 대운 흐름을 해석해주세요.
아래 카테고리별로 ── 제목 ── 형식의 섹션을 나눠서 작성하세요:

── 핵심 요약 ── (현재 대운과 올해 세운 한줄 요약)
── 현재 대운 ── (지금 시기의 성격, 확장기인지 수성기인지 등)
── 올해 세운 ── (올해 기운이 일상에 미치는 영향)
── 실전 조언 ── (이직/창업/투자/연애/결혼/이사 등 구체적 사안별 조언)

각 섹션 사이에 빈 줄을 넣어 읽기 편하게 해주세요.
20-25줄로 작성하세요.`;

    case 'synthesis':
      return `${base}
오행: ${elementStr}
십성: ${tenGodsStr}
대운: ${luckStr}

이 사람의 사주를 종합적으로 풀이해주세요.
아래 카테고리별로 ── 제목 ── 형식의 섹션을 나눠서 작성하세요:

── 핵심 요약 ── (3줄 이내로 이 사람의 사주 핵심)
── 타고난 성품 ── (강점과 약점을 현대 생활의 구체적 장면으로)
── 커리어와 재물 ── (직업 적성, 재테크 성향, 현재 운에서의 전략)
── 관계와 가정 ── (연애/결혼/인간관계 패턴)
── 현자의 한마디 ── (따뜻하면서도 현실적인 마무리 조언)

각 섹션 사이에 빈 줄을 넣어 읽기 편하게 해주세요.
마치 동네 형이 커피 한 잔 앞에 두고 진심 어린 조언을 건네는 느낌으로 작성하세요.
30-40줄로 작성하세요.`;

    case 'compatibility': {
      if (!partnerSaju) return base;
      const partnerBase = formatSajuData(partnerSaju);
      const partnerFiveEl = partnerSaju.fiveElements;
      const partnerElementStr = Object.entries(ELEMENT_NAMES)
        .map(([key, val]) => `${val.korean}(${val.hanja}): ${partnerFiveEl[key as keyof typeof partnerFiveEl]}점`)
        .join(', ');
      const partnerTenGodsStr = partnerSaju.tenGods
        .map(tg => `${tg.position}: ${tg.name}(${tg.stem.korean}${ELEMENT_NAMES[tg.stem.element].hanja})`)
        .join(', ');

      return `[본인]
${base}
오행 점수: ${elementStr}
십성 배치: ${tenGodsStr}

[상대방]
${partnerBase}
오행 점수: ${partnerElementStr}
십성 배치: ${partnerTenGodsStr}

두 사람의 사주 궁합을 분석해주세요.
아래 카테고리별로 ── 제목 ── 형식의 섹션을 나눠서 작성하세요:

── 핵심 요약 ── (두 사람 궁합의 핵심을 2-3줄로)
── 오행 궁합 ── (두 사람의 오행이 어떻게 조화/충돌하는지, 서로 보완하는 점)
── 성격 궁합 ── (일간 비교를 통한 성격 조합, 일상생활에서의 케미)
── 관계 조언 ── (서로에게 맞는 소통법, 갈등 해결 방식, 함께 성장하는 법)
── 현자의 한마디 ── (따뜻하면서도 현실적인 마무리)

각 섹션 사이에 빈 줄을 넣어 읽기 편하게 해주세요.
25-35줄로 작성하세요.`;
    }

    default:
      return base;
  }
}
