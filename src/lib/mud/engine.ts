import { CommandType, EngineResult, OutputLine, RoomId } from './types';
import { ROOMS } from './rooms';

function text(t: string, color?: string): OutputLine {
  return { text: t, type: 'text', color };
}

function system(t: string): OutputLine {
  return { text: t, type: 'system' };
}

function error(t: string): OutputLine {
  return { text: t, type: 'error' };
}

/**
 * 방 진입 시 출력 생성
 */
export function enterRoom(roomId: RoomId): EngineResult {
  const room = ROOMS[roomId];
  if (!room) {
    return { lines: [error(`알 수 없는 장소입니다.`)] };
  }

  const lines: OutputLine[] = [];

  // 방 설명
  for (const desc of room.description) {
    lines.push(text(desc));
  }

  return {
    lines,
    newRoom: roomId,
    requestAi: room.aiInterpretation,
  };
}

/**
 * 방 출구 목록 텍스트 생성
 */
export function getExitLines(roomId: RoomId): OutputLine[] {
  const room = ROOMS[roomId];
  if (!room || room.exits.length === 0) return [];

  const lines: OutputLine[] = [
    text(''),
    text('  ─────────────────────────────', 'text-[#1a3a1a]'),
    text('  어디로 가시겠습니까?', 'text-[#00aa2a]'),
    text(''),
  ];

  room.exits.forEach((exit, i) => {
    lines.push(text(`    ${i + 1}. ${exit.label}`, 'text-yellow-400'));
  });

  lines.push(text(''));
  lines.push(text('  번호를 입력하세요. (도움: 명령어 목록)', 'text-[#00aa2a]'));
  return lines;
}

/**
 * 커맨드 실행
 */
export function executeCommand(command: CommandType, currentRoom: RoomId): EngineResult {
  const room = ROOMS[currentRoom];

  switch (command.type) {
    case 'move': {
      const exit = room.exits.find(e => e.direction === command.direction);
      if (!exit) {
        return { lines: [error('  그 방향으로는 갈 수 없습니다.')] };
      }
      return enterRoom(exit.roomId);
    }

    case 'look':
      return enterRoom(currentRoom);

    case 'help':
      return {
        lines: [
          text(''),
          system('  ═══ 도움말 ═══'),
          text('  이동: 번호(1/2/3/4) 또는 방 이름'),
          text('  보기: 현재 방 다시 보기'),
          text('  도움: 이 도움말 표시'),
          text('  새로: 새로운 사주 풀이 (처음부터)'),
          text(''),
        ],
      };

    case 'restart':
      return {
        lines: [system('  처음으로 돌아갑니다...')],
      };

    case 'unknown':
      return {
        lines: [error(`  "${command.raw}" - 알 수 없는 명령입니다. "도움"을 입력해보세요.`)],
      };
  }
}
