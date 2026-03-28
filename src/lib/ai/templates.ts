import { SajuResult, FiveElement, MaritalStatus } from '../saju/types';
import { ELEMENT_NAMES } from '../saju/constants';
import { countTenGods, getCurrentLuckInfo } from '../saju/helpers';
import {
  ELEMENT_PERSONALITY,
  DAY_MASTER_METAPHOR,
  TEN_GOD_MEANINGS,
  ELEMENT_LUCK_TIPS,
  ELEMENT_RELATION_DESC,
  COUPLE_LUCK_TIPS,
  SAGE_WORDS,
  SINSAL_DETAIL,
} from './templateData';

/** 결혼 상태에 따른 관계 조언 분기 */
function getRelationshipAdvice(marital: MaritalStatus, tenGodRelationship: string, dmKorean: string): string {
  switch (marital) {
    case 'married':
      return `기혼이니 배우자와의 관계를 살펴보자면, ${tenGodRelationship} "${dmKorean}"일주는 자존심이 강해서 배우자에게 먼저 미안하다고 말하는 것을 어려워하는데, 이는 관계에 독이 될 수 있음을 명심해야 하네. 배우자에게 솔직하게 마음을 표현하고, 서로의 감정을 공유하는 시간을 늘리는 것이 좋겠네.`;
    case 'single':
      return `미혼이니 좀 더 짚어보자면, ${tenGodRelationship} 자기 성향을 잘 이해하고 그에 맞는 사람을 만나는 게 중요하지. 그대의 일주 특성상 겉모습보다는 내면의 깊이를 보는 사람이 오래 함께할 수 있을 거야.`;
    default:
      return tenGodRelationship;
  }
}

/** 공망 해석 */
function getGongmangDesc(saju: SajuResult): string {
  if (saju.gongmang.affectedPillars.length === 0) return '';
  const branches = saju.gongmang.branches.join(', ');
  const affected = saju.gongmang.affectedPillars.join(', ');
  return `"공망"이란 쉽게 말해 그 자리의 에너지가 빈 것처럼 작용하는 걸 뜻하거든. ${branches}이 공망이라 ${affected} 쪽에서 예상치 못한 변동이 생기기 쉬운 구조야. 다만 공망이 꼭 나쁜 것만은 아니야 — 오히려 세속적 집착에서 벗어나 정신적 깊이를 얻는 계기가 될 수도 있지.`;
}

export function getTemplateInterpretation(type: string, saju: SajuResult, partnerSaju?: SajuResult): string {
  const dm = saju.dayMaster;
  const el = dm.element;
  const elName = ELEMENT_NAMES[el];
  const name = saju.birthInfo.name;
  const occupation = saju.birthInfo.occupation || '';
  const marital = saju.birthInfo.maritalStatus;
  const personality = ELEMENT_PERSONALITY[el];
  const metaphor = DAY_MASTER_METAPHOR[dm.korean];

  switch (type) {
    case 'synthesis': {
      const sorted = countTenGods(saju.tenGods);
      const dominant = sorted[0]?.[0] || '비견';
      const domInfo = TEN_GOD_MEANINGS[dominant];
      const second = sorted.length > 1 ? sorted[1][0] : null;
      const secInfo = second ? TEN_GOD_MEANINGS[second] : null;
      const { currentAge, currentCycle } = getCurrentLuckInfo(saju);
      const gongmangDesc = getGongmangDesc(saju);
      const sageWord = SAGE_WORDS[el][Math.floor(Math.random() * SAGE_WORDS[el].length)];

      // 신살 해석
      const sinsalDescs = saju.sinsals
        .slice(0, 2)
        .map(s => SINSAL_DETAIL[s.name] || `"${s.name}"은 ${s.description}의 기운이야.`)
        .join(' ');

      return [
        `── 핵심 요약 ──`,
        '',
        `그대의 일주, "${saju.dayPillar.ganjiKorean}(${saju.dayPillar.ganjiHanja})"은 마치 ${metaphor?.metaphor || `${personality.desc}`}과 같은 형국이로군. 한마디로 표현하자면 "${metaphor?.theme || personality.keyword}"랄까 — ${metaphor?.strength || personality.modernDesc}`,
        '',
        `── 타고난 성품 ──`,
        '',
        `${metaphor?.strength || ''} ${domInfo?.scene || ''} 다만 ${metaphor?.weakness || `${ELEMENT_NAMES[saju.fiveElements.deficient].korean}(${ELEMENT_NAMES[saju.fiveElements.deficient].hanja})의 기운이 부족한 편이라 주의가 필요하네.`}`,
        '',
        ...(sinsalDescs ? [sinsalDescs, ''] : []),
        `── 커리어와 재물 ──`,
        '',
        `"${dominant}"${second ? `과 "${second}"` : ''}의 기운이 강하니, ${domInfo?.scene || domInfo?.desc || ''} ${domInfo?.career || ''}`,
        ...(secInfo ? [`거기에 "${second}"의 기운도 작용하고 있는데, ${secInfo.desc}`] : []),
        ...(occupation ? [`지금 하고 있는 "${occupation}"이랑 이 기운의 관계를 살펴보면, ${elName.korean}(${elName.hanja})의 기운이 일하는 방식에 깊이 배어 있을 거야.`] : []),
        ...(gongmangDesc ? [gongmangDesc] : []),
        '',
        `── 관계와 가정 ──`,
        '',
        getRelationshipAdvice(marital, domInfo?.relationship || '', saju.dayPillar.ganjiKorean),
        '',
        `── 지금 이 순간 ──`,
        '',
        ...(currentCycle
          ? [`지금 ${currentAge}세, "${currentCycle.pillar.ganjiKorean}" 대운을 지나고 있거든. ${ELEMENT_NAMES[currentCycle.pillar.stem.element].korean}(${ELEMENT_NAMES[currentCycle.pillar.stem.element].hanja})의 흐름이 그대의 일상에 영향을 미치고 있어. ${ELEMENT_RELATION_DESC[el][currentCycle.pillar.stem.element] || ''}`]
          : ['아직 첫 대운이 시작되지 않았거나, 큰 전환의 시기에 서 있는 거야.']),
        '',
        `${saju.yearlyLuck.year}년은 "${saju.yearlyLuck.pillar.ganjiKorean}"의 해라서, ${ELEMENT_NAMES[saju.yearlyLuck.pillar.stem.element].korean}(${ELEMENT_NAMES[saju.yearlyLuck.pillar.stem.element].hanja})의 기운이 흐르고 있네. ${ELEMENT_RELATION_DESC[el][saju.yearlyLuck.pillar.stem.element] || ''}`,
        '',
        `── 현자의 한마디 ──`,
        '',
        sageWord,
      ].join('\n');
    }

    case 'luck': {
      const yl = saju.yearlyLuck;
      const { currentAge, currentCycle } = getCurrentLuckInfo(saju);
      const fe = saju.fiveElements;
      const ylElement = yl.pillar.stem.element;
      const ylElName = ELEMENT_NAMES[ylElement];
      const sageWord = SAGE_WORDS[el][Math.floor(Math.random() * SAGE_WORDS[el].length)];

      // 대운 흐름 서술
      const luckNarrative = saju.luckCycles.slice(0, 6).map(lc => {
        const lcEl = lc.pillar.stem.element;
        const lcElName = ELEMENT_NAMES[lcEl];
        const isCurrent = currentCycle === lc;
        const marker = isCurrent ? ' ← 현재' : '';
        return `${lc.startAge}-${lc.endAge}세: "${lc.pillar.ganjiKorean}" — ${lcElName.korean}(${lcElName.hanja})의 기운${marker}`;
      }).join('\n');

      // 현재 대운 + 원국 관계
      const currentLuckRelation = currentCycle
        ? ELEMENT_RELATION_DESC[el]?.[currentCycle.pillar.stem.element] || ''
        : '';

      // 세운 + 원국 관계
      const yearlyRelation = ELEMENT_RELATION_DESC[el]?.[ylElement] || '';

      return [
        `── 핵심 요약 ──`,
        '',
        currentCycle
          ? `지금 ${currentAge}세, "${currentCycle.pillar.ganjiKorean}" 대운의 한가운데에 서 있네. ${ELEMENT_NAMES[currentCycle.pillar.stem.element].korean}(${ELEMENT_NAMES[currentCycle.pillar.stem.element].hanja})의 기운이 그대의 인생을 ${currentCycle.startAge}세부터 ${currentCycle.endAge}세까지 이끌고 있는 중이야.`
          : '아직 첫 대운이 시작되지 않았거나, 큰 전환기에 서 있는 거야.',
        `올해(${yl.year}년)의 세운은 "${yl.pillar.ganjiKorean}" — ${ylElName.korean}(${ylElName.hanja})의 기운이 흐르는 해야.`,
        '',
        `── 대운의 흐름 ──`,
        '',
        `대운이란 쉽게 말해 인생의 큰 계절이야. 10년마다 바뀌는 큰 흐름인데, 같은 사람이라도 어떤 10년은 승승장구하고, 어떤 10년은 시련의 연속인 게 바로 대운의 영향이거든.`,
        '',
        luckNarrative,
        '',
        ...(currentCycle ? [
          `지금 지나고 있는 "${currentCycle.pillar.ganjiKorean}" 대운은 ${ELEMENT_NAMES[currentCycle.pillar.stem.element].korean}(${ELEMENT_NAMES[currentCycle.pillar.stem.element].hanja})의 기운이야. ${currentLuckRelation}`,
          '',
        ] : []),
        `── 올해의 기운 ──`,
        '',
        `${yl.year}년은 "${yl.pillar.ganjiKorean}"의 해라서, ${ylElName.korean}(${ylElName.hanja})의 기운이 흐르고 있네. ${yearlyRelation}`,
        '',
        ...(occupation ? [`"${occupation}" 분야에서 올해는 ${ylElName.korean}의 기운에 맞춰 전략을 세워보는 게 좋겠어. ${ylElement === fe.deficient ? '부족한 오행이 채워지는 해이니 적극적으로 움직여볼 만해.' : ylElement === fe.dominant ? '이미 강한 기운이 더 강해지는 해라 과유불급을 조심해야 하네.' : ''}`, ''] : []),
        ...(marital === 'single' ? ['올해 운이 연애운에도 영향을 미치니까, 새로운 만남의 기회를 놓치지 말게. 특히 부족한 오행을 보완해주는 성향의 사람을 만나면 좋은 인연이 될 수 있어.', ''] : []),
        ...(marital === 'married' ? ['가정에서는 배우자랑 소통에 좀 더 신경 쓰는 한 해가 되면 좋겠어. 서로의 감정을 표현하는 시간을 의식적으로 만들어보게.', ''] : []),
        `── 개운법 ──`,
        '',
        `${ELEMENT_NAMES[fe.deficient].korean}(${ELEMENT_NAMES[fe.deficient].hanja})의 기운을 보충하는 게 올해의 개운 포인트야.`,
        `${ELEMENT_LUCK_TIPS[fe.deficient]}`,
        '',
        `대운의 흐름을 아는 건 네비게이션 켜고 운전하는 것과 비슷해. 목적지를 바꿀 순 없지만, 최적의 경로는 찾을 수 있거든. ${sageWord}`,
      ].join('\n');
    }

    case 'compatibility': {
      if (!partnerSaju) return '현자가 잠시 생각에 잠깁니다...';

      const partnerDm = partnerSaju.dayMaster;
      const partnerEl = partnerDm.element;
      const partnerElName = ELEMENT_NAMES[partnerEl];
      const partnerPersonality = ELEMENT_PERSONALITY[partnerEl];
      const partnerName = partnerSaju.birthInfo.name;
      const partnerMetaphor = DAY_MASTER_METAPHOR[partnerDm.korean];

      // 오행 상생/상극 판단
      const GENERATE_MAP: Record<FiveElement, FiveElement> = { wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood' };
      const CONTROL_MAP: Record<FiveElement, FiveElement> = { wood: 'earth', fire: 'metal', earth: 'water', metal: 'wood', water: 'fire' };
      const isGenerating = GENERATE_MAP[el] === partnerEl || GENERATE_MAP[partnerEl] === el;
      const isControlling = CONTROL_MAP[el] === partnerEl || CONTROL_MAP[partnerEl] === el;

      // 각자의 주요 십성
      const mySorted = countTenGods(saju.tenGods);
      const myDominant = mySorted[0]?.[0] || '비견';
      const myDomInfo = TEN_GOD_MEANINGS[myDominant];
      const partnerSorted = countTenGods(partnerSaju.tenGods);
      const partnerDominant = partnerSorted[0]?.[0] || '비견';
      const partnerDomInfo = TEN_GOD_MEANINGS[partnerDominant];

      const relationDesc = isGenerating
        ? `서로의 기운을 북돋아주는 "상생(相生)" 관계거든. ${ELEMENT_RELATION_DESC[el]?.[partnerEl] || ''} 한 사람이 지칠 때 다른 사람이 에너지를 채워주는 식이야.`
        : isControlling
          ? `서로 자극하는 "상극(相剋)" 관계인데, 나쁜 게 아니야. ${ELEMENT_RELATION_DESC[el]?.[partnerEl] || ''} 오히려 서로에게 성장의 동력이 되거든. 다만 갈등 상황에서 한 발짝 물러서는 여유가 필요하지.`
          : `같은 오행의 기운이라 서로를 잘 이해하는 관계야. ${ELEMENT_RELATION_DESC[el]?.[partnerEl] || ''} 편안하지만 가끔은 자극이 부족할 수 있으니 의식적으로 새로운 경험을 함께 해보는 게 좋아.`;

      return [
        `── 핵심 요약 ──`,
        '',
        `${name}: "${saju.dayPillar.ganjiKorean}(${saju.dayPillar.ganjiHanja})" — ${metaphor ? metaphor.metaphor : `${personality.keyword}의 기운`}`,
        `${partnerName}: "${partnerSaju.dayPillar.ganjiKorean}(${partnerSaju.dayPillar.ganjiHanja})" — ${partnerMetaphor ? partnerMetaphor.metaphor : `${partnerPersonality.keyword}의 기운`}`,
        '',
        `이 두 자연물이 만나면 어떤 풍경이 펼쳐질까? ${name}의 ${elName.korean}(${elName.hanja})과 ${partnerName}의 ${partnerElName.korean}(${partnerElName.hanja})이 만나는 형국이야.`,
        '',
        `── 오행 궁합 ──`,
        '',
        relationDesc,
        '',
        `${name}의 주요 기운은 "${myDominant}" — ${myDomInfo?.keyword || ''} 성향이고, ${partnerName}의 주요 기운은 "${partnerDominant}" — ${partnerDomInfo?.keyword || ''} 성향이야. 이 두 에너지가 만나면 독특한 케미가 생기거든.`,
        '',
        `── 잘 맞는 점 ──`,
        '',
        isGenerating
          ? `상생 관계라 일상에서 자연스럽게 서로를 보완하는 면이 있어. 한 사람이 아이디어를 내면 다른 사람이 실행하거나, 한 사람이 힘들 때 다른 사람이 에너지를 채워주는 구조야. 소파에 앉아 아무 말 없이 각자 핸드폰 하고 있어도 편안한 사이가 될 수 있지.`
          : isControlling
            ? `상극 관계라 긴장감이 있지만, 그 긴장감이 오히려 관계를 지루하지 않게 만드는 힘이 돼. 서로 다른 관점을 가지고 있으니까, 함께 문제를 풀 때 더 좋은 답을 찾을 수 있거든. 한 사람이 감성적으로 다가가면 다른 사람이 현실적으로 잡아주는 식이지.`
            : `같은 오행이라 말 안 해도 통하는 부분이 많아. 취향이 비슷하고, 리듬이 맞거든. 여행 계획을 세워도 비슷한 스타일이라 충돌이 적은 편이야.`,
        '',
        `── 갈등 포인트 ──`,
        '',
        isGenerating
          ? `상생이라고 갈등이 없는 건 아니야. 한 사람이 계속 "주는" 역할만 하면 지치거든. "${name}이 왜 맨날 나만 맞춰야 해?" 하는 순간이 올 수 있어. 역할을 고정하지 말고, 번갈아가며 주고받는 균형을 의식적으로 만들어보게.`
          : isControlling
            ? `갈등의 핵심은 "방식의 차이"야. 같은 목표를 향해 가더라도 방법이 다르거든. 한 사람은 "빨리 가자!" 하고, 다른 사람은 "천천히 확실하게" 하는 식이지. 내용이 아니라 방식 때문에 싸우는 경우가 많으니, "너 말이 맞아, 근데 이렇게 하면 어떨까?" 식으로 대화해보게.`
            : `너무 비슷해서 오히려 자극이 없을 수 있어. "우리 맨날 같은 거 하는 것 같아" 하는 권태감이 올 수 있지. 의식적으로 새로운 경험을 함께 시도해보는 게 중요해. 서로 다른 취미를 배워서 공유하는 것도 좋은 방법이야.`,
        '',
        `── 궁합 개운법 ──`,
        '',
        `두 사람의 관계를 더 좋게 만들려면, 서로에게 부족한 오행을 채워주는 게 좋아.`,
        `${name}에게는 ${ELEMENT_NAMES[saju.fiveElements.deficient].korean}(${ELEMENT_NAMES[saju.fiveElements.deficient].hanja})의 기운이 필요하고, ${partnerName}에게는 ${ELEMENT_NAMES[partnerSaju.fiveElements.deficient].korean}(${ELEMENT_NAMES[partnerSaju.fiveElements.deficient].hanja})의 기운이 필요하거든.`,
        `${COUPLE_LUCK_TIPS[el][partnerEl] || '함께 자연 속에서 시간을 보내는 게 두 사람의 기운 균형에 좋아.'}`,
        '',
        `── 현자의 한마디 ──`,
        '',
        `궁합이란 정해진 운명이 아니라, 서로를 이해하는 도구일 뿐이야. ${name}의 "${personality.keyword}" 성향과 ${partnerName}의 "${partnerPersonality.keyword}" 성향이 만나면, 서로 다른 강점을 가진 팀이 되는 거야. 서로의 다른 점을 인정하고 존중할 때, 어떤 궁합이든 좋은 관계로 만들 수 있거든.`,
      ].join('\n');
    }

    default:
      return '현자가 잠시 생각에 잠깁니다...';
  }
}

export interface ShareSummary {
  elementKeyword: string;
  elementDesc: string;
  dayMasterTheme: string;
  dayMasterMetaphor: string;
  dominantElement: FiveElement;
  deficientElement: FiveElement;
  zodiacLabel: string;
  wisdomQuote: string;
  animalDetail: string;
  topTenGods: string;
}

export function generateShareSummary(saju: SajuResult): ShareSummary {
  const dominant = saju.fiveElements.dominant;
  const deficient = saju.fiveElements.deficient;
  const dm = saju.dayMaster;

  const personality = ELEMENT_PERSONALITY[dominant];
  const metaphor = DAY_MASTER_METAPHOR[dm.korean] ?? {
    metaphor: '알 수 없는 운명',
    theme: '독특한 기운',
  };

  const animal = saju.yearPillar.branch.animal;
  const zodiacLabel = `${saju.yearPillar.ganjiHanja}年生 ${animal}띠`;

  const ELEMENT_WISDOM: Record<string, string> = {
    wood: '나무는 바람에 흔들려도 뿌리가 깊으면 쓰러지지 않는 법이네.',
    fire: '불꽃은 타오를수록 밝아지니, 열정을 두려워하지 말게.',
    earth: '대지는 모든 것을 품으니, 너그러움이 곧 그대의 힘일세.',
    metal: '금은 불에 달궈져야 빛이 나는 법이야. 시련이 곧 단련이네.',
    water: '물은 낮은 곳으로 흘러 바다를 이루니, 겸손이 곧 그대의 그릇일세.',
  };

  const ANIMAL_DESC: Record<string, string> = {
    '쥐': '영리하고 재치있는 기운',
    '소': '성실하고 묵묵한 기운',
    '호랑이': '용맹하고 결단력 있는 기운',
    '토끼': '온화하고 섬세한 기운',
    '용': '강인하고 카리스마 있는 기운',
    '뱀': '지혜롭고 신비로운 기운',
    '말': '활동적이고 열정적인 기운',
    '양': '온순하고 예술적인 기운',
    '원숭이': '재치있고 다재다능한 기운',
    '닭': '꼼꼼하고 정의로운 기운',
    '개': '충직하고 의리있는 기운',
    '돼지': '풍요롭고 낙천적인 기운',
  };

  const godCounts: Record<string, number> = {};
  for (const g of saju.tenGods ?? []) {
    godCounts[g.name] = (godCounts[g.name] ?? 0) + 1;
  }
  const topGods = Object.entries(godCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => `${name}(${count})`)
    .join(', ');

  return {
    elementKeyword: personality.keyword,
    elementDesc: personality.desc,
    dayMasterTheme: metaphor.theme,
    dayMasterMetaphor: metaphor.metaphor,
    dominantElement: dominant,
    deficientElement: deficient,
    zodiacLabel,
    wisdomQuote: ELEMENT_WISDOM[dominant] ?? '길은 이미 당신 안에 있습니다.',
    animalDetail: `${saju.yearPillar.branch.hanja} · ${animal} — ${ANIMAL_DESC[animal] ?? '독특한 기운'}`,
    topTenGods: topGods || '분석 불가',
  };
}
