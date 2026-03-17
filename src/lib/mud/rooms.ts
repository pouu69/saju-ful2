import { Room } from './types';

export const ROOMS: Record<string, Room> = {
  entrance: {
    id: 'entrance',
    name: '동굴 입구',
    description: [
      '',
      '  어둠 속에서 은은한 빛이 당신을 이끕니다...',
      '  고대의 현자가 동굴 입구에서 기다리고 있습니다.',
      '',
    ],
    exits: [],
    aiInterpretation: false,
  },
  cave: {
    id: 'cave',
    name: '사주의 동굴',
    description: [
      '',
      '  [사주의 동굴]에 들어섰습니다.',
      '  동굴 벽면에서 신비로운 빛이 흘러나옵니다.',
      '  현자가 눈을 감고 당신의 사주를 펼칩니다...',
      '',
    ],
    exits: [
      { direction: '동', roomId: 'elements', label: '오행의 방' },
      { direction: '서', roomId: 'tenGods', label: '십성의 방' },
      { direction: '남', roomId: 'luck', label: '운세의 방' },
      { direction: '북', roomId: 'synthesis', label: '종합 풀이' },
    ],
    aiInterpretation: true,
  },
  elements: {
    id: 'elements',
    name: '오행의 방',
    description: [
      '',
      '  [오행의 방]에 들어섰습니다.',
      '  다섯 개의 화로가 각각 다른 빛으로 타오르고 있습니다.',
      '  목(木)의 초록, 화(火)의 붉음, 토(土)의 노랑,',
      '  금(金)의 흰빛, 수(水)의 푸름이 공간을 채웁니다.',
      '',
    ],
    exits: [
      { direction: '서', roomId: 'cave', label: '사주의 동굴' },
    ],
    aiInterpretation: true,
  },
  tenGods: {
    id: 'tenGods',
    name: '십성의 방',
    description: [
      '',
      '  [십성의 방]에 들어섰습니다.',
      '  열 개의 석상이 원형으로 서 있습니다.',
      '  각 석상은 서로 다른 운명의 힘을 상징합니다.',
      '',
    ],
    exits: [
      { direction: '동', roomId: 'cave', label: '사주의 동굴' },
    ],
    aiInterpretation: true,
  },
  luck: {
    id: 'luck',
    name: '운세의 방',
    description: [
      '',
      '  [운세의 방]에 들어섰습니다.',
      '  긴 회랑에 시간의 강이 흐르고 있습니다.',
      '  강물 위에 과거와 미래의 운이 떠다닙니다.',
      '',
    ],
    exits: [
      { direction: '북', roomId: 'cave', label: '사주의 동굴' },
    ],
    aiInterpretation: true,
  },
  synthesis: {
    id: 'synthesis',
    name: '종합 풀이',
    description: [
      '',
      '  [종합 풀이의 전당]에 들어섰습니다.',
      '  모든 기운이 하나로 모이는 곳입니다.',
      '  현자가 깊은 숨을 내쉬며 말합니다...',
      '',
    ],
    exits: [
      { direction: '남', roomId: 'cave', label: '사주의 동굴' },
    ],
    aiInterpretation: true,
  },
};
