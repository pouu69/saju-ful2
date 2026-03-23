import { SajuResult, FiveElement, MaritalStatus, YinYang } from '../saju/types';
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

/** 일간(天干) 음양별 자연물 비유 + 핵심 테마 */
const DAY_MASTER_METAPHOR: Record<string, { metaphor: string; theme: string; strength: string; weakness: string }> = {
  '갑': {
    metaphor: '하늘을 향해 곧게 솟은 거목(巨木)',
    theme: '겉바속촉 리더',
    strength: '큰 나무가 숲의 중심이 되듯, 주변 사람들이 자연스럽게 의지하는 존재야. 조직에서 "저 사람이 있으면 안심"이라는 소리를 듣는 타입이지.',
    weakness: '다만 곧은 나무는 강한 바람에 부러지기 쉬운 법이야. 자존심이 세서 남에게 도움을 청하는 걸 어려워하거든. 혼자 끙끙 앓다가 한 번에 터지는 패턴을 조심해야 하네.',
  },
  '을': {
    metaphor: '바람에 휘어져도 꺾이지 않는 덩굴',
    theme: '유연한 생존가',
    strength: '덩굴이 어떤 구조물이든 감아 올라가듯, 어떤 환경에서든 적응하고 살아남는 능력이 탁월해. 처세술이 뛰어나고, 인맥을 잘 활용하거든.',
    weakness: '다만 너무 유연하면 줏대가 없어 보일 수 있어. "이 사람 진짜 속마음이 뭐야?" 하는 소리를 듣기 쉽지. 중요한 순간에는 자기 의견을 분명히 밝히는 연습이 필요하네.',
  },
  '병': {
    metaphor: '세상을 환히 비추는 태양',
    theme: '타고난 주인공',
    strength: '태양이 만물을 비추듯, 사람들의 시선을 자연스럽게 끌어당기는 존재야. 리더십과 카리스마가 넘치고, 분위기를 주도하거든.',
    weakness: '다만 태양은 그늘을 모르지. 자기도 모르게 주변 사람을 지치게 할 수 있어. 특히 상대방의 감정을 놓치고 혼자 앞서 나가는 경향이 있으니 주의해야 하네.',
  },
  '정': {
    metaphor: '어둠 속 촛불처럼 은은하게 빛나는 불',
    theme: '조용한 영향력자',
    strength: '촛불이 작지만 어둠을 밝히듯, 조용하지만 깊은 통찰력으로 사람들에게 영감을 주는 타입이야. 글쓰기, 상담, 교육 같은 분야에서 빛을 발하지.',
    weakness: '다만 불꽃이 작으면 바람에 흔들리기 쉬운 법이야. 감정 기복이 있고, 남의 말에 쉽게 상처받는 경향이 있어. 겉으로는 괜찮은 척하면서 속으로 곱씹는 스타일이거든.',
  },
  '무': {
    metaphor: '만물을 품는 넓은 대지',
    theme: '묵직한 중심축',
    strength: '큰 산처럼 흔들리지 않는 안정감을 주는 사람이야. 위기 상황에서도 동요하지 않고, 주변 사람들의 버팀목이 되거든. "이 사람만 있으면 뭔가 안심돼" 하는 타입이지.',
    weakness: '다만 산이 움직이지 않듯, 변화를 극도로 싫어하는 경향이 있어. 새로운 환경이나 기술에 적응하는 게 느리고, 한번 자리 잡으면 현상 유지에 안주하기 쉽지.',
  },
  '기': {
    metaphor: '생명을 키워내는 비옥한 텃밭',
    theme: '세심한 양육자',
    strength: '텃밭이 씨앗을 품어 키우듯, 사람을 돌보고 기르는 데 천부적인 재능이 있어. 후배나 팀원을 잘 챙기고, 세심하게 배려하는 타입이거든.',
    weakness: '다만 텃밭에 잡초도 같이 자라듯, 걱정과 근심이 많은 편이야. 남의 일까지 끌어안다가 정작 자기 일은 뒷전으로 밀리는 패턴이 있으니 주의하게.',
  },
  '경': {
    metaphor: '단련된 강철 검',
    theme: '냉철한 결단가',
    strength: '검이 한 번에 칼질하듯, 결정이 빠르고 명확한 타입이야. 복잡한 상황에서도 핵심을 짚어내고, "이렇게 간다" 하면 밀고 나가는 추진력이 있거든.',
    weakness: '다만 너무 날카로우면 사람을 베기도 하지. 직설적인 말이 상대에게 상처가 될 수 있고, 융통성이 부족하다는 소리를 들을 수 있어. 가끔은 돌아가는 것도 방법이라는 걸 기억하게.',
  },
  '신': {
    metaphor: '정교하게 세공된 보석',
    theme: '예민한 완벽주의자',
    strength: '보석이 빛을 정교하게 반사하듯, 디테일을 잡아내는 능력이 탁월해. 미적 감각이 뛰어나고, 품질에 대한 기준이 높거든. 전문가로서의 자질이 강한 타입이야.',
    weakness: '다만 보석은 흠집에 민감하지. 완벽주의 성향이 강해서 작은 실수에도 크게 스트레스를 받고, 타인에게도 높은 기준을 요구하는 경향이 있어. "이 정도면 됐다"를 배워야 하네.',
  },
  '임': {
    metaphor: '끝없이 흐르는 큰 강물',
    theme: '겉바속촉 리더',
    strength: '큰 강이 모든 것을 품듯, 포용력이 크고 지혜가 깊은 사람이야. 겉으로는 잔잔해 보여도 속으로는 거대한 에너지를 품고 있거든. 결정적인 순간에 강한 추진력을 발휘하지.',
    weakness: '다만 강물이 한번 범람하면 걷잡을 수 없듯, 평소에 쌓아둔 감정이 한 번에 폭발하면 주변이 당황할 수 있어. 감정을 적당히 표현하는 연습이 중요하네.',
  },
  '계': {
    metaphor: '바위를 뚫는 한 방울의 이슬',
    theme: '끈질긴 지혜의 소유자',
    strength: '물방울이 바위를 뚫듯, 겉으로는 조용하지만 끈기와 인내로 결국 목표를 달성하는 타입이야. 관찰력이 뛰어나고, 상황을 정확하게 읽어내거든.',
    weakness: '다만 물방울처럼 너무 조용하면 존재감이 희미해질 수 있어. 자기 성과를 드러내지 않다가 다른 사람에게 공을 빼앗기는 일이 생길 수 있으니, 적극적으로 어필하는 것도 필요하네.',
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
const TEN_GOD_MEANINGS: Record<string, { keyword: string; desc: string; career: string; relationship: string; scene: string }> = {
  '비견': {
    keyword: '독립·경쟁',
    desc: '나랑 같은 기운이라서, 독립심이랑 자존심이 강한 편이야.',
    career: '1인 기업, 프리랜서, 전문직처럼 독립적으로 성과를 내는 일이 잘 맞거든. 협업보다는 각자 영역을 존중하는 환경에서 빛나는 타입이야.',
    relationship: '연인이나 배우자한테도 자기만의 공간과 시간이 필요한 타입이야. 서로의 독립성을 존중하는 관계가 오래 가지.',
    scene: '팀 프로젝트보다 개인 과제에서 성과가 더 좋았던 경험이 있을 거야. 회의에서도 남의 의견에 고개를 끄덕이면서도 속으로는 "내 방식이 더 나은데" 하는 생각이 드는 타입이지.',
  },
  '겁재': {
    keyword: '추진·승부',
    desc: '추진력이랑 승부욕이 장난 아니게 강해.',
    career: '영업, 투자, 스타트업 같은 성과가 눈에 보이는 일에서 두각을 나타내거든. 근데 욕심이 과하면 리스크가 커지니까, 분산 투자랑 리스크 관리를 항상 염두에 둬야 해.',
    relationship: '열정적으로 다가가는 편인데, 상대한테 부담을 줄 수 있으니까 밀당의 균형을 잘 맞춰보게.',
    scene: '주변에 "대박 아이템 있는데 같이 해볼래?" 하고 말을 거는 사람이 있다면, 그게 바로 이 기운이야. 가만히 앉아 있으면 불안해서 뭐라도 벌이는 스타일이거든.',
  },
  '식신': {
    keyword: '풍요·콘텐츠',
    desc: '풍요랑 여유의 기운이라, 먹는 것도 즐기는 것도 좋아하는 타입이야.',
    career: 'F&B, 콘텐츠 크리에이터, 요리, 디자인 같은 감각을 살리는 분야가 딱이거든. 워라밸을 중시하고, 좋아하는 걸 직업으로 만들 때 가장 행복한 사람이야.',
    relationship: '같이 맛있는 거 먹고, 여행 다니고, 일상을 함께 즐기는 걸 중요하게 여기지. 편하고 따뜻한 관계를 만드는 스타일이야.',
    scene: '"식신"은 쉽게 말해 머릿속에 떠오른 생각을 뚝딱뚝딱 현실로 만들어내는 재주를 의미하거든. 아이디어를 현실로 바꾸는 능력이 탁월한데, 특히 맛집 찾기, 콘텐츠 기획, 여행 계획 같은 걸 시키면 눈이 반짝이는 타입이야.',
  },
  '상관': {
    keyword: '창의·혁신',
    desc: '지성이 날카롭고 창의력이 뛰어나.',
    career: '개발자, 디자이너, 작가, 기획자처럼 기존 틀을 깨는 일이 잘 맞거든. 반복 업무보다는 새로운 문제를 풀 때 에너지가 넘치는 타입이야.',
    relationship: '자기 표현이 강해서 때로는 말로 상처를 줄 수 있으니까, 솔직함이랑 배려 사이의 균형을 잘 잡아보게.',
    scene: '회사에서 "왜 우리 이렇게 하고 있죠? 이게 더 낫지 않아요?" 하고 기존 방식에 태클 거는 그 에너지야. 혁신가 기질이라 할 수 있지. 다만 윗사람 눈에는 "말 많은 신입"으로 보일 수도 있으니 주의하게.',
  },
  '편재': {
    keyword: '사교·재테크',
    desc: '활동적이고 사교적인 재물의 기운이야.',
    career: '프리랜서, 투잡, 부업처럼 여러 수입원을 관리하는 데 능하거든. 부동산, 주식 같은 재테크에도 감각이 있어서, 잘 활용하면 경제적 여유를 누릴 수 있어.',
    relationship: '인맥이 넓어서 다양한 만남이 있는데, 진짜 관계에 깊이를 더하는 노력이 좀 필요하지.',
    scene: '월급 하나에 만족 못 하고 퇴근 후에 쿠팡 파트너스도 해보고, 블로그 수익화도 알아보고, "같이 뭐 해볼까?" 하고 주변에 말 거는 타입이야.',
  },
  '정재': {
    keyword: '안정·저축',
    desc: '안정적이고 꾸준한 재물의 기운이야.',
    career: '대기업, 공기업, 금융권처럼 안정적인 조직에서 꾸준히 성장하는 타입이거든. 적금, 연금 같은 장기 재테크가 잘 맞아.',
    relationship: '안정적이고 헌신적인 파트너 스타일이야. 가정을 꾸리는 것에 대한 계획이 뚜렷하고, 경제적 기반을 중시하지.',
    scene: '"정재"는 땀 흘려 얻는 정당한 소득을 의미하거든. 월급날 바로 적금 넣고, 가계부 쓰는 그 알뜰한 에너지야. 묵묵히 성실하게 일해서 재물을 모으는 사람이지.',
  },
  '편관': {
    keyword: '리더십·도전',
    desc: '권위랑 통솔의 기운이 있어.',
    career: '관리직, 임원, 경찰, 군인처럼 조직을 이끄는 자리가 잘 맞거든. 위기 상황에서 결단력을 발휘하는데, 동료나 부하 직원 의견도 잘 듣는 리더십을 갖추면 더 좋아.',
    relationship: '상대를 보호하려는 마음이 강한데, 지나친 간섭은 갈등의 원인이 될 수 있으니까 주의하게.',
    scene: '"편관"은 쉽게 말해 나를 억압하는 힘, 즉 스트레스를 의미하거든. 24시간 비상 대기하는 군인처럼 긴장을 늦추지 못하는 에너지야. 이 기운이 강하면 책임감과 압박감을 동시에 느끼게 되지.',
  },
  '정관': {
    keyword: '명예·체계',
    desc: '명예랑 책임의 기운이야.',
    career: '공무원, 법조계, 대기업 관리직, 교수처럼 사회적 명예가 따르는 직업이 잘 맞거든. 규칙이랑 체계를 중시하고, 조직 안에서 신뢰를 착실히 쌓아가는 타입이야.',
    relationship: '책임감 있고 성실한 파트너야. 결혼하고 나면 가정에 대한 책임감이 더 강해지지.',
    scene: '매사에 "이건 원칙적으로 어떻게 되는 거지?" 하고 따지는 타입이야. 회식에서도 1차까지만 하고 집에 가는 사람, 보고서에 오타 하나까지 잡는 사람, 그게 정관의 에너지거든.',
  },
  '편인': {
    keyword: '비범·기술',
    desc: '사고가 독특하고 학문 쪽 기운이 있어.',
    career: '연구원, 개발자, 전문 기술직, 예술가처럼 남들과 다른 길 가는 데 두려움이 없거든. 자격증이나 특수 기술로 전문성을 인정받기 쉬운 타입이야.',
    relationship: '자기만의 세계가 뚜렷해서 상대가 이해하기 어려울 수 있으니까, 소통하는 데 좀 더 신경 써보게.',
    scene: '남들이 "왜 그런 걸 배워?" 하는 것에 몰두하는 타입이야. 유튜브 추천 알고리즘이 딴 사람이랑 완전히 다르고, 관심사가 독특해서 "이 사람은 뭐 하는 사람이야?" 소리를 듣곤 하지.',
  },
  '정인': {
    keyword: '학습·멘토',
    desc: '학문이랑 지혜의 기운이 가득해.',
    career: '교사, 교수, 컨설턴트, 코치처럼 지식을 나누는 일이 잘 맞거든. 자격증, 학위 같은 공부를 통한 커리어 향상이 잘 되는 타입이야.',
    relationship: '어른이나 멘토의 도움을 잘 받고, 관계에서도 배움이랑 성장을 중시하는 편이야.',
    scene: '새로운 분야에 관심이 생기면 책부터 사서 읽는 타입이야. 배움에 대한 욕구가 강해서 온라인 강의 수강 목록이 끝도 없거든. "아는 게 힘"이라는 말을 진심으로 믿는 사람이지.',
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

/** 오행 상생 관계 기반 서술 */
const ELEMENT_RELATION_DESC: Record<FiveElement, Record<FiveElement, string>> = {
  wood: {
    wood: '같은 목(木)끼리 만나니 숲이 울창해지는 형국이야. 기운은 넘치지만 다듬어주는 금(金)이 없으면 방향을 잃기 쉽지.',
    fire: '목생화(木生火) — 나무가 불에 생기를 불어넣는 구조야. 아이디어가 열정으로 활활 타오르는 형국이지.',
    earth: '목극토(木剋土) — 나무 뿌리가 흙을 뚫고 들어가는 것처럼, 추진력이 안정감을 흔드는 역학이 작용하고 있어.',
    metal: '금극목(金剋木) — 도끼가 나무를 찍는 것처럼, 외부의 압력이나 규칙이 그대를 억누르는 구조야.',
    water: '수생목(水生木) — 물이 나무를 키우듯, 지혜와 학습이 성장의 밑거름이 되는 좋은 구조야.',
  },
  fire: {
    wood: '목생화(木生火) — 나무가 불을 지펴주니 열정에 연료가 공급되는 형국이야.',
    fire: '같은 화(火)끼리 만나니 열기가 대단하지만, 연료(목)가 부족하면 금방 꺼질 수 있어.',
    earth: '화생토(火生土) — 불이 재를 만들어 땅을 비옥하게 하듯, 열정이 안정적인 성과로 이어지는 구조야.',
    metal: '화극금(火剋金) — 불이 쇠를 녹이듯, 열정이 기존 체계를 뒤흔드는 힘이 있어.',
    water: '수극화(水剋火) — 물이 불을 끄듯, 이성적 판단이 열정을 억누르는 갈등이 있을 수 있지.',
  },
  earth: {
    wood: '목극토(木剋土) — 나무가 흙의 양분을 빼앗듯, 변화의 기운이 안정을 흔드는 구조야.',
    fire: '화생토(火生土) — 불의 열기가 흙을 단단하게 만들듯, 열정이 안정감으로 굳어지는 형국이야.',
    earth: '같은 토(土)끼리 만나니 안정감은 최고지만, 변화에 둔감해질 수 있는 구조야.',
    metal: '토생금(土生金) — 땅에서 보석이 나오듯, 꾸준한 노력이 결실을 맺는 좋은 구조야.',
    water: '토극수(土剋水) — 흙이 물길을 막듯, 현실적 판단이 유연한 사고를 가로막을 수 있어.',
  },
  metal: {
    wood: '금극목(金剋木) — 도끼가 나무를 다듬듯, 결단력으로 성장을 정리하는 구조야.',
    fire: '화극금(火剋金) — 불이 쇠를 녹이듯, 열정적인 상황에서 내 원칙이 흔들릴 수 있어.',
    earth: '토생금(土生金) — 땅이 금을 품듯, 안정적인 환경에서 진가가 발휘되는 구조야.',
    metal: '같은 금(金)끼리 만나니 결단력은 넘치지만, 서로 부딪힐 때 불꽃이 튈 수 있어.',
    water: '금생수(金生水) — 쇠에서 이슬이 맺히듯, 결단이 지혜로 이어지는 좋은 구조야.',
  },
  water: {
    wood: '수생목(水生木) — 물이 나무를 키우듯, 그대의 지혜가 성장의 씨앗이 되는 구조야.',
    fire: '수극화(水剋火) — 물이 불을 끄듯, 냉철한 판단이 충동을 억제하는 힘이 있어.',
    earth: '토극수(土剋水) — 흙이 물을 가두듯, 현실적 제약이 유연함을 막는 구조야.',
    metal: '금생수(金生水) — 금속에서 물이 생기듯, 결단과 체계가 지혜를 더 날카롭게 만들지.',
    water: '같은 수(水)끼리 만나니 지혜는 넘치지만, 흐르기만 하고 멈추질 못해서 실행이 늦어질 수 있어.',
  },
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

/** 12운성 해석 */
const TWELVE_STAGE_DESC: Record<string, string> = {
  '장생': '새 생명이 탄생하는 기운이라, 시작하는 일마다 활력이 넘치는 시기야.',
  '목욕': '성장통의 시기라, 변화와 흔들림이 있지만 그만큼 단련되는 때야.',
  '관대': '관을 쓰고 세상에 나서는 기운이라, 사회적 인정을 받기 시작하는 시기지.',
  '건록': '가장 왕성하게 활동하는 전성기의 기운이야. 안정적인 수입과 성과가 따라오는 때야.',
  '제왕': '최고조에 달한 기운이라 넘치는 에너지가 있지만, 정점을 지나면 내리막이 올 수 있으니 겸손함이 필요해.',
  '쇠': '기운이 서서히 줄어드는 시기야. 무리하지 말고 안정을 취하면서 내실을 다지는 게 좋아.',
  '병': '에너지가 약해지는 시기라, 건강과 체력 관리에 신경 써야 해.',
  '사': '한 사이클이 마무리되는 시기야. 정리하고 새로운 준비를 하기에 좋은 때지.',
  '묘': '씨앗이 땅속에 묻히는 형국이라, 겉으로는 조용하지만 내면에서 새로운 변화가 싹트고 있어.',
  '절': '완전한 전환의 시기야. 과거와 단절하고 새로운 시작을 준비하는 때지.',
  '태': '새로운 생명이 잉태되는 기운이라, 가능성과 잠재력이 무궁무진한 시기야.',
  '양': '잉태된 생명이 자라나는 기운이라, 서서히 준비하면서 때를 기다리는 시기야.',
};

/** 현자의 한마디 — 일간 오행별 */
const SAGE_WORDS: Record<FiveElement, string[]> = {
  wood: [
    '나무는 뿌리가 깊어야 높이 자랄 수 있는 법이야. 그대의 뿌리를 단단히 내리게. 화려한 가지보다 보이지 않는 뿌리가 그대를 지탱해줄 것이니.',
    '숲에서 가장 큰 나무는 혼자 자란 게 아니야. 주변의 작은 나무들과 함께 바람을 막아낸 덕분이지. 그대도 곁에 있는 사람들을 소중히 여기게.',
  ],
  fire: [
    '불은 스스로 타오르지만, 연료가 없으면 꺼지는 법이야. 가끔은 멈춰 서서 자신을 돌보는 시간을 가지게. 그것이 더 오래 빛나는 비결일세.',
    '촛불 하나가 천 개의 촛불을 밝힐 수 있듯, 그대의 열정은 주변을 밝히는 힘이 있어. 다만 자신을 태우지 않도록 조심하게.',
  ],
  earth: [
    '대지는 모든 것을 품지만, 지진이 나면 그 힘이 가장 무서운 법이야. 평소 작은 감정들을 꾹꾹 눌러담지 말고, 조금씩 표현하는 연습을 하게.',
    '단단한 땅 아래에도 뜨거운 마그마가 흐르고 있듯, 그대 안에도 뜨거운 열정이 잠들어 있을세. 가끔은 그 열정을 깨워보게.',
  ],
  metal: [
    '좋은 칼은 천 번의 단련을 거치지만, 부러지지 않는 칼은 유연함을 아는 칼이야. 강함만 추구하지 말고, 때로는 구부러질 줄도 알아야 하네.',
    '금(金)은 불에 달궈져야 빛이 나는 법이야. 지금 힘든 시간이 있다면, 그건 그대를 더 빛나게 만드는 단련의 과정일세.',
  ],
  water: [
    '물은 낮은 곳으로 흐르지만, 결국 바다에 이르는 법이야. 지금 낮은 곳에 있다고 조급해하지 말게. 그대의 흐름은 반드시 넓은 바다로 이어지리라.',
    '강물처럼 멈추지 않고 흐르는 에너지와 지혜를 가지고 있으니, 스스로를 믿고 나아가게. 다만, 때로는 잠시 멈춰 서서 자신을 돌아보는 시간을 갖는 것도 잊지 말게나.',
  ],
};

/** 신살별 풍부한 해석 */
const SINSAL_DETAIL: Record<string, string> = {
  '역마살': '"역마살"은 쉽게 말해 가만히 있으면 몸이 근질근질한 에너지야. 출장이 잦거나 이직이 많을 수 있는데, 변화를 두려워하지 않는 그대의 강점이기도 하지.',
  '도화살': '"도화살"은 사람을 끌어당기는 매력의 기운이야. 이성에게 인기가 많고, 예술적 감각도 뛰어나거든. 다만 인간관계가 복잡해질 수 있으니 선을 잘 지키는 게 중요해.',
  '화개살': '"화개살"은 예술이랑 종교, 철학 쪽 기운이야. 깊이 생각하고 탐구하는 걸 좋아하는데, 혼자만의 시간이 꼭 필요한 타입이지.',
  '장성살': '"장성살"은 리더십의 기운이야. 조직에서 자연스럽게 윗자리로 올라가는 타입인데, 그만큼 책임도 무거워지지.',
  '반안살': '"반안살"은 안장에 올라탄 형국이라, 앉아서 일하는 것보다 돌아다니며 활동하는 게 잘 맞아.',
  '겁살': '"겁살"은 대담한 결단의 기운이야. 위기에 강한 편이지만, 너무 과감하면 리스크도 커지니 신중함을 잃지 말게.',
  '재살': '"재살"은 예기치 못한 변수의 기운이야. 갑작스러운 사고나 변화가 올 수 있으니 안전에 신경 쓰고, 보험도 잘 챙기게.',
  '천을귀인': '"천을귀인"은 어려울 때 도움을 주는 귀인이 나타나는 기운이야. 인복이 있는 편이니, 인간관계를 소중히 여기게.',
  '문창귀인': '"문창귀인"은 학문과 글의 기운이야. 시험, 자격증, 공부에서 좋은 결과를 얻기 쉬운 구조지.',
};

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

/** 오행 강약으로 행동 패턴 묘사 생성 */
function getElementBehaviorPattern(dominant: FiveElement, deficient: FiveElement): string {
  const patterns: Record<string, string> = {
    'wood-fire': '아이디어(木)는 넘치는데 그걸 밖으로 표현(火)하는 힘이 약해. 머릿속에선 이미 100가지를 생각했는데 막상 말로 꺼내면 3가지도 안 되는 타입이야.',
    'wood-earth': '성장(木)에 대한 욕구는 강한데 현실적 기반(土)이 약해. 이것저것 벌이다가 정작 수확은 못 하는 패턴을 조심해야 해.',
    'wood-metal': '성장(木)은 활발한데 가지치기(金)가 안 돼. 선택과 집중이 약해서, 여러 일을 동시에 벌이다 다 어중간해질 수 있어.',
    'wood-water': '행동(木)은 빠른데 깊이 생각(水)하는 게 부족해. 먼저 뛰어들고 나서 "이게 맞나?" 고민하는 패턴이 있을 수 있지.',
    'fire-wood': '열정(火)은 넘치는데 연료(木)가 부족해. 시작은 화끈하게 하지만 중간에 힘이 빠지는 경향이 있어.',
    'fire-earth': '열정(火)은 강한데 꾸준함(土)이 부족해. 불처럼 확 타올랐다가 재만 남는 패턴을 조심해야 하지.',
    'fire-metal': '열정(火)은 넘치는데 냉철한 판단(金)이 약해. 감정에 휩쓸려 결정하다가 후회하는 일이 생길 수 있어.',
    'fire-water': '열정(火)은 강한데 냉정한 분석(水)이 부족해. 직감은 좋은데 데이터로 검증하는 과정을 놓치기 쉬워.',
    'earth-wood': '안정(土)은 추구하는데 변화(木)에 대한 적응력이 약해. 익숙한 것만 고수하다 시대에 뒤처질 수 있어.',
    'earth-fire': '꾸준함(土)은 있는데 열정(火)이 부족해. 시키는 건 잘하는데, 스스로 불을 지피는 게 약하지.',
    'earth-metal': '안정(土)은 추구하는데 결단(金)이 늦어. 준비는 철저한데 "자, 시작!" 하는 타이밍을 놓치기 쉬워.',
    'earth-water': '현실감(土)은 있는데 유연성(水)이 부족해. 상황이 바뀌면 당황하고, 계획 변경을 싫어하는 타입이야.',
    'metal-wood': '결단(金)은 빠른데 성장(木)을 위한 인내가 부족해. 빨리 결과를 보려다 과정을 건너뛰는 경향이 있어.',
    'metal-fire': '결단(金)은 있는데 열정(火)이 약해. 논리적으로는 완벽한데, 사람을 움직이는 감정적 호소가 부족하지.',
    'metal-earth': '결단(金)은 빠른데 지구력(土)이 약해. 시작은 깔끔한데 오래 끌면 지치는 타입이야.',
    'metal-water': '결단(金)은 있는데 유연한 사고(水)가 부족해. 내 방식만 고집하다 더 좋은 방법을 놓칠 수 있어.',
    'water-wood': '생각(水)은 깊은데 실행(木)이 느려. 머릿속에선 다 정리했는데 몸이 안 따라가는 패턴이지.',
    'water-fire': '분석(水)은 잘하는데 표현(火)이 약해. 좋은 아이디어가 있어도 자기 안에 꾹꾹 눌러담게 되거든.',
    'water-earth': '유연함(水)은 있는데 현실 기반(土)이 약해. 이상은 높은데 실현 가능성을 따지는 게 부족할 수 있어.',
    'water-metal': '유연함(水)은 있는데 결단(金)이 약해. 이것도 괜찮고 저것도 나쁘진 않은데... 하면서 결정을 미루기 쉬워.',
  };

  const key = `${dominant}-${deficient}`;
  return patterns[key] || `${ELEMENT_NAMES[dominant].korean}(${ELEMENT_NAMES[dominant].hanja})의 기운은 넘치는데, ${ELEMENT_NAMES[deficient].korean}(${ELEMENT_NAMES[deficient].hanja})의 기운이 부족한 구조야.`;
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
  const yy = dm.yinYang === 'yang' ? '양' : '음';
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
      const third = sorted.length > 2 ? sorted[2][0] : null;
      const thirdInfo = third ? TEN_GOD_MEANINGS[third] : null;

      const behaviorPattern = getElementBehaviorPattern(fe.dominant, fe.deficient);
      const gongmangDesc = getGongmangDesc(saju);

      // 12운성 중 일지 운성 찾기
      const dayStage = saju.twelveStages.find(s => s.position === '일지');
      const dayStageDesc = dayStage ? TWELVE_STAGE_DESC[dayStage.stage] : '';

      // 신살 해석
      const sinsalDescs = saju.sinsals
        .map(s => SINSAL_DETAIL[s.name] || `"${s.name}"은 ${s.description}의 기운이야.`);

      // 오행 점수 문자열
      const elementScores = (['wood', 'fire', 'earth', 'metal', 'water'] as FiveElement[])
        .map(e => `${ELEMENT_NAMES[e].korean}(${ELEMENT_NAMES[e].hanja}): ${fe[e]}점`)
        .join(', ');

      return [
        `── 핵심 요약 ──`,
        '',
        `그대의 사주를 보니... ${metaphor ? `마치 ${metaphor.metaphor}과 같은 형국이로군.` : ''} ${dom.korean}(${dom.hanja})이 강하고 ${def.korean}(${def.hanja})이 약한 구조야. 오행 점수로 보면 ${elementScores}인데, 이 불균형이 그대의 삶 전반에 특징적인 패턴을 만들어내고 있지.`,
        '',
        `── 오행과 십성의 역학 ──`,
        '',
        `${dom.korean}(${dom.hanja})이 가장 강하게 작동하고 있으니, ${domP.modernDesc}`,
        '',
        behaviorPattern,
        '',
        `여기에 "${dominant}"의 기운이 가장 강하게 작동하고 있어. ${domInfo?.scene || domInfo?.desc || ''} ${ELEMENT_RELATION_DESC[el]?.[fe.dominant] || ''}`,
        '',
        ...(secInfo ? [`"${second}"의 기운도 같이 작용하고 있는데, ${secInfo.scene || secInfo.desc} 이 둘이 그대 안에서 서로 밀고 당기며 독특한 에너지를 만들어내고 있는 셈이지.`, ''] : []),
        ...(thirdInfo ? [`거기에 "${third}"도 한 자리 차지하고 있거든. ${thirdInfo.desc}`, ''] : []),
        `── 커리어·재물·관계 ──`,
        '',
        `이 사주 구조는 직장, 재물, 관계 모든 영역에서 비슷한 패턴을 만들어내지. ${domInfo?.career || ''}`,
        '',
        ...(occupation ? [`지금 하고 있는 "${occupation}"을 사주 관점에서 보면, "${dominant}"의 에너지가 이 일에 어떻게 발현되는지 한번 돌아보는 게 좋겠어.`, ''] : []),
        `재물적으로는 ${fe.metal > 0 || fe.earth > 0 ? '안정적인 수입을 얻을 수 있는 구조이지만' : '재물운이 불안정할 수 있는 구조인데'}, ${domInfo?.relationship || ''}`,
        '',
        ...(gongmangDesc ? [gongmangDesc, ''] : []),
        ...(dayStage ? [`일지의 12운성이 "${dayStage.stage}"인데, ${dayStageDesc}`, ''] : []),
        ...(sinsalDescs.length > 0 ? [...sinsalDescs, ''] : []),
        `── 균형과 개운 ──`,
        '',
        `그대에게 가장 필요한 건 ${def.korean}(${def.hanja})의 기운을 보충하는 것일세. ${ELEMENT_HEALTH[fe.deficient]}`,
        '',
        ELEMENT_LUCK_TIPS[fe.deficient],
        '',
        `오행의 균형을 맞추면서 "${dominant}"의 에너지를 잘 활용하는 게 핵심이야. 강한 오행은 그대의 무기고, 약한 오행은 의식적으로 보완할 부분이니까, 일상에서 꾸준히 실천해보게.`,
        '',
        `현자의 한마디: ${SAGE_WORDS[el][Math.floor(Math.random() * SAGE_WORDS[el].length)]}`,
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
