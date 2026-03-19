import { CommandType, RoomExit } from './types';

export function parseCommand(input: string, exits: RoomExit[]): CommandType {
  const trimmed = input.trim().toLowerCase();

  if (!trimmed) return { type: 'look' };

  // 도움/help
  if (trimmed === '도움' || trimmed === '도움말' || trimmed === 'help' || trimmed === '?') {
    return { type: 'help' };
  }

  // 보기/look
  if (trimmed === '보기' || trimmed === 'look' || trimmed === 'l') {
    return { type: 'look' };
  }

  // 다시/restart/새로/초기화
  if (trimmed === '다시' || trimmed === '처음' || trimmed === '새로' || trimmed === '초기화' || trimmed === 'restart' || trimmed === 'new') {
    return { type: 'restart' };
  }

  // 숫자 선택 (1, 2, 3, 4, ...)
  const num = parseInt(trimmed);
  if (!isNaN(num) && num >= 1 && num <= exits.length) {
    return { type: 'move', direction: exits[num - 1].direction };
  }

  // 방 이름으로 이동 (편의)
  const roomNameMap: Record<string, string> = {
    '종합': 'synthesis',
    '상세': 'detail',
    '오행': 'detail',
    '십성': 'detail',
    '운세': 'luck',
    '궁합': 'compatibility',
  };

  const targetRoom = roomNameMap[trimmed];
  if (targetRoom) {
    const exit = exits.find(e => e.roomId === targetRoom);
    if (exit) {
      return { type: 'move', direction: exit.direction };
    }
  }

  return { type: 'unknown', raw: input };
}
