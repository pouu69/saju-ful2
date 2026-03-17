export type RoomId = 'entrance' | 'cave' | 'elements' | 'tenGods' | 'luck' | 'synthesis';

export interface RoomExit {
  direction: string;    // "동", "서", "남", "북"
  roomId: RoomId;
  label: string;        // "오행의 방"
}

export interface Room {
  id: RoomId;
  name: string;
  description: string[];  // 방 진입 시 표시할 텍스트 라인들
  exits: RoomExit[];
  aiInterpretation: boolean;  // AI 해석 요청 여부
}

export type CommandType =
  | { type: 'move'; direction: string }
  | { type: 'look' }
  | { type: 'help' }
  | { type: 'restart' }
  | { type: 'unknown'; raw: string };

export type GamePhase = 'intro' | 'name' | 'date' | 'time' | 'gender' | 'exploring';

export interface GameState {
  phase: GamePhase;
  currentRoom: RoomId;
  visitedRooms: Set<RoomId>;
}

// 엔진 출력
export type OutputLineType = 'text' | 'system' | 'ascii' | 'error' | 'prompt';

export interface OutputLine {
  text: string;
  type: OutputLineType;
  color?: string;  // CSS 색상 클래스
}

export interface EngineResult {
  lines: OutputLine[];
  newRoom?: RoomId;
  requestAi?: boolean;  // AI 해석 요청
}
