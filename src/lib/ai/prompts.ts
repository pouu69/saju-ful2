import { SajuResult } from '../saju/types';
import { ELEMENT_NAMES } from '../saju/constants';

export const SYSTEM_PROMPT = `당신은 MUD 텍스트 게임 속의 고대 한국 도사(道士)입니다.
신비롭고 분위기 있는 한국어로 말하되, 지나치게 고어체를 사용하지는 마세요.
줄바꿈은 자연스러운 문단 단위로만 하세요. 한 문장을 일부러 짧게 끊지 마세요.
마크다운, 이모지는 절대 사용하지 마세요. 이것은 터미널입니다.
박스 문자(═─╔╗╚╝│┌┐└┘)는 사용 가능합니다.
명리학적으로 정확한 해석을 기반으로 하되, 이야기하듯 풀어주세요.
각 문단 사이에 빈 줄을 넣어 가독성을 높이세요.
"현자:" 라는 접두어 없이, 도사가 직접 말하는 것처럼 작성하세요.`;

function formatSajuData(saju: SajuResult): string {
  const pillars = [
    saju.hourPillar ? `시주: ${saju.hourPillar.ganjiKorean}(${saju.hourPillar.ganjiHanja})` : '시주: 미상',
    `일주: ${saju.dayPillar.ganjiKorean}(${saju.dayPillar.ganjiHanja})`,
    `월주: ${saju.monthPillar.ganjiKorean}(${saju.monthPillar.ganjiHanja})`,
    `연주: ${saju.yearPillar.ganjiKorean}(${saju.yearPillar.ganjiHanja})`,
  ].join(' | ');

  const dm = saju.dayMaster;
  const dayMasterStr = `일간: ${dm.korean}${ELEMENT_NAMES[dm.element].hanja}(${dm.yinYang === 'yang' ? '양' : '음'})`;

  return `이름: ${saju.birthInfo.name}\n사주팔자: ${pillars}\n${dayMasterStr}`;
}

export function getRoomPrompt(roomId: string, saju: SajuResult): string {
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

  switch (roomId) {
    case 'cave':
      return `${base}

이 사람의 사주팔자를 처음으로 펼쳐보며 드라마틱하게 소개해주세요.
각 기둥(연주/월주/일주/시주)이 무엇을 관장하는지 간단히 설명하고,
일간의 성격과 기질을 중심으로 첫인상을 이야기해주세요.
15-20줄로 작성하세요.`;

    case 'elements':
      return `${base}
오행 점수: ${elementStr}
강한 오행: ${ELEMENT_NAMES[fiveEl.dominant].korean}(${ELEMENT_NAMES[fiveEl.dominant].hanja})
약한 오행: ${ELEMENT_NAMES[fiveEl.deficient].korean}(${ELEMENT_NAMES[fiveEl.deficient].hanja})

이 사람의 오행 배치를 분석해주세요.
어떤 오행이 강하고 약한지, 그것이 성격/건강/인간관계에 어떤 영향을 미치는지,
균형을 맞추기 위한 조언도 포함해주세요.
20-25줄로 작성하세요.`;

    case 'tenGods':
      return `${base}
십성 배치: ${tenGodsStr}

이 사람의 십성 관계를 해석해주세요.
가장 두드러진 십성이 무엇인지, 그것이 직업/재물/인간관계에 어떤 의미인지,
구체적이고 실용적인 해석을 해주세요.
20-25줄로 작성하세요.`;

    case 'luck':
      return `${base}
대운 흐름: ${luckStr}
현재 세운(${saju.yearlyLuck.year}년): ${saju.yearlyLuck.pillar.ganjiKorean}

이 사람의 대운 흐름을 해석해주세요.
현재 어떤 대운 시기에 있는지, 지나온 대운과 앞으로의 대운 변화,
특히 올해 세운과의 관계를 중심으로 조언해주세요.
20-25줄로 작성하세요.`;

    case 'synthesis':
      return `${base}
오행: ${elementStr}
십성: ${tenGodsStr}
대운: ${luckStr}

이 사람의 사주를 종합적으로 풀이해주세요.
전체 운명의 테마, 타고난 강점과 약점, 인생에서 주의할 점,
그리고 앞으로의 방향에 대한 조언을 담아주세요.
이것은 모든 분석의 그랜드 피날레입니다. 깊이 있고 인상적으로 작성해주세요.
30-40줄로 작성하세요.`;

    default:
      return base;
  }
}
