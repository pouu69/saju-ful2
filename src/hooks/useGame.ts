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
import { BirthInfo, SajuResult } from '@/lib/saju/types';

const TITLE_ART = [
  '',
  '  ╔═══════════════════════════════════════╗',
  '  ║                                       ║',
  '  ║    사 주 명 리 의   미 궁             ║',
  '  ║    Labyrinth of Four Pillars          ║',
  '  ║                                       ║',
  '  ╚═══════════════════════════════════════╝',
  '',
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

    addLine('');
    const streamLineId = addLine('', 'streaming');

    streamInterpretation(
      roomId,
      sajuRef.current,
      (chunk) => appendToLine(streamLineId, chunk),
      () => showExits(roomId),
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

    if (roomId === 'cave' && sajuRef.current) {
      const pillarLines = generatePillarLines(sajuRef.current);
      addLines(pillarLines, 'ascii', 'text-yellow-300');
    }

    if (result.requestAi) {
      triggerAi(roomId);
    } else {
      showExits(roomId);
    }
  }, [addLine, addLines, triggerAi, showExits, setCurrentRoom]);

  const startGame = useCallback(() => {
    clear();
    addLines(TITLE_ART, 'ascii', 'text-cyan-400');
    addLine('  어둠 속에서 은은한 빛이 당신을 이끕니다...', 'text');
    addLine('  고대의 현자가 동굴 입구에서 기다리고 있습니다.', 'text');
    addLine('', 'text');
    addLine('  현자: "그대의 이름이 무엇인가?"', 'system');
    setPhase('name');
    setCurrentRoom('entrance');
    sajuRef.current = null;
    birthInfoRef.current = {};
  }, [clear, addLines, addLine, setPhase, setCurrentRoom]);

  const handleCommand = useCallback((input: string) => {
    addLine(`  > ${input}`, 'input');
    const currentPhase = phaseRef.current;
    const currentRoom = currentRoomRef.current;

    switch (currentPhase) {
      case 'name':
        birthInfoRef.current.name = input;
        addLine('', 'text');
        addLine('  현자: "생년월일을 알려주시오. (예: 1990-03-15)"', 'system');
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

        for (const line of result.lines) {
          addLine(line.text, line.type as 'text', { color: line.color });
        }

        if (result.newRoom && result.newRoom !== currentRoom) {
          moveToRoom(result.newRoom);
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
