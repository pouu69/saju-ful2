'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTerminal } from './useTerminal';
import { useStreaming } from './useStreaming';
import { GamePhase, RoomId } from '@/lib/mud/types';
import { parseCommand } from '@/lib/mud/commandParser';
import { enterRoom, executeCommand, getExitLines } from '@/lib/mud/engine';
import { ROOMS } from '@/lib/mud/rooms';
import { calculateFullSaju } from '@/lib/saju/calculator';
import { generatePillarLines } from '@/components/saju/PillarDisplay';
import { generateLuckTimeline, generateSynthesisCard, ChartLine } from '@/components/saju/Charts';
import { BirthInfo, SajuResult, MaritalStatus, CalendarType } from '@/lib/saju/types';

const TITLE_ART_WIDE = [
  '',
  '         )(                                              )(',
  '        /||\\ ═══════════════════════════════════════════ /||\\',
  '         ||                                               ||',
  '         ||   甲  乙  丙  丁  戊  己  庚  辛  壬  癸     ||',
  '         ||                                               ||',
  '         ||          사  주  명  리  의    미  궁          ||',
  '         ||          四  柱  命  理  의    迷  宮          ||',
  '         ||                                               ||',
  '         ||           Labyrinth of Four Pillars            ||',
  '         ||                                               ||',
  '         ||   子  丑  寅  卯  辰  巳  午  未  申  酉  戌  亥',
  '        /||\\ ═══════════════════════════════════════════ /||\\',
  '         )(                                              )(',
  '',
  '              木 ─── 火 ─── 土 ─── 金 ─── 水      v2.0',
  '',
  '  오래된 동굴 입구... 횃불이 일렁이고,',
  '  벽면에 새겨진 천간과 지지의 문양이 희미하게 빛납니다.',
  '  백발의 현자가 향 연기 너머로 그대를 바라보고 있습니다.',
];

const TITLE_ART_NARROW = [
  '',
  '      )(                        )(',
  '     /||\\ ════════════════════ /||\\',
  '      ||                        ||',
  '      || 甲乙丙丁戊己庚辛壬癸  ||',
  '      ||                        ||',
  '      ||  사 주 명 리 의 미 궁  ||',
  '      ||  四 柱 命 理 의 迷 宮  ||',
  '      ||                        ||',
  '      ||  Labyrinth of Pillars  ||',
  '      ||                        ||',
  '      || 子丑寅卯辰巳午未申酉  ||',
  '     /||\\ ════════════════════ /||\\',
  '      )(                        )(',
  '',
  '    木──火──土──金──水    v2.0',
  '',
  '  오래된 동굴 입구...',
  '  횃불이 일렁이고,',
  '  천간과 지지의 문양이',
  '  희미하게 빛납니다.',
  '  현자가 그대를 바라봅니다.',
];

// 이전 단계 롤백 매핑 (모듈 레벨 상수)
const PREV_PHASE_MAP: Record<string, GamePhase> = {
  date: 'name',
  calendar: 'date',
  time: 'calendar',
  gender: 'time',
  marriage: 'gender',
  partner_date: 'partner_name',
  partner_calendar: 'partner_date',
  partner_time: 'partner_calendar',
  partner_gender: 'partner_time',
};

const PHASE_PROMPTS: Record<string, string> = {
  name: '현자: "그대의 이름이 무엇인가?"',
  date: '현자: "생년월일을 알려주시오. (예: 1990-03-15)"',
  calendar: '현자: "양력인가, 음력인가? (양력/음력, 엔터 시 양력)"',
  time: '현자: "태어난 시간은? (예: 14:30, 모르면 \'모름\')"',
  gender: '현자: "성별은? (남/여)"',
  marriage: '현자: "혼인 여부를 알려주시오. (미혼/기혼/기타)"',
  partner_name: '현자: "상대방의 이름을 알려주시오."',
  partner_date: '현자: "상대방의 생년월일은? (예: 1992-05-20)"',
  partner_calendar: '현자: "양력인가, 음력인가? (양력/음력, 엔터 시 양력)"',
  partner_time: '현자: "상대방이 태어난 시간은? (예: 08:00, 모르면 \'모름\')"',
  partner_gender: '현자: "상대방의 성별은? (남/여)"',
};

/** 성별 문자열 파싱 */
function parseGender(s: string): 'male' | 'female' | null {
  const g = s.toLowerCase();
  if (g === '남' || g === '남자' || g === 'male' || g === 'm') return 'male';
  if (g === '여' || g === '여자' || g === 'female' || g === 'f') return 'female';
  return null;
}

/** 달력 유형 문자열 파싱 (빈 문자열은 양력 기본값) */
function parseCalendar(s: string): CalendarType | null {
  const c = s.trim();
  if (c === '' || c === '양력' || c === 'solar') return 'solar';
  if (c === '음력' || c === 'lunar') return 'lunar';
  return null;
}

/** 결혼 상태 문자열 파싱 */
function parseMarital(s: string): MaritalStatus | null {
  const m = s.trim();
  if (m === '미혼' || m === '싱글' || m === 'single') return 'single';
  if (m === '기혼' || m === '결혼' || m === 'married') return 'married';
  if (m === '기타' || m === 'etc') return 'etc';
  return null;
}

/**
 * 부분 파싱: 토큰을 순서대로 소비하면서 가능한 만큼 birthInfo를 채운다.
 * 순서: 이름 생년월일 시간 성별 직업 결혼
 * 예: "홍길동 1990-03-15 14:30 남 개발자 미혼" → 모두 채움
 * 예: "홍길동 1990-03-15 14:30" → 이름/날짜/시간만 채움
 * 예: "홍길동" → 이름만 채움
 */
function parsePartial(input: string): Partial<BirthInfo> {
  const tokens = input.trim().split(/\s+/);
  if (tokens.length === 0) return {};

  const result: Partial<BirthInfo> = {};
  let idx = 0;

  // 1. 이름: 날짜 형식이 아닌 첫 토큰
  const firstToken = tokens[idx];
  if (!firstToken.match(/^\d{4}[-./]/)) {
    result.name = firstToken;
    idx++;
  }

  // 2. 생년월일
  if (idx < tokens.length) {
    const dateMatch = tokens[idx].match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})$/);
    if (dateMatch) {
      result.year = parseInt(dateMatch[1]);
      result.month = parseInt(dateMatch[2]);
      result.day = parseInt(dateMatch[3]);
      idx++;
    } else {
      return result; // 날짜가 아니면 여기서 중단
    }
  }

  // 3. 달력 유형 (양력/음력) — 선택사항, 미입력 시 양력
  if (idx < tokens.length) {
    const cal = parseCalendar(tokens[idx]);
    if (cal) {
      result.calendarType = cal;
      idx++;
    } else {
      result.calendarType = 'solar'; // 기본값 양력
    }
  }

  // 4. 시간
  if (idx < tokens.length) {
    const t = tokens[idx];
    if (t === '모름' || t.toLowerCase() === 'unknown') {
      result.hour = null;
      result.minute = 0;
      idx++;
    } else {
      const timeMatch = t.match(/^(\d{1,2}):(\d{2})$/);
      if (timeMatch) {
        result.hour = parseInt(timeMatch[1]);
        result.minute = parseInt(timeMatch[2]);
        idx++;
      } else if (t.match(/^\d{1,2}$/)) {
        // 시간만 입력 (예: "14")
        result.hour = parseInt(t);
        result.minute = 0;
        idx++;
      } else {
        // 시간이 아닌 토큰 → 성별일 수 있으니 넘김
      }
    }
  }

  // 4. 성별
  if (idx < tokens.length) {
    const g = parseGender(tokens[idx]);
    if (g) {
      result.gender = g;
      idx++;
    } else {
      return result;
    }
  }

  // 5. 결혼상태
  if (idx < tokens.length) {
    const marital = parseMarital(tokens[idx]);
    if (marital) {
      result.maritalStatus = marital;
    }
  }

  return result;
}

/** birthInfo에서 아직 채워지지 않은 첫 phase를 반환 */
function getNextMissingPhase(info: Partial<BirthInfo>): GamePhase {
  if (!info.name) return 'name';
  if (info.year === undefined) return 'date';
  if (!info.calendarType) return 'calendar';
  // hour: undefined = 미입력, null = "모름" (채워진 상태)
  if (info.hour === undefined && !('hour' in info)) return 'time';
  if (!info.gender) return 'gender';
  if (!info.maritalStatus) return 'marriage';
  return 'exploring';
}

/** 상대방 birthInfo에서 아직 채워지지 않은 첫 partner_ phase 반환 */
function getNextPartnerPhase(info: Partial<BirthInfo>): GamePhase {
  if (!info.name) return 'partner_name';
  if (info.year === undefined) return 'partner_date';
  if (!info.calendarType) return 'partner_calendar';
  if (info.hour === undefined && !('hour' in info)) return 'partner_time';
  if (!info.gender) return 'partner_gender';
  return 'exploring'; // 모두 채워짐
}

export function useGame() {
  const { lines, addLine, addLines, appendToLine, clear } = useTerminal();
  const { isStreaming, streamInterpretation } = useStreaming();

  const phaseRef = useRef<GamePhase>('intro');
  const [phase, setPhaseState] = useState<GamePhase>('intro');
  const currentRoomRef = useRef<RoomId>('entrance');
  const [, forceRender] = useState(0);
  const sajuRef = useRef<SajuResult | null>(null);
  const birthInfoRef = useRef<Partial<BirthInfo>>({});
  const partnerInfoRef = useRef<Partial<BirthInfo>>({});
  const partnerSajuRef = useRef<SajuResult | null>(null);
  const aiCacheRef = useRef<Record<string, string>>({});

  const setPhase = useCallback((p: GamePhase) => {
    phaseRef.current = p;
    setPhaseState(p);
  }, []);

  const setCurrentRoom = useCallback((r: RoomId) => {
    currentRoomRef.current = r;
    forceRender(n => n + 1);
  }, []);

  const showExits = useCallback((roomId: RoomId) => {
    const exitLines = getExitLines(roomId);
    for (const line of exitLines) {
      addLine(line.text, line.type as 'text', { color: line.color });
    }
  }, [addLine]);

  const triggerAi = useCallback((roomId: RoomId) => {
    if (!sajuRef.current) return;

    // 캐시된 AI 응답이 있으면 바로 출력
    const cached = aiCacheRef.current[roomId];
    if (cached) {
      addLine('');
      addLine(cached, 'streaming');
      showExits(roomId);
      return;
    }

    // 새 요청: 스트리밍하면서 캐시에 축적
    addLine('');
    const streamLineId = addLine('', 'streaming');
    let fullText = '';

    streamInterpretation(
      roomId,
      sajuRef.current,
      (chunk) => {
        fullText += chunk;
        appendToLine(streamLineId, chunk);
      },
      () => {
        aiCacheRef.current[roomId] = fullText;
        showExits(roomId);
      },
      (error) => {
        addLine(`  오류: ${error}`, 'error');
        showExits(roomId);
      },
      roomId === 'compatibility' ? partnerSajuRef.current : undefined,
    );
  }, [addLine, appendToLine, streamInterpretation, showExits]);

  const moveToRoom = useCallback((roomId: RoomId) => {
    clear();
    setCurrentRoom(roomId);
    const result = enterRoom(roomId);

    for (const line of result.lines) {
      addLine(line.text, line.type as 'text', { color: line.color });
    }

    // 사주 테이블 표시 (궁합의 방은 상대방 입력이 먼저이므로 제외)
    if (sajuRef.current && roomId !== 'compatibility') {
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

      const pillarLines = generatePillarLines(sajuRef.current, isMobile) as ChartLine[];
      for (const line of pillarLines) {
        addLine(line.text, 'ascii', { color: line.color || 'text-yellow-300' });
      }

      // 방별 추가 차트 표시
      let chartLines: ChartLine[] = [];
      switch (roomId) {
        case 'luck':
          chartLines = generateLuckTimeline(sajuRef.current);
          break;
        case 'synthesis':
          chartLines = generateSynthesisCard(sajuRef.current, isMobile);
          break;
      }
      for (const line of chartLines) {
        addLine(line.text, 'ascii', { color: line.color || 'text-yellow-300' });
      }
    }

    if (roomId === 'compatibility') {
      // 궁합의 방: 상대방 정보 입력 모드로 전환
      partnerInfoRef.current = {};
      partnerSajuRef.current = null;
      aiCacheRef.current['compatibility'] = ''; // 캐시 초기화
      setPhase('partner_name');
    } else if (result.requestAi) {
      triggerAi(roomId);
    } else {
      showExits(roomId);
    }
  }, [clear, addLine, addLines, triggerAi, showExits, setCurrentRoom, setPhase]);

  const calculateAndStart = useCallback((info: BirthInfo) => {
    addLine('', 'text');
    addLine('  현자가 눈을 감고 사주를 읽기 시작합니다...', 'system');
    addLine('', 'text');

    try {
      const saju = calculateFullSaju(info);
      sajuRef.current = saju;
      setPhase('exploring');
      moveToRoom('synthesis');
    } catch {
      addLine('  사주 계산 중 오류가 발생했습니다. 날짜를 확인해주세요.', 'error');
      addLine('  현자: "다시 생년월일을 알려주시오. (예: 1990-03-15)"', 'system');
      setPhase('date');
      birthInfoRef.current = { name: birthInfoRef.current.name };
    }
  }, [addLine, setPhase, moveToRoom]);

  const startGame = useCallback(() => {
    clear();
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    addLines(isMobile ? TITLE_ART_NARROW : TITLE_ART_WIDE, 'ascii', 'text-[#c4943a]');
    addLine('', 'text');
    addLine('  현자: "그대의 정보를 알려주시오."', 'system');
    addLine('', 'text');
    addLine('  한 줄 입력: 이름 생년월일 [양력/음력] 시간 성별 결혼', 'text');
    addLine('  예) 홍길동 1990-03-15 14:30 남 미혼', 'text');
    addLine('  예) 홍길동 1990.3.15 음력 모름 여 기혼', 'text');
    addLine('', 'text');
    addLine('  또는 이름만 입력하면 하나씩 물어봅니다.', 'text');
    setPhase('name');
    setCurrentRoom('entrance');
    sajuRef.current = null;
    birthInfoRef.current = {};
    aiCacheRef.current = {};
  }, [clear, addLines, addLine, setPhase, setCurrentRoom]);

  const handleCommand = useCallback((input: string) => {
    addLine(`  > ${input}`, 'input');
    const currentPhase = phaseRef.current;
    const currentRoom = currentRoomRef.current;

    // "이전" 명령: 입력 단계 롤백
    const isBack = input === '이전' || input === '뒤로' || input.toLowerCase() === 'back';
    if (isBack && currentPhase === 'partner_name') {
      // 궁합의 방에서 첫 단계에서 뒤로 → 동굴로 복귀
      setPhase('exploring');
      moveToRoom('synthesis');
      return;
    }
    if (isBack && currentPhase !== 'name' && currentPhase !== 'exploring') {
      const prev = PREV_PHASE_MAP[currentPhase];
      if (prev) {
        addLine('', 'text');
        addLine(`  ${PHASE_PROMPTS[prev]}`, 'system');
        addLine('  (이전 단계로 돌아갑니다)', 'text');
        setPhase(prev);
        return;
      }
    }

    switch (currentPhase) {
      case 'name': {
        // 부분 파싱: 가능한 만큼 채운다
        const parsed = parsePartial(input);
        birthInfoRef.current = { ...birthInfoRef.current, ...parsed };

        const nextPhase = getNextMissingPhase(birthInfoRef.current);
        if (nextPhase === 'exploring') {
          // 모두 채워짐 → 바로 사주 계산
          calculateAndStart(birthInfoRef.current as BirthInfo);
          break;
        }

        // 누락된 첫 필드로 이동
        addLine('', 'text');
        if (Object.keys(parsed).length > 1) {
          // 2개 이상 인식됨 → 어디까지 됐는지 알려주기
          const filled: string[] = [];
          if (parsed.name) filled.push(`이름: ${parsed.name}`);
          if (parsed.year !== undefined) filled.push(`생년월일: ${parsed.year}-${parsed.month}-${parsed.day}`);
          if (parsed.calendarType) filled.push(`달력: ${parsed.calendarType === 'solar' ? '양력' : '음력'}`);
          if (parsed.hour !== undefined || parsed.hour === null) filled.push(`시간: ${parsed.hour === null ? '모름' : `${parsed.hour}:${String(parsed.minute || 0).padStart(2, '0')}`}`);
          if (parsed.gender) filled.push(`성별: ${parsed.gender === 'male' ? '남' : '여'}`);
          if (parsed.maritalStatus) filled.push(`결혼: ${parsed.maritalStatus === 'single' ? '미혼' : parsed.maritalStatus === 'married' ? '기혼' : '기타'}`);
          addLine(`  인식됨: ${filled.join(' · ')}`, 'text');
        }
        addLine(`  ${PHASE_PROMPTS[nextPhase]}`, 'system');
        setPhase(nextPhase);
        break;
      }

      case 'date': {
        const match = input.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})$/);
        if (!match) {
          addLine('  형식이 올바르지 않습니다. (예: 1990-03-15)', 'error');
          return;
        }
        birthInfoRef.current.year = parseInt(match[1]);
        birthInfoRef.current.month = parseInt(match[2]);
        birthInfoRef.current.day = parseInt(match[3]);
        addLine('', 'text');
        addLine(`  ${PHASE_PROMPTS['calendar']}`, 'system');
        setPhase('calendar');
        break;
      }

      case 'calendar': {
        const cal = parseCalendar(input);
        if (!cal) {
          addLine('  양력 또는 음력을 입력해주세요.', 'error');
          return;
        }
        birthInfoRef.current.calendarType = cal;
        addLine('', 'text');
        addLine('  현자: "태어난 시간은? (예: 14:30, 모르면 \'모름\')"', 'system');
        setPhase('time');
        break;
      }

      case 'time': {
        if (input === '모름' || input.toLowerCase() === 'unknown') {
          birthInfoRef.current.hour = null;
          birthInfoRef.current.minute = 0;
        } else {
          const match = input.match(/^(\d{1,2}):?(\d{2})?$/);
          if (!match) {
            addLine('  형식이 올바르지 않습니다. (예: 14:30 또는 모름)', 'error');
            return;
          }
          birthInfoRef.current.hour = parseInt(match[1]);
          birthInfoRef.current.minute = match[2] ? parseInt(match[2]) : 0;
        }
        addLine('', 'text');
        addLine('  현자: "성별은? (남/여)"', 'system');
        setPhase('gender');
        break;
      }

      case 'gender': {
        const g = input.toLowerCase();
        if (g === '남' || g === '남자' || g === 'male' || g === 'm') {
          birthInfoRef.current.gender = 'male';
        } else if (g === '여' || g === '여자' || g === 'female' || g === 'f') {
          birthInfoRef.current.gender = 'female';
        } else {
          addLine('  남 또는 여를 입력해주세요.', 'error');
          return;
        }
        addLine('', 'text');
        addLine('  현자: "혼인 여부를 알려주시오. (미혼/기혼/기타)"', 'system');
        setPhase('marriage');
        break;
      }

      case 'marriage': {
        const marital = parseMarital(input);
        if (!marital) {
          addLine('  미혼, 기혼, 기타 중 하나를 입력해주세요.', 'error');
          return;
        }
        birthInfoRef.current.maritalStatus = marital;
        calculateAndStart(birthInfoRef.current as BirthInfo);
        break;
      }

      case 'partner_name': {
        // 한 줄 파싱: 가능한 만큼 채운다 (이름 날짜 시간 성별)
        const partnerParsed = parsePartial(input);
        partnerInfoRef.current = { ...partnerInfoRef.current, ...partnerParsed };
        // 상대방은 결혼 상태 불필요 → 기본값 설정
        if (!partnerInfoRef.current.maritalStatus && partnerInfoRef.current.gender) {
          partnerInfoRef.current.maritalStatus = 'etc';
        }

        const nextPartnerPhase = getNextPartnerPhase(partnerInfoRef.current);
        if (nextPartnerPhase === 'exploring') {
          // 모두 채워짐 → 바로 궁합 계산
          addLine('', 'text');
          addLine('  현자가 두 사람의 사주를 나란히 펼칩니다...', 'system');
          addLine('', 'text');
          try {
            const partnerSaju = calculateFullSaju(partnerInfoRef.current as BirthInfo);
            partnerSajuRef.current = partnerSaju;
            setPhase('exploring');
            triggerAi('compatibility');
          } catch {
            addLine('  상대방의 사주 계산 중 오류가 발생했습니다.', 'error');
            addLine(`  ${PHASE_PROMPTS['partner_date']}`, 'system');
            partnerInfoRef.current = { name: partnerInfoRef.current.name };
            setPhase('partner_date');
          }
          break;
        }

        // 누락된 첫 필드로 이동
        addLine('', 'text');
        if (Object.keys(partnerParsed).length > 1) {
          const filled: string[] = [];
          if (partnerParsed.name) filled.push(`이름: ${partnerParsed.name}`);
          if (partnerParsed.year !== undefined) filled.push(`생년월일: ${partnerParsed.year}-${partnerParsed.month}-${partnerParsed.day}`);
          if (partnerParsed.calendarType) filled.push(`달력: ${partnerParsed.calendarType === 'solar' ? '양력' : '음력'}`);
          if (partnerParsed.hour !== undefined || partnerParsed.hour === null) filled.push(`시간: ${partnerParsed.hour === null ? '모름' : `${partnerParsed.hour}:${String(partnerParsed.minute || 0).padStart(2, '0')}`}`);
          if (partnerParsed.gender) filled.push(`성별: ${partnerParsed.gender === 'male' ? '남' : '여'}`);
          addLine(`  인식됨: ${filled.join(' · ')}`, 'text');
        }
        addLine(`  ${PHASE_PROMPTS[nextPartnerPhase]}`, 'system');
        setPhase(nextPartnerPhase);
        break;
      }

      case 'partner_date': {
        const match = input.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})$/);
        if (!match) {
          addLine('  형식이 올바르지 않습니다. (예: 1992-05-20)', 'error');
          return;
        }
        partnerInfoRef.current.year = parseInt(match[1]);
        partnerInfoRef.current.month = parseInt(match[2]);
        partnerInfoRef.current.day = parseInt(match[3]);
        addLine('', 'text');
        addLine(`  ${PHASE_PROMPTS['partner_calendar']}`, 'system');
        setPhase('partner_calendar');
        break;
      }

      case 'partner_calendar': {
        const cal = parseCalendar(input);
        if (!cal) {
          addLine('  양력 또는 음력을 입력해주세요.', 'error');
          return;
        }
        partnerInfoRef.current.calendarType = cal;
        addLine('', 'text');
        addLine(`  ${PHASE_PROMPTS['partner_time']}`, 'system');
        setPhase('partner_time');
        break;
      }

      case 'partner_time': {
        if (input === '모름' || input.toLowerCase() === 'unknown') {
          partnerInfoRef.current.hour = null;
          partnerInfoRef.current.minute = 0;
        } else {
          const match = input.match(/^(\d{1,2}):?(\d{2})?$/);
          if (!match) {
            addLine('  형식이 올바르지 않습니다. (예: 08:00 또는 모름)', 'error');
            return;
          }
          partnerInfoRef.current.hour = parseInt(match[1]);
          partnerInfoRef.current.minute = match[2] ? parseInt(match[2]) : 0;
        }
        addLine('', 'text');
        addLine(`  ${PHASE_PROMPTS['partner_gender']}`, 'system');
        setPhase('partner_gender');
        break;
      }

      case 'partner_gender': {
        const g = parseGender(input);
        if (!g) {
          addLine('  남 또는 여를 입력해주세요.', 'error');
          return;
        }
        partnerInfoRef.current.gender = g;
        partnerInfoRef.current.maritalStatus = 'etc';

        addLine('', 'text');
        addLine('  현자가 두 사람의 사주를 나란히 펼칩니다...', 'system');
        addLine('', 'text');

        try {
          const partnerSaju = calculateFullSaju(partnerInfoRef.current as BirthInfo);
          partnerSajuRef.current = partnerSaju;
          setPhase('exploring');
          triggerAi('compatibility');
        } catch {
          addLine('  상대방의 사주 계산 중 오류가 발생했습니다. 날짜를 확인해주세요.', 'error');
          addLine(`  ${PHASE_PROMPTS['partner_date']}`, 'system');
          partnerInfoRef.current = { name: partnerInfoRef.current.name };
          setPhase('partner_date');
        }
        break;
      }

      case 'exploring': {
        const room = ROOMS[currentRoom];
        const command = parseCommand(input, room.exits);

        if (command.type === 'restart') {
          startGame();
          return;
        }

        const result = executeCommand(command, currentRoom);

        if (result.newRoom && result.newRoom !== currentRoom) {
          // 방 이동: moveToRoom이 방 설명 + AI + 출구를 처리
          moveToRoom(result.newRoom);
        } else {
          // 이동 아닌 커맨드 (help, look, unknown 등): 결과만 출력
          for (const line of result.lines) {
            addLine(line.text, line.type as 'text', { color: line.color });
          }
        }
        break;
      }

      default:
        startGame();
    }
  }, [addLine, setPhase, moveToRoom, startGame]);

  /** 현재 방의 AI 풀이 텍스트를 클립보드에 복사 */
  const copyCurrentRoom = useCallback(async (): Promise<boolean> => {
    const roomId = currentRoomRef.current;
    const cached = aiCacheRef.current[roomId];
    if (!cached) return false;

    const room = ROOMS[roomId];
    const header = `── ${room?.name || roomId} ──`;
    const text = `${header}\n\n${cached}`;
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }, []);

  /** 모든 방의 AI 풀이를 .txt 파일로 다운로드 */
  const exportAll = useCallback(async (): Promise<boolean> => {
    const name = birthInfoRef.current.name || '사주 풀이';
    const bi = birthInfoRef.current;
    const dateStr = bi.year ? `${bi.year}년 ${bi.month}월 ${bi.day}일` : '';
    const genderStr = bi.gender === 'male' ? '남' : bi.gender === 'female' ? '여' : '';

    const sections: string[] = [];
    sections.push(`═══ ${name}의 사주 풀이 ═══`);
    if (dateStr) sections.push(`생년월일: ${dateStr} ${genderStr}`);
    sections.push(`풀이 일시: ${new Date().toLocaleDateString('ko-KR')}`);
    sections.push('');

    const roomOrder: RoomId[] = ['synthesis', 'detail', 'luck', 'compatibility'];
    let hasContent = false;
    for (const rid of roomOrder) {
      const cached = aiCacheRef.current[rid];
      if (!cached) continue;
      hasContent = true;
      const room = ROOMS[rid];
      sections.push(`\n── ${room?.name || rid} ──\n`);
      sections.push(cached);
    }

    if (!hasContent) return false;

    sections.push('\n\n─────────────────────────────');
    sections.push('사주명리의 미궁 — Labyrinth of Four Pillars');

    const fullText = sections.join('\n');
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}_사주풀이_${new Date().toISOString().slice(0, 10)}.txt`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  }, []);

  /** 현재 방에 AI 캐시가 있는지 */
  const hasAiContent = !!aiCacheRef.current[currentRoomRef.current];

  return {
    lines,
    handleCommand,
    startGame,
    isStreaming,
    phase,
    userName: birthInfoRef.current.name || undefined,
    roomName: ROOMS[currentRoomRef.current]?.name || undefined,
    currentRoom: currentRoomRef.current,
    copyCurrentRoom,
    exportAll,
    hasAiContent,
  };
}
