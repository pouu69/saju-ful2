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
import { generateElementChart, generateTenGodsChart, generateLuckTimeline, generateSynthesisCard } from '@/components/saju/Charts';
import { BirthInfo, SajuResult } from '@/lib/saju/types';

const TITLE_ART = [
  '',
  '  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
  '  ☰                                                        ☷',
  '        사 주 명 리 의  미 궁   ·   四 柱 命 理 迷 宮',
  '            Labyrinth  of  Four  Pillars    v1.0',
  '  ☲                                                        ☱',
  '  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
  '',
  '  어둠 속, 백발의 현자가 동굴 입구에서 기다리고 있습니다...',
];

export function useGame() {
  const { lines, addLine, addLines, appendToLine, clear } = useTerminal();
  const { isStreaming, streamInterpretation } = useStreaming();

  const phaseRef = useRef<GamePhase>('intro');
  const [phase, setPhaseState] = useState<GamePhase>('intro');
  const currentRoomRef = useRef<RoomId>('entrance');
  const [, forceRender] = useState(0);
  const sajuRef = useRef<SajuResult | null>(null);
  const birthInfoRef = useRef<Partial<BirthInfo>>({});
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
    );
  }, [addLine, appendToLine, streamInterpretation, showExits]);

  const moveToRoom = useCallback((roomId: RoomId) => {
    setCurrentRoom(roomId);
    const result = enterRoom(roomId);

    for (const line of result.lines) {
      addLine(line.text, line.type as 'text', { color: line.color });
    }

    // 각 방별 시각적 차트 표시
    if (sajuRef.current) {
      let chartLines: string[] = [];
      switch (roomId) {
        case 'cave':
          chartLines = generatePillarLines(sajuRef.current);
          break;
        case 'elements':
          chartLines = generateElementChart(sajuRef.current);
          break;
        case 'tenGods':
          chartLines = generateTenGodsChart(sajuRef.current);
          break;
        case 'luck':
          chartLines = generateLuckTimeline(sajuRef.current);
          break;
        case 'synthesis':
          chartLines = generateSynthesisCard(sajuRef.current);
          break;
      }
      if (chartLines.length > 0) {
        addLines(chartLines, 'ascii', 'text-yellow-300');
      }
    }

    if (result.requestAi) {
      triggerAi(roomId);
    } else {
      showExits(roomId);
    }
  }, [addLine, addLines, triggerAi, showExits, setCurrentRoom]);

  const startGame = useCallback(() => {
    clear();
    addLines(TITLE_ART, 'ascii', 'text-[#00cccc]');
    addLine('', 'text');
    addLine('  현자: "그대의 이름이 무엇인가?"', 'system');
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
    if (isBack && currentPhase !== 'name' && currentPhase !== 'exploring') {
      const prevPhase: Record<string, GamePhase> = {
        date: 'name',
        time: 'date',
        gender: 'time',
      };
      const prev = prevPhase[currentPhase];
      if (prev) {
        const prompts: Record<string, string> = {
          name: '현자: "그대의 이름이 무엇인가?"',
          date: '현자: "생년월일을 알려주시오. (예: 1990-03-15)"',
          time: '현자: "태어난 시간은? (예: 14:30, 모르면 \'모름\')"',
        };
        addLine('', 'text');
        addLine(`  ${prompts[prev]}`, 'system');
        addLine('  (이전 단계로 돌아갑니다)', 'text');
        setPhase(prev);
        return;
      }
    }

    switch (currentPhase) {
      case 'name':
        birthInfoRef.current.name = input;
        addLine('', 'text');
        addLine('  현자: "생년월일을 알려주시오. (예: 1990-03-15)"', 'system');
        addLine('  ("이전" 입력 시 이전 단계로 돌아갑니다)', 'text');
        setPhase('date');
        break;

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
        addLine('  현자가 눈을 감고 사주를 읽기 시작합니다...', 'system');
        addLine('', 'text');

        try {
          const saju = calculateFullSaju(birthInfoRef.current as BirthInfo);
          sajuRef.current = saju;
          setPhase('exploring');
          moveToRoom('cave');
        } catch {
          addLine('  사주 계산 중 오류가 발생했습니다. 날짜를 확인해주세요.', 'error');
          addLine('  현자: "다시 생년월일을 알려주시오. (예: 1990-03-15)"', 'system');
          setPhase('date');
          birthInfoRef.current = { name: birthInfoRef.current.name };
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

  return {
    lines,
    handleCommand,
    startGame,
    isStreaming,
    phase,
  };
}
