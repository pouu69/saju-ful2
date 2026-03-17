'use client';

import { useState, useCallback, useRef } from 'react';
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
  const terminal = useTerminal();
  const streaming = useStreaming();

  const [phase, setPhase] = useState<GamePhase>('intro');
  const [currentRoom, setCurrentRoom] = useState<RoomId>('entrance');
  const sajuRef = useRef<SajuResult | null>(null);
  const birthInfoRef = useRef<Partial<BirthInfo>>({});

  const showExits = useCallback((roomId: RoomId) => {
    const exitLines = getExitLines(roomId);
    for (const line of exitLines) {
      terminal.addLine(line.text, line.type as 'text', { color: line.color });
    }
  }, [terminal]);

  const triggerAi = useCallback((roomId: RoomId) => {
    if (!sajuRef.current) return;

    terminal.addLine('');
    const streamLineId = terminal.addLine('', 'streaming');

    streaming.streamInterpretation(
      roomId,
      sajuRef.current,
      (chunk) => terminal.appendToLine(streamLineId, chunk),
      () => {
        showExits(roomId);
      },
      (error) => {
        terminal.addLine(`  오류: ${error}`, 'error');
        showExits(roomId);
      },
    );
  }, [terminal, streaming, showExits]);

  const moveToRoom = useCallback((roomId: RoomId) => {
    setCurrentRoom(roomId);
    const result = enterRoom(roomId);

    for (const line of result.lines) {
      terminal.addLine(line.text, line.type as 'text', { color: line.color });
    }

    // 사주 테이블 표시 (cave 방)
    if (roomId === 'cave' && sajuRef.current) {
      const pillarLines = generatePillarLines(sajuRef.current);
      terminal.addLines(pillarLines, 'ascii', 'text-yellow-300');
    }

    if (result.requestAi) {
      triggerAi(roomId);
    } else {
      showExits(roomId);
    }
  }, [terminal, triggerAi, showExits]);

  const startGame = useCallback(() => {
    terminal.clear();
    terminal.addLines(TITLE_ART, 'ascii', 'text-cyan-400');
    terminal.addLine('  어둠 속에서 은은한 빛이 당신을 이끕니다...', 'text');
    terminal.addLine('  고대의 현자가 동굴 입구에서 기다리고 있습니다.', 'text');
    terminal.addLine('', 'text');
    terminal.addLine('  현자: "그대의 이름이 무엇인가?"', 'system');
    setPhase('name');
    setCurrentRoom('entrance');
    sajuRef.current = null;
    birthInfoRef.current = {};
  }, [terminal]);

  const handleCommand = useCallback((input: string) => {
    // 사용자 입력 표시
    terminal.addLine(`  > ${input}`, 'input');

    switch (phase) {
      case 'name':
        birthInfoRef.current.name = input;
        terminal.addLine('', 'text');
        terminal.addLine('  현자: "생년월일을 알려주시오. (예: 1990-03-15)"', 'system');
        setPhase('date');
        break;

      case 'date': {
        const match = input.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})$/);
        if (!match) {
          terminal.addLine('  형식이 올바르지 않습니다. (예: 1990-03-15)', 'error');
          return;
        }
        birthInfoRef.current.year = parseInt(match[1]);
        birthInfoRef.current.month = parseInt(match[2]);
        birthInfoRef.current.day = parseInt(match[3]);
        terminal.addLine('', 'text');
        terminal.addLine('  현자: "태어난 시간은? (예: 14:30, 모르면 \'모름\')"', 'system');
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
            terminal.addLine('  형식이 올바르지 않습니다. (예: 14:30 또는 모름)', 'error');
            return;
          }
          birthInfoRef.current.hour = parseInt(match[1]);
          birthInfoRef.current.minute = match[2] ? parseInt(match[2]) : 0;
        }
        terminal.addLine('', 'text');
        terminal.addLine('  현자: "성별은? (남/여)"', 'system');
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
          terminal.addLine('  남 또는 여를 입력해주세요.', 'error');
          return;
        }

        terminal.addLine('', 'text');
        terminal.addLine('  현자가 눈을 감고 사주를 읽기 시작합니다...', 'system');
        terminal.addLine('', 'text');

        try {
          const saju = calculateFullSaju(birthInfoRef.current as BirthInfo);
          sajuRef.current = saju;
          setPhase('exploring');
          moveToRoom('cave');
        } catch {
          terminal.addLine('  사주 계산 중 오류가 발생했습니다. 날짜를 확인해주세요.', 'error');
          terminal.addLine('  현자: "다시 생년월일을 알려주시오. (예: 1990-03-15)"', 'system');
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
          terminal.addLine(line.text, line.type as 'text', { color: line.color });
        }

        if (result.newRoom && result.newRoom !== currentRoom) {
          moveToRoom(result.newRoom);
        }
        break;
      }

      default:
        startGame();
    }
  }, [phase, currentRoom, terminal, moveToRoom, startGame]);

  return {
    lines: terminal.lines,
    handleCommand,
    startGame,
    isStreaming: streaming.isStreaming,
    phase,
  };
}
