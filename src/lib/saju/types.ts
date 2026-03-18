// 오행 (Five Elements)
export type FiveElement = 'wood' | 'fire' | 'earth' | 'metal' | 'water';

// 음양
export type YinYang = 'yang' | 'yin';

// 천간 (Heavenly Stem)
export interface HeavenlyStem {
  index: number;       // 0-9
  korean: string;      // 갑, 을, 병, 정, 무, 기, 경, 신, 임, 계
  hanja: string;       // 甲, 乙, 丙, 丁, 戊, 己, 庚, 辛, 壬, 癸
  element: FiveElement;
  yinYang: YinYang;
}

// 지지 (Earthly Branch)
export interface EarthlyBranch {
  index: number;       // 0-11
  korean: string;      // 자, 축, 인, 묘, 진, 사, 오, 미, 신, 유, 술, 해
  hanja: string;       // 子, 丑, 寅, 卯, 辰, 巳, 午, 未, 申, 酉, 戌, 亥
  element: FiveElement;
  yinYang: YinYang;
  animal: string;      // 쥐, 소, 호랑이, ...
}

// 기둥 (Pillar)
export interface Pillar {
  stem: HeavenlyStem;
  branch: EarthlyBranch;
  ganjiKorean: string;   // e.g., "경오"
  ganjiHanja: string;    // e.g., "庚午"
}

// 십성 (Ten Gods)
export type TenGodName =
  | '비견' | '겁재'     // 비겁 (같은 오행)
  | '식신' | '상관'     // 식상 (내가 생하는)
  | '편재' | '정재'     // 재성 (내가 극하는)
  | '편관' | '정관'     // 관성 (나를 극하는)
  | '편인' | '정인';    // 인성 (나를 생하는)

export interface TenGodEntry {
  name: TenGodName;
  position: string;    // "연간", "월간", "시간", "연지", "월지", "일지", "시지"
  stem: HeavenlyStem;
}

// 오행 균형
export interface FiveElementBalance {
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  water: number;
  dominant: FiveElement;
  deficient: FiveElement;
}

// 대운 (Major Luck Cycle)
export interface LuckCycle {
  startAge: number;
  endAge: number;
  pillar: Pillar;
}

// 세운 (Yearly Luck)
export interface YearlyLuck {
  year: number;
  pillar: Pillar;
}

// 12운성 (Twelve Life Stages)
export type TwelveStage =
  | '장생' | '목욕' | '관대' | '건록' | '제왕'
  | '쇠' | '병' | '사' | '묘' | '절'
  | '태' | '양';

// 12운성 결과 (각 기둥별)
export interface TwelveStageEntry {
  position: string;  // "연지", "월지", "일지", "시지"
  stage: TwelveStage;
}

// 신살 (Special Indicators)
export interface Sinsal {
  name: string;      // 역마살, 도화살 등
  description: string;
  branches: string[]; // 해당하는 지지들
}

// 공망 (Empty/Void)
export interface Gongmang {
  branches: string[];  // 공망에 해당하는 지지 2개
  affectedPillars: string[]; // 공망이 걸린 기둥 위치
}

// 성별
export type Gender = 'male' | 'female';

// 결혼 상태
export type MaritalStatus = 'single' | 'married' | 'etc';

// 사주 계산 입력
export interface BirthInfo {
  name: string;
  year: number;
  month: number;
  day: number;
  hour: number | null;   // null = 모름
  minute: number;
  gender: Gender;
  occupation: string;        // 직업 (자유 입력)
  maritalStatus: MaritalStatus;  // 결혼 유무
}

// 사주 전체 결과
export interface SajuResult {
  birthInfo: BirthInfo;
  yearPillar: Pillar;
  monthPillar: Pillar;
  dayPillar: Pillar;
  hourPillar: Pillar | null;  // null if hour unknown
  dayMaster: HeavenlyStem;
  fiveElements: FiveElementBalance;
  tenGods: TenGodEntry[];
  twelveStages: TwelveStageEntry[];
  sinsals: Sinsal[];
  gongmang: Gongmang;
  luckCycles: LuckCycle[];
  yearlyLuck: YearlyLuck;
}
