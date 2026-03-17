import { SajuResult, FiveElement } from '../saju/types';
import { ELEMENT_NAMES } from '../saju/constants';

/** 오행별 성격 키워드 + 설명 */
const ELEMENT_PERSONALITY: Record<FiveElement, { keyword: string; desc: string }> = {
  wood: {
    keyword: '성장과 인자함',
    desc: '나무처럼 성장을 추구하는 기운이로다. 인자하고 곧은 성품을 지녔으며, 새로운 것을 시작하는 데 두려움이 없도다. 다만 지나치면 고집이 세어질 수 있으니 유연함을 잃지 않는 것이 중요하니라.',
  },
  fire: {
    keyword: '열정과 직감',
    desc: '불꽃처럼 열정적인 기운이로다. 밝고 따뜻한 성품으로 사람을 끌어당기며, 예리한 직감과 표현력을 지녔도다. 다만 지나치면 성급해질 수 있으니 차분함을 기르는 것이 중요하니라.',
  },
  earth: {
    keyword: '신뢰와 성실',
    desc: '대지처럼 묵직한 기운이로다. 신뢰할 수 있는 성품으로 주변을 안정시키며, 성실하고 꾸준한 노력을 아끼지 않는도다. 다만 지나치면 완고해질 수 있으니 변화를 두려워하지 않는 것이 중요하니라.',
  },
  metal: {
    keyword: '결단과 정의',
    desc: '쇠처럼 단단한 기운이로다. 결단력 있고 정의로운 성품을 지녔으며, 한번 정한 것은 끝까지 밀고 나가는도다. 다만 지나치면 냉정해질 수 있으니 부드러움을 잃지 않는 것이 중요하니라.',
  },
  water: {
    keyword: '지혜와 유연',
    desc: '물처럼 유연한 기운이로다. 지혜롭고 깊은 사고력을 지녔으며, 어떤 상황에도 적응하는 능력이 뛰어나도다. 다만 지나치면 우유부단해질 수 있으니 결단의 순간을 놓치지 않는 것이 중요하니라.',
  },
};

/** 오행별 건강/조언 */
const ELEMENT_HEALTH: Record<FiveElement, string> = {
  wood: '간과 눈의 건강에 유의하시오. 푸른 채소와 산책이 기운을 보하리라.',
  fire: '심장과 혈액순환에 유의하시오. 충분한 수면과 명상이 도움이 되리라.',
  earth: '위장과 소화기에 유의하시오. 규칙적인 식사와 가벼운 운동이 좋으리라.',
  metal: '폐와 호흡기에 유의하시오. 맑은 공기와 깊은 호흡이 기운을 살리리라.',
  water: '신장과 방광에 유의하시오. 따뜻한 음식과 충분한 수분 섭취가 좋으리라.',
};

/** 십성별 키워드 + 해석 */
const TEN_GOD_MEANINGS: Record<string, { keyword: string; desc: string }> = {
  '비견': { keyword: '독립·경쟁', desc: '나와 같은 기운이라, 독립심과 자존심이 강하도다. 경쟁심이 있으나, 동료와의 협력도 뛰어나니라.' },
  '겁재': { keyword: '추진·승부', desc: '강한 추진력과 승부욕을 지녔도다. 재물에 대한 욕심이 있으나, 과감한 결단력이 장점이니라.' },
  '식신': { keyword: '풍요·예술', desc: '풍요와 여유의 기운이라, 먹는 것과 즐기는 것을 좋아하도다. 예술적 감각이 뛰어나고 표현력이 풍부하니라.' },
  '상관': { keyword: '창의·혁신', desc: '날카로운 지성과 창의력을 지녔도다. 기존의 틀을 깨는 혁신의 기운이 있으니라.' },
  '편재': { keyword: '사교·사업', desc: '활동적이고 사교적인 재물의 기운이로다. 사업 수완이 좋고 돈의 흐름을 잘 읽는도다.' },
  '정재': { keyword: '안정·성실', desc: '안정적이고 꾸준한 재물의 기운이로다. 성실한 노력으로 부를 쌓아가는 성향이니라.' },
  '편관': { keyword: '권위·리더', desc: '권위와 통솔의 기운이 있도다. 리더십이 뛰어나나, 때로는 압박감을 느낄 수 있으니라.' },
  '정관': { keyword: '명예·책임', desc: '명예와 책임의 기운이로다. 규율을 중시하고 사회적 지위를 얻기 쉬운도다.' },
  '편인': { keyword: '비범·학문', desc: '독특한 사고와 학문의 기운이로다. 비범한 재능이 있으나 실용성과 균형을 맞추는 것이 좋으니라.' },
  '정인': { keyword: '지혜·학업', desc: '학문과 지혜의 기운이 가득하도다. 배움에 대한 열정이 크고, 어른의 도움을 받기 쉬우니라.' },
};

export function getTemplateInterpretation(roomId: string, saju: SajuResult): string {
  const dm = saju.dayMaster;
  const el = dm.element;
  const elName = ELEMENT_NAMES[el];
  const yy = dm.yinYang === 'yang' ? '양' : '음';
  const name = saju.birthInfo.name;
  const personality = ELEMENT_PERSONALITY[el];

  switch (roomId) {
    case 'cave': {
      return [
        `── ${name}의 사주 ──`,
        '',
        `그대의 일간은 ${dm.korean}${elName.hanja}(${yy}), 핵심 키워드는 "${personality.keyword}"이로다.`,
        '',
        personality.desc,
        '',
        `── 사주 네 기둥의 의미 ──`,
        '',
        `연주 — 조상과 사회적 환경을 나타냄`,
        `월주 — 부모와 직업의 흐름을 보여줌`,
        `일주 — 그대 자신과 배우자의 기운`,
        `시주 — 자녀와 말년의 모습을 담음`,
        '',
        `${yy === '양' ? '양(陽)의 기운이니 적극적이고 외향적인 면이 강하도다.' : '음(陰)의 기운이니 섬세하고 내면이 풍부한 성품이로다.'} 더 깊은 이야기는 각 방에서 들려주리라.`,
      ].join('\n');
    }

    case 'elements': {
      const fe = saju.fiveElements;
      const dom = ELEMENT_NAMES[fe.dominant];
      const def = ELEMENT_NAMES[fe.deficient];
      const domP = ELEMENT_PERSONALITY[fe.dominant];
      const defP = ELEMENT_PERSONALITY[fe.deficient];

      return [
        `── 오행 분석 결과 ──`,
        '',
        `가장 강한 기운: ${dom.korean}(${dom.hanja}) — "${domP.keyword}"`,
        `가장 약한 기운: ${def.korean}(${def.hanja}) — "${defP.keyword}"`,
        '',
        `${dom.korean}(${dom.hanja})이 강하니, ${domP.desc}`,
        '',
        `── 보완이 필요한 기운 ──`,
        '',
        `${def.korean}(${def.hanja})이 부족하니, ${ELEMENT_HEALTH[fe.deficient]}`,
        '',
        `오행의 균형을 맞추는 것이 건강하고 조화로운 삶의 비결이니라.`,
      ].join('\n');
    }

    case 'tenGods': {
      const gods = saju.tenGods;
      const godCounts: Record<string, number> = {};
      for (const g of gods) {
        godCounts[g.name] = (godCounts[g.name] || 0) + 1;
      }
      const sorted = Object.entries(godCounts).sort((a, b) => b[1] - a[1]);
      const dominant = sorted[0]?.[0] || '비견';
      const domInfo = TEN_GOD_MEANINGS[dominant];
      const second = sorted.length > 1 ? sorted[1][0] : null;
      const secInfo = second ? TEN_GOD_MEANINGS[second] : null;

      return [
        `── 십성 분석 결과 ──`,
        '',
        `가장 두드러진 십성: "${dominant}" — ${domInfo?.keyword || ''}`,
        '',
        domInfo?.desc || '',
        '',
        `이 기운이 그대의 직업과 인간관계에 깊은 영향을 미치고 있느니라.`,
        '',
        ...(secInfo ? [
          `── 보조 십성 ──`,
          '',
          `"${second}" — ${secInfo.keyword}`,
          secInfo.desc,
          '',
        ] : []),
        `십성의 조화를 잘 살피면 그대의 길이 더욱 밝아지리라.`,
      ].join('\n');
    }

    case 'luck': {
      const cycles = saju.luckCycles;
      const yl = saju.yearlyLuck;
      const currentAge = new Date().getFullYear() - saju.birthInfo.year;
      const currentCycle = cycles.find(c => currentAge >= c.startAge && currentAge <= c.endAge);

      return [
        `── 대운 분석 결과 ──`,
        '',
        currentCycle
          ? `현재 ${currentAge}세, "${currentCycle.pillar.ganjiKorean}" 대운(${currentCycle.startAge}-${currentCycle.endAge}세)을 지나고 있도다. ${ELEMENT_NAMES[currentCycle.pillar.stem.element].korean}(${ELEMENT_NAMES[currentCycle.pillar.stem.element].hanja})의 흐름이 그대의 일상에 영향을 미치고 있느니라.`
          : `아직 첫 대운이 시작되지 않았거나, 큰 전환의 시기에 서 있도다.`,
        '',
        `── 올해 세운 ──`,
        '',
        `${yl.year}년은 "${yl.pillar.ganjiKorean}"의 해이니, ${ELEMENT_NAMES[yl.pillar.stem.element].korean}(${ELEMENT_NAMES[yl.pillar.stem.element].hanja})의 기운이 흐르는 해로다.`,
        '',
        `대운의 흐름을 알면 인생의 큰 파도를 탈 수 있으니, 순리에 따르되 준비를 게을리하지 마시오.`,
      ].join('\n');
    }

    case 'synthesis': {
      const fe = saju.fiveElements;
      const dom = ELEMENT_NAMES[fe.dominant];
      const def = ELEMENT_NAMES[fe.deficient];
      const domP = ELEMENT_PERSONALITY[fe.dominant];
      const gods = saju.tenGods;
      const godCounts: Record<string, number> = {};
      for (const g of gods) {
        godCounts[g.name] = (godCounts[g.name] || 0) + 1;
      }
      const sorted = Object.entries(godCounts).sort((a, b) => b[1] - a[1]);
      const domGod = sorted[0]?.[0] || '비견';
      const domGodInfo = TEN_GOD_MEANINGS[domGod];
      const currentAge = new Date().getFullYear() - saju.birthInfo.year;
      const currentCycle = saju.luckCycles.find(c => currentAge >= c.startAge && currentAge <= c.endAge);

      return [
        `── ${name}에게 전하는 운명의 서 ──`,
        '',
        `그대의 일간은 "${dm.korean}${elName.hanja}" — ${personality.keyword}의 기운이로다.`,
        '',
        personality.desc,
        '',
        `사주에서 가장 눈에 띄는 것은 "${domGod}"(${domGodInfo?.keyword || ''})의 기운이로다. ${domGodInfo?.desc || ''} 이 기운을 잘 활용하는 것이 성공의 열쇠가 되리라.`,
        '',
        `오행을 보면, ${dom.korean}(${dom.hanja})이 넘치고 ${def.korean}(${def.hanja})이 부족하도다. ${el === fe.dominant ? '일간과 같은 기운이 강하니 자아가 뚜렷하나, 자칫 독선에 빠지지 않도록 주의하시오.' : '일간을 보좌하는 기운이 풍부하니 좋은 환경이 따르지만, 스스로의 주체성을 잃지 마시오.'} ${ELEMENT_HEALTH[fe.deficient]}`,
        '',
        currentCycle
          ? `지금 ${currentAge}세, "${currentCycle.pillar.ganjiKorean}" 대운을 지나고 있도다. ${ELEMENT_NAMES[currentCycle.pillar.stem.element].korean}의 흐름이 일상에 영향을 미치고 있으니, 이 기운의 방향을 잘 살펴 순리에 따르시오.`
          : `그대의 대운은 아직 본격적으로 시작되지 않았거나, 큰 전환의 시기에 서 있도다.`,
        '',
        `── 마지막 조언 ──`,
        '',
        `${def.korean}의 기운을 채우고, ${dom.korean}의 기운을 다스리며, "${domGod}"가 가리키는 길을 따르시오. 사주는 정해진 운명이 아니라, 그대가 자신을 이해하기 위한 지도이니라.`,
      ].join('\n');
    }

    default:
      return '현자가 잠시 침묵합니다...';
  }
}
