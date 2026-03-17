import { CommandType, RoomExit } from './types';

const DIRECTION_MAP: Record<string, string> = {
  // 한글
  '동': '동', '서': '서', '남': '남', '북': '북',
  // 단축키
  'ㄷ': '동', 'ㅅ': '서', 'ㄴ': '남', 'ㅂ': '북',
  // 영문
  'east': '동', 'west': '서', 'south': '남', 'north': '북',
  'e': '동', 'w': '서', 's': '남', 'n': '북',
};

const ROOM_NAME_MAP: Record<string, string> = {
  '오행': '동',
  '십성': '서',
  '운세': '남',
  '종합': '북',
  '동굴': '남',  // synthesis → cave 방향
};

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

  // 다시/restart
  if (trimmed === '다시' || trimmed === '처음' || trimmed === 'restart') {
    return { type: 'restart' };
  }

  // 숫자 선택 (1, 2, 3, 4)
  const num = parseInt(trimmed);
  if (!isNaN(num) && num >= 1 && num <= exits.length) {
    return { type: 'move', direction: exits[num - 1].direction };
  }

  // 방향 매핑
  const direction = DIRECTION_MAP[trimmed];
  if (direction) {
    return { type: 'move', direction };
  }

  // 방 이름 매핑
  const roomDirection = ROOM_NAME_MAP[trimmed];
  if (roomDirection) {
    return { type: 'move', direction: roomDirection };
  }

  return { type: 'unknown', raw: input };
}
