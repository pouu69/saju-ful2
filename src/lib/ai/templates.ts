import { SajuResult, FiveElement, MaritalStatus } from '../saju/types';
import { ELEMENT_NAMES } from '../saju/constants';
import { countTenGods, getCurrentLuckInfo } from '../saju/helpers';

/** 오행별 성격 키워드 + 현대적 설명 */
const ELEMENT_PERSONALITY: Record<FiveElement, { keyword: string; desc: string; modernDesc: string }> = {
  wood: {
    keyword: '성장과 도전',
    desc: '나무처럼 위로 뻗어가는 기운이야. 곧고 인자한 성품에, 새로운 걸 시작하는 데 겁이 없지.',
    modernDesc: '새 프로젝트나 도전에 먼저 손 드는 타입이야. 스타트업 정신이 강하고, 자기계발에 돈 쓰는 걸 아까워하지 않거든. 다만 여러 일을 동시에 벌이다 에너지가 분산될 수 있으니까, 우선순위를 딱 정해서 집중하는 게 중요하지.',
  },
  fire: {
    keyword: '열정과 표현',
    desc: '불꽃 같은 열정의 기운이야. 밝고 따뜻한 성격으로 사람을 끌어당기고, 직감이랑 표현력이 뛰어나지.',
    modernDesc: '프레젠테이션이나 미팅에서 분위기를 주도하는 타입이거든. SNS나 커뮤니케이션에도 능하고, 주변에 영감을 주는 사람이야. 근데 번아웃을 조심해야 해. 혼자만의 리차지 시간을 꼭 챙기게.',
  },
  earth: {
    keyword: '안정과 신뢰',
    desc: '대지처럼 묵직한 기운이야. 믿음직한 성품으로 주변을 안정시키고, 성실하게 꾸준히 가는 스타일이지.',
    modernDesc: '팀에서 가장 믿음직한 사람이 되는 타입이야. 꾸준히 성과를 쌓아가고, 장기 커리어 플랜도 잘 세우거든. 다만 요즘처럼 변화가 빠른 시대엔 새로운 트렌드나 기술을 받아들이는 유연함도 좀 길러보게.',
  },
  metal: {
    keyword: '결단과 완벽',
    desc: '쇠처럼 단단한 기운이야. 결단력 있고 정의로운 성품에, 한번 정하면 끝까지 밀고 나가지.',
    modernDesc: '업무에서 높은 기준을 세우고 품질을 중시하는 타입이야. 체계적으로 정리하고 효율적인 프로세스를 만드는 데 뛰어나거든. 근데 완벽주의가 과하면 스트레스가 쌓이니까, 가끔은 "이 정도면 됐다" 하고 넘어가는 연습도 필요해.',
  },
  water: {
    keyword: '지혜와 적응',
    desc: '물처럼 유연한 기운이야. 지혜롭고 사고력이 깊은 데다, 어떤 상황이든 적응을 잘하지.',
    modernDesc: '트렌드를 빠르게 읽고 상황에 맞춰 전략을 바꾸는 타입이거든. 이것저것 관심 분야도 많고, 새로운 기술이나 지식을 빠르게 흡수해. 다만 알아보기만 하다 실행이 늦어질 수 있으니까, 결정의 순간엔 과감하게 움직여보게.',
  },
};

/** 오행별 현대적 건강/라이프스타일 조언 */
const ELEMENT_HEALTH: Record<FiveElement, string> = {
  wood: '간이랑 눈 건강을 좀 챙기게. 화면을 오래 보는 일이라면 눈 휴식을 꼭 챙기고, 주말엔 산책이나 등산으로 기운을 충전하는 게 좋아.',
  fire: '심장이랑 혈액순환 쪽을 신경 쓰게. 야근이 잦으면 수면의 질이 떨어지거든. 취침 루틴을 만들고 카페인을 좀 줄여보게.',
  earth: '위장이랑 소화기 쪽을 조심하게. 불규칙한 식사랑 배달 음식에 너무 의존하지 말고, 일정한 시간에 따뜻한 밥 한 끼 챙겨 먹는 게 중요해.',
  metal: '폐랑 호흡기 쪽을 신경 쓰게. 실내에만 있지 말고 환기를 자주 하고, 가벼운 유산소 운동으로 폐 기능을 유지해보게.',
  water: '신장이랑 방광 쪽을 챙기게. 커피보다 물을 많이 마시고, 하체 근력 운동이랑 스트레칭으로 순환을 도와주는 게 좋아.',
};

/** 십성별 키워드 + 현대적 해석 */
const TEN_GOD_MEANINGS: Record<string, { keyword: string; desc: string; career: string; relationship: string }> = {
  '비견': {
    keyword: '독립·경쟁',
    desc: '나랑 같은 기운이라서, 독립심이랑 자존심이 강한 편이야.',
    career: '1인 기업, 프리랜서, 전문직처럼 독립적으로 성과를 내는 일이 잘 맞거든. 협업보다는 각자 영역을 존중하는 환경에서 빛나는 타입이야.',
    relationship: '연인이나 배우자한테도 자기만의 공간과 시간이 필요한 타입이야. 서로의 독립성을 존중하는 관계가 오래 가지.',
  },
  '겁재': {
    keyword: '추진·승부',
    desc: '추진력이랑 승부욕이 장난 아니게 강해.',
    career: '영업, 투자, 스타트업 같은 성과가 눈에 보이는 일에서 두각을 나타내거든. 근데 욕심이 과하면 리스크가 커지니까, 분산 투자랑 리스크 관리를 항상 염두에 둬야 해.',
    relationship: '열정적으로 다가가는 편인데, 상대한테 부담을 줄 수 있으니까 밀당의 균형을 잘 맞춰보게.',
  },
  '식신': {
    keyword: '풍요·콘텐츠',
    desc: '풍요랑 여유의 기운이라, 먹는 것도 즐기는 것도 좋아하는 타입이야.',
    career: 'F&B, 콘텐츠 크리에이터, 요리, 디자인 같은 감각을 살리는 분야가 딱이거든. 워라밸을 중시하고, 좋아하는 걸 직업으로 만들 때 가장 행복한 사람이야.',
    relationship: '같이 맛있는 거 먹고, 여행 다니고, 일상을 함께 즐기는 걸 중요하게 여기지. 편하고 따뜻한 관계를 만드는 스타일이야.',
  },
  '상관': {
    keyword: '창의·혁신',
    desc: '지성이 날카롭고 창의력이 뛰어나.',
    career: '개발자, 디자이너, 작가, 기획자처럼 기존 틀을 깨는 일이 잘 맞거든. 반복 업무보다는 새로운 문제를 풀 때 에너지가 넘치는 타입이야.',
    relationship: '자기 표현이 강해서 때로는 말로 상처를 줄 수 있으니까, 솔직함이랑 배려 사이의 균형을 잘 잡아보게.',
  },
  '편재': {
    keyword: '사교·재테크',
    desc: '활동적이고 사교적인 재물의 기운이야.',
    career: '프리랜서, 투잡, 부업처럼 여러 수입원을 관리하는 데 능하거든. 부동산, 주식 같은 재테크에도 감각이 있어서, 잘 활용하면 경제적 여유를 누릴 수 있어.',
    relationship: '인맥이 넓어서 다양한 만남이 있는데, 진짜 관계에 깊이를 더하는 노력이 좀 필요하지.',
  },
  '정재': {
    keyword: '안정·저축',
    desc: '안정적이고 꾸준한 재물의 기운이야.',
    career: '대기업, 공기업, 금융권처럼 안정적인 조직에서 꾸준히 성장하는 타입이거든. 적금, 연금 같은 장기 재테크가 잘 맞아.',
    relationship: '안정적이고 헌신적인 파트너 스타일이야. 가정을 꾸리는 것에 대한 계획이 뚜렷하고, 경제적 기반을 중시하지.',
  },
  '편관': {
    keyword: '리더십·도전',
    desc: '권위랑 통솔의 기운이 있어.',
    career: '관리직, 임원, 경찰, 군인처럼 조직을 이끄는 자리가 잘 맞거든. 위기 상황에서 결단력을 발휘하는데, 동료나 부하 직원 의견도 잘 듣는 리더십을 갖추면 더 좋아.',
    relationship: '상대를 보호하려는 마음이 강한데, 지나친 간섭은 갈등의 원인이 될 수 있으니까 주의하게.',
  },
  '정관': {
    keyword: '명예·체계',
    desc: '명예랑 책임의 기운이야.',
    career: '공무원, 법조계, 대기업 관리직, 교수처럼 사회적 명예가 따르는 직업이 잘 맞거든. 규칙이랑 체계를 중시하고, 조직 안에서 신뢰를 착실히 쌓아가는 타입이야.',
    relationship: '책임감 있고 성실한 파트너야. 결혼하고 나면 가정에 대한 책임감이 더 강해지지.',
  },
  '편인': {
    keyword: '비범·기술',
    desc: '사고가 독특하고 학문 쪽 기운이 있어.',
    career: '연구원, 개발자, 전문 기술직, 예술가처럼 남들과 다른 길 가는 데 두려움이 없거든. 자격증이나 특수 기술로 전문성을 인정받기 쉬운 타입이야.',
    relationship: '자기만의 세계가 뚜렷해서 상대가 이해하기 어려울 수 있으니까, 소통하는 데 좀 더 신경 써보게.',
  },
  '정인': {
    keyword: '학습·멘토',
    desc: '학문이랑 지혜의 기운이 가득해.',
    career: '교사, 교수, 컨설턴트, 코치처럼 지식을 나누는 일이 잘 맞거든. 자격증, 학위 같은 공부를 통한 커리어 향상이 잘 되는 타입이야.',
    relationship: '어른이나 멘토의 도움을 잘 받고, 관계에서도 배움이랑 성장을 중시하는 편이야.',
  },
};

/** 오행별 개운법 (부족한 오행 보충) */
const ELEMENT_LUCK_TIPS: Record<FiveElement, string> = {
  wood: '초록색 계열 옷이나 소품을 가까이하고, 동쪽 방향을 의식해보게. 나무가 많은 공원 산책이나 식물 키우기도 좋아. 새벽 시간대에 활동하면 목(木)의 기운을 받을 수 있거든. 식단엔 푸른 잎채소를 좀 더 챙기게.',
  fire: '빨간색이나 보라색 계열을 활용하고, 남쪽 방향이 좋아. 햇볕을 자주 쬐고, 촛불 명상이나 따뜻한 차 한 잔의 여유를 가져보게. 사람들과 어울리는 활동이 화(火)의 기운을 살려주거든.',
  earth: '노란색, 갈색 계열이 좋고, 집 중앙을 정돈하는 게 도움이 돼. 도자기나 흙과 관련된 취미 활동도 좋아. 식단에 뿌리채소나 곡물을 챙기고, 규칙적인 생활 리듬을 만드는 게 토(土)의 기운을 보충하는 핵심이야.',
  metal: '흰색, 금색 계열을 가까이하고, 서쪽 방향을 의식해보게. 금속 소재 액세서리(시계, 반지 등)를 착용하는 것도 좋아. 정리정돈이나 미니멀한 환경을 만드는 게 금(金)의 기운과 잘 맞거든.',
  water: '검정색, 남색 계열이 좋고, 북쪽 방향을 활용해보게. 물을 자주 마시고, 수영이나 온천 같은 물과 관련된 활동이 도움이 돼. 저녁 시간에 명상이나 독서로 내면을 채우는 게 수(水)의 기운을 보충하는 방법이야.',
};

/** 궁합 개운법 (두 사람의 오행 조합별) — 대칭 행렬 */
const COUPLE_LUCK_TIPS: Record<FiveElement, Record<FiveElement, string>> = {
  wood: {} as Record<FiveElement, string>,
  fire: {} as Record<FiveElement, string>,
  earth: {} as Record<FiveElement, string>,
  metal: {} as Record<FiveElement, string>,
  water: {} as Record<FiveElement, string>,
};

function setCoupleTip(a: FiveElement, b: FiveElement, tip: string) {
  COUPLE_LUCK_TIPS[a][b] = tip;
  COUPLE_LUCK_TIPS[b][a] = tip;
}

// 동일 오행
setCoupleTip('wood', 'wood', '둘 다 목(木)이니까, 함께 등산이나 숲길 산책을 하면 에너지가 올라가. 초록색 인테리어를 공유 공간에 두는 것도 좋지.');
setCoupleTip('fire', 'fire', '둘 다 화(火)니까 열정이 넘치는데, 과열되지 않게 가끔 조용한 카페에서 대화하는 시간을 가져보게.');
setCoupleTip('earth', 'earth', '둘 다 토(土)니까 안정적인 관계야. 함께 집 꾸미기나 요리하는 시간을 늘려보게.');
setCoupleTip('metal', 'metal', '둘 다 금(金)이니까 깔끔한 걸 좋아하지. 함께 공간 정리하거나 미니멀 라이프를 추구해보게.');
setCoupleTip('water', 'water', '둘 다 수(水)니까 지적인 활동이 잘 맞아. 함께 독서 모임이나 전시회 관람을 즐겨보게.');

// 상생 조합
setCoupleTip('wood', 'fire', '목생화(木生火) 조합이라 함께 요리하거나 캠핑에서 불멍하는 게 두 사람의 기운을 살려줘.');
setCoupleTip('fire', 'earth', '화생토(火生土) 조합이라 함께 맛집 탐방이나 홈파티를 즐기는 게 관계에 좋아.');
setCoupleTip('earth', 'metal', '토생금(土生金) 조합이라 함께 보석/액세서리 쇼핑이나 클래식 공연 관람이 좋아.');
setCoupleTip('metal', 'water', '금생수(金生水) 조합이라 수영, 스파, 바다 여행 같은 물 관련 활동이 두 사람의 기운을 살려줘.');
setCoupleTip('water', 'wood', '수생목(水生木) 조합이라 물가에서 보내는 시간이 좋아. 해변 산책이나 수족관 데이트를 추천하지.');

// 상극 조합
setCoupleTip('wood', 'earth', '함께 텃밭 가꾸기나 도자기 만들기 같은 활동이 좋아. 자연 속에서 보내는 시간이 관계를 안정시켜줄 거야.');
setCoupleTip('wood', 'metal', '서로 다른 기운이니까, 음악 감상이나 미술관 방문 같은 감각적인 활동으로 균형을 맞춰보게.');
setCoupleTip('fire', 'metal', '서로 자극이 되는 조합이야. 함께 운동하거나 경쟁적인 게임을 하면 오히려 관계가 좋아지거든.');
setCoupleTip('fire', 'water', '반대 기운이라 균형이 중요해. 온천 여행이나 따뜻한 음식을 함께 즐기는 게 좋지.');
setCoupleTip('earth', 'water', '서로 다른 기운이니까, 여행을 함께 계획하고 다니는 게 관계의 균형을 맞춰줄 거야.');

/** 결혼 상태에 따른 관계 조언 분기 */
function getRelationshipAdvice(marital: MaritalStatus, tenGodRelationship: string): string {
  switch (marital) {
    case 'married':
      return `기혼이니까 좀 더 짚어보자면, ${tenGodRelationship} 배우자랑 대화 시간을 의식적으로 만들고, 서로의 성장을 응원하는 게 가정의 평화를 지키는 길이야.`;
    case 'single':
      return `미혼이니까 좀 더 짚어보자면, ${tenGodRelationship} 자기 성향을 잘 이해하고 그에 맞는 사람을 만나는 게 중요하지.`;
    default:
      return tenGodRelationship;
  }
}

export function getTemplateInterpretation(roomId: string, saju: SajuResult, partnerSaju?: SajuResult): string {
  const dm = saju.dayMaster;
  const el = dm.element;
  const elName = ELEMENT_NAMES[el];
  const yy = dm.yinYang === 'yang' ? '양' : '음';
  const name = saju.birthInfo.name;
  const occupation = saju.birthInfo.occupation || '';
  const marital = saju.birthInfo.maritalStatus;
  const personality = ELEMENT_PERSONALITY[el];

  switch (roomId) {
    case 'synthesis': {
      return [
        `── 핵심 요약 ──`,
        '',
        `일간: "${dm.korean}${elName.hanja}" · ${yy === '양' ? '양(陽)' : '음(陰)'} · "${personality.keyword}"`,
        `${saju.dayPillar.branch.animal}띠 · ${elName.korean}(${elName.hanja})의 기운`,
        '',
        `── 종합 풀이 ──`,
        '',
        personality.modernDesc,
        '',
        ...(occupation ? [`${name}의 직업 "${occupation}"을 사주 관점에서 보면, ${elName.korean}(${elName.hanja})의 기운이 일하는 방식에 깊이 배어 있어.`, ''] : []),
        `${yy === '양' ? '양(陽)의 기운이니까 회의에서 먼저 의견 내고 주도적으로 일을 이끄는 성향이지.' : '음(陰)의 기운이니까 깊이 관찰하고 신중하게 판단하는 성향이야. 조용하지만 결정적인 순간에 핵심을 딱 짚어내거든.'} 더 자세한 이야기는 각 방에서 들려줄게.`,
      ].join('\n');
    }

    case 'detail': {
      const fe = saju.fiveElements;
      const dom = ELEMENT_NAMES[fe.dominant];
      const def = ELEMENT_NAMES[fe.deficient];
      const domP = ELEMENT_PERSONALITY[fe.dominant];

      const sorted = countTenGods(saju.tenGods);
      const dominant = sorted[0]?.[0] || '비견';
      const domInfo = TEN_GOD_MEANINGS[dominant];
      const second = sorted.length > 1 ? sorted[1][0] : null;
      const secInfo = second ? TEN_GOD_MEANINGS[second] : null;

      return [
        `── 핵심 요약 ──`,
        '',
        `강한 오행: "${dom.korean}(${dom.hanja})" · 약한 오행: "${def.korean}(${def.hanja})"`,
        `주요 십성: "${dominant}" · ${domInfo?.keyword || ''}`,
        ...(second ? [`보조 십성: "${second}" · ${secInfo?.keyword || ''}`] : []),
        '',
        `── 오행과 십성의 역학 ──`,
        '',
        `${dom.korean}(${dom.hanja})이 강하니까, ${domP.modernDesc}`,
        '',
        `여기에 "${dominant}"의 기운이 가장 강하게 작동하고 있어. ${domInfo?.desc || ''} ${domInfo?.career || ''}`,
        '',
        ...(secInfo ? [`"${second}"의 기운도 같이 작용하고 있는데, ${secInfo.desc} ${secInfo.career}`, ''] : []),
        `── 커리어·재물·관계 ──`,
        '',
        ...(occupation ? [`지금 하고 있는 "${occupation}"이랑 "${dominant}"의 관계를 살펴보면, 이 기운을 잘 활용하고 있는지 한번 돌아보는 게 좋겠어.`, ''] : []),
        getRelationshipAdvice(marital, domInfo?.relationship || ''),
        '',
        `── 균형과 개운 ──`,
        '',
        `${def.korean}(${def.hanja})이 부족한 편이거든. ${ELEMENT_HEALTH[fe.deficient]}`,
        '',
        `오행의 균형을 맞추면서 십성의 에너지를 잘 활용하는 게 핵심이야. 강한 오행은 자네의 무기고, 약한 오행은 보완할 부분이니까, 의식적으로 균형 맞추는 습관을 들여보게.`,
      ].join('\n');
    }

    case 'luck': {
      const yl = saju.yearlyLuck;
      const { currentAge, currentCycle } = getCurrentLuckInfo(saju);

      return [
        `── 핵심 요약 ──`,
        '',
        currentCycle
          ? `현재 대운: "${currentCycle.pillar.ganjiKorean}" (${currentCycle.startAge}-${currentCycle.endAge}세) · ${ELEMENT_NAMES[currentCycle.pillar.stem.element].korean}(${ELEMENT_NAMES[currentCycle.pillar.stem.element].hanja})`
          : `현재 대운: 전환기`,
        `올해 세운: "${yl.pillar.ganjiKorean}" · ${ELEMENT_NAMES[yl.pillar.stem.element].korean}(${ELEMENT_NAMES[yl.pillar.stem.element].hanja})`,
        '',
        `── 세부 풀이 ──`,
        '',
        currentCycle
          ? `지금 ${currentAge}세, "${currentCycle.pillar.ganjiKorean}" 대운을 지나고 있거든. ${ELEMENT_NAMES[currentCycle.pillar.stem.element].korean}(${ELEMENT_NAMES[currentCycle.pillar.stem.element].hanja})의 흐름이 자네 일상에 영향을 미치고 있어.`
          : `아직 첫 대운이 시작되지 않았거나, 큰 전환의 시기에 서 있는 거야.`,
        '',
        `${yl.year}년은 "${yl.pillar.ganjiKorean}"의 해라서, ${ELEMENT_NAMES[yl.pillar.stem.element].korean}(${ELEMENT_NAMES[yl.pillar.stem.element].hanja})의 기운이 흐르는 해거든.`,
        '',
        ...(occupation ? [`"${occupation}" 분야에서 올해는 ${ELEMENT_NAMES[yl.pillar.stem.element].korean}의 기운에 맞춰 전략을 세워보는 게 좋겠어.`] : []),
        ...(marital === 'single' ? ['올해 운이 연애운에도 영향을 미치니까, 새로운 만남의 기회를 놓치지 말게.'] : []),
        ...(marital === 'married' ? ['가정에서는 배우자랑 소통에 좀 더 신경 쓰는 한 해가 되면 좋겠어.'] : []),
        '',
        `── 개운법 ──`,
        '',
        `${ELEMENT_NAMES[saju.fiveElements.deficient].korean}(${ELEMENT_NAMES[saju.fiveElements.deficient].hanja})의 기운을 보충하는 게 올해의 개운 포인트야.`,
        `${ELEMENT_LUCK_TIPS[saju.fiveElements.deficient]}`,
        '',
        `대운의 흐름을 아는 건 네비게이션 켜고 운전하는 것과 비슷해. 목적지를 바꿀 순 없지만, 최적의 경로는 찾을 수 있거든.`,
      ].join('\n');
    }

    case 'compatibility': {
      if (!partnerSaju) return '현자가 잠시 생각에 잠깁니다...';

      const partnerDm = partnerSaju.dayMaster;
      const partnerEl = partnerDm.element;
      const partnerElName = ELEMENT_NAMES[partnerEl];
      const partnerPersonality = ELEMENT_PERSONALITY[partnerEl];
      const partnerName = partnerSaju.birthInfo.name;

      // 오행 상생/상극 판단
      const GENERATE_MAP: Record<FiveElement, FiveElement> = { wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood' };
      const isGenerating = GENERATE_MAP[el] === partnerEl || GENERATE_MAP[partnerEl] === el;

      return [
        `── 핵심 요약 ──`,
        '',
        `${name}: "${dm.korean}${elName.hanja}" · "${personality.keyword}"`,
        `${partnerName}: "${partnerDm.korean}${partnerElName.hanja}" · "${partnerPersonality.keyword}"`,
        `오행 관계: ${isGenerating ? '상생(相生) — 서로를 살리는 기운' : '상극(相剋) — 긴장과 성장의 기운'}`,
        '',
        `── 세부 풀이 ──`,
        '',
        `${name}은 ${elName.korean}(${elName.hanja})의 기운이고, ${partnerName}은 ${partnerElName.korean}(${partnerElName.hanja})의 기운이야.`,
        '',
        isGenerating
          ? `두 사람은 서로의 기운을 북돋아주는 "상생" 관계거든. 한 사람이 지칠 때 다른 사람이 에너지를 채워주는 식이야. 일상에서도 서로 보완하는 면이 많을 거야.`
          : `두 사람은 서로 자극하는 "상극" 관계인데, 나쁜 게 아니야. 오히려 서로에게 성장의 동력이 되거든. 다만 갈등 상황에서 한 발짝 물러서는 여유가 필요하지.`,
        '',
        `${name}의 "${personality.keyword}" 성향과 ${partnerName}의 "${partnerPersonality.keyword}" 성향이 만나면, 서로 다른 강점을 가진 팀이 되는 거야.`,
        '',
        `── 궁합 개운법 ──`,
        '',
        `두 사람의 관계를 더 좋게 만들려면, 서로에게 부족한 오행을 채워주는 게 좋아.`,
        `${name}에게는 ${ELEMENT_NAMES[saju.fiveElements.deficient].korean}(${ELEMENT_NAMES[saju.fiveElements.deficient].hanja})의 기운이 필요하고, ${partnerName}에게는 ${ELEMENT_NAMES[partnerSaju.fiveElements.deficient].korean}(${ELEMENT_NAMES[partnerSaju.fiveElements.deficient].hanja})의 기운이 필요하거든.`,
        `${COUPLE_LUCK_TIPS[el][partnerEl] || '함께 자연 속에서 시간을 보내는 게 두 사람의 기운 균형에 좋아.'}`,
        '',
        `── 현자의 한마디 ──`,
        '',
        `궁합이란 정해진 운명이 아니라, 서로를 이해하는 도구일 뿐이야. 서로의 다른 점을 인정하고 존중할 때, 어떤 궁합이든 좋은 관계로 만들 수 있거든.`,
      ].join('\n');
    }

    default:
      return '현자가 잠시 생각에 잠깁니다...';
  }
}
