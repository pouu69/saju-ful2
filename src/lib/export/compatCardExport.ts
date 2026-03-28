/**
 * 궁합 카드 PNG 내보내기
 * 두 사람의 사주를 나란히 비교하는 카드
 */

import { SajuResult } from '@/lib/saju/types';
import { ELEMENT_NAMES } from '@/lib/saju/constants';
import { getZodiacArt } from './zodiacArt';
import {
  FONT_SIZE, LINE_HEIGHT, CARD_PAD_X, CARD_PAD_Y, MARGIN, SECTION_GAP,
  BG_COLOR, BORDER_COLOR, TITLE_COLOR, TITLE_HANJA_COLOR, FOOTER_COLOR,
  ELEMENT_COLORS, FONT_FAMILY,
  wrapTextPx, drawCentered, drawLeft, drawHLine,
} from './cardConstants';

const INFO_COLOR = '#BBBBBB';
const NAME_COLOR = '#FFFFFF';
const SECTION_TITLE_COLOR = '#CC88FF';
const LABEL_COLOR = '#8A7848';
const ZODIAC_ART_COLOR = '#48B8A8';
const ZODIAC_LABEL_COLOR = '#66DDCC';
const WISDOM_COLOR = '#E8D8C0';
const HEART_COLOR = '#FF6688';

/** AI 캐시에서 현자의 한마디 추출 (궁합용) */
function extractCompatWisdom(aiCache: Record<string, string>): string {
  const text = aiCache['compatibility'];
  if (!text) return '두 사람의 인연은 우연이 아닐세.';

  const marker = '현자의 한마디';
  const idx = text.indexOf(marker);
  if (idx === -1) return '두 사람의 인연은 우연이 아닐세.';

  const afterMarker = text.slice(idx + marker.length);
  const lines = afterMarker.split('\n');
  const wisdomLines: string[] = [];
  let started = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!started) {
      if (trimmed === '' || trimmed.startsWith('──') || trimmed === marker) continue;
      started = true;
    }
    if (started && trimmed.startsWith('──')) break;
    if (started && trimmed !== '') wisdomLines.push(trimmed);
  }
  return wisdomLines.length > 0 ? wisdomLines.join('\n') : '두 사람의 인연은 우연이 아닐세.';
}

export async function renderCompatCardToPng(
  saju: SajuResult,
  partnerSaju: SajuResult,
  aiCache: Record<string, string>,
  options?: { cardWidth?: number },
): Promise<Blob> {
  const CARD_W = options?.cardWidth ?? 520;
  const name1 = saju.birthInfo.name || '나';
  const name2 = partnerSaju.birthInfo.name || '상대';
  const animal1 = saju.yearPillar.branch.animal;
  const animal2 = partnerSaju.yearPillar.branch.animal;
  const art1 = getZodiacArt(animal1);
  const art2 = getZodiacArt(animal2);
  const dm1 = saju.dayMaster;
  const dm2 = partnerSaju.dayMaster;

  const wisdom = extractCompatWisdom(aiCache);

  // 임시 캔버스
  const tmpCanvas = document.createElement('canvas');
  tmpCanvas.width = 1; tmpCanvas.height = 1;
  const tmpCtx = tmpCanvas.getContext('2d')!;
  tmpCtx.font = `${FONT_SIZE}px ${FONT_FAMILY}`;

  const wisdomMaxW = CARD_W - CARD_PAD_X * 2;
  const wrappedWisdom = wrapTextPx(tmpCtx, wisdom, wisdomMaxW).slice(0, 6);

  // 높이 계산
  const titleH = CARD_PAD_Y + LINE_HEIGHT * 3 + CARD_PAD_Y;
  const namesH = CARD_PAD_Y + LINE_HEIGHT * 3 + CARD_PAD_Y;
  const artLines = Math.max(art1.length, art2.length);
  const artH = CARD_PAD_Y + LINE_HEIGHT * artLines + CARD_PAD_Y;
  const pillarsH = CARD_PAD_Y + LINE_HEIGHT + 8 + LINE_HEIGHT * 3 * 2 + CARD_PAD_Y; // 2명 × 3행
  const wisdomH = CARD_PAD_Y + LINE_HEIGHT + 8 + LINE_HEIGHT * wrappedWisdom.length + CARD_PAD_Y;
  const footerH = CARD_PAD_Y + LINE_HEIGHT * 2 + CARD_PAD_Y;

  const totalCardH = titleH + namesH + artH + pillarsH + wisdomH + footerH;
  const canvasW = CARD_W + MARGIN * 2;
  const canvasH = totalCardH + MARGIN * 2;

  const canvas = document.createElement('canvas');
  canvas.width = canvasW * 2;
  canvas.height = canvasH * 2;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(2, 2);

  // 배경
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, canvasW, canvasH);

  // 테두리
  const cardX = MARGIN;
  const cardY = MARGIN;
  ctx.shadowColor = BORDER_COLOR;
  ctx.shadowBlur = 15;
  ctx.strokeStyle = BORDER_COLOR;
  ctx.lineWidth = 2;
  ctx.strokeRect(cardX, cardY, CARD_W, totalCardH);
  ctx.shadowBlur = 0;

  ctx.font = `${FONT_SIZE}px ${FONT_FAMILY}`;
  ctx.textBaseline = 'top';

  const centerX = cardX + CARD_W / 2;
  const leftX = cardX + CARD_PAD_X;
  const halfW = CARD_W / 2;
  const leftCenterX = cardX + halfW / 2;
  const rightCenterX = cardX + halfW + halfW / 2;
  let curY = cardY;

  // ── 제목 ──
  curY += CARD_PAD_Y + LINE_HEIGHT * 0.5;
  drawCentered(ctx, '궁 합   카 드', centerX, curY, TITLE_COLOR);
  curY += LINE_HEIGHT;
  drawCentered(ctx, '宮 合', centerX, curY, TITLE_HANJA_COLOR);
  curY += LINE_HEIGHT + CARD_PAD_Y * 0.5;
  drawHLine(ctx, cardX, curY, CARD_W, BORDER_COLOR);
  curY += SECTION_GAP;

  // ── 두 사람 이름 ──
  curY += CARD_PAD_Y * 0.5;
  drawCentered(ctx, name1, leftCenterX, curY, NAME_COLOR);
  drawCentered(ctx, '♥', centerX, curY, HEART_COLOR);
  drawCentered(ctx, name2, rightCenterX, curY, NAME_COLOR);
  curY += LINE_HEIGHT;

  // 일간 정보
  drawCentered(ctx,
    `${dm1.korean}(${ELEMENT_NAMES[dm1.element].hanja})`,
    leftCenterX, curY, ELEMENT_COLORS[dm1.element]);
  drawCentered(ctx,
    `${dm2.korean}(${ELEMENT_NAMES[dm2.element].hanja})`,
    rightCenterX, curY, ELEMENT_COLORS[dm2.element]);
  curY += LINE_HEIGHT;

  // 띠
  drawCentered(ctx, `${animal1}띠`, leftCenterX, curY, ZODIAC_LABEL_COLOR);
  drawCentered(ctx, `${animal2}띠`, rightCenterX, curY, ZODIAC_LABEL_COLOR);
  curY += LINE_HEIGHT + CARD_PAD_Y * 0.5;
  drawHLine(ctx, cardX, curY, CARD_W, BORDER_COLOR);
  curY += SECTION_GAP;

  // ── 띠 아트 나란히 ──
  curY += CARD_PAD_Y * 0.5;
  for (let i = 0; i < artLines; i++) {
    const line1 = art1[i] || '';
    const line2 = art2[i] || '';
    const isLabel1 = line1.includes('·');
    const isLabel2 = line2.includes('·');
    drawCentered(ctx, line1, leftCenterX, curY, isLabel1 ? ZODIAC_LABEL_COLOR : ZODIAC_ART_COLOR);
    drawCentered(ctx, line2, rightCenterX, curY, isLabel2 ? ZODIAC_LABEL_COLOR : ZODIAC_ART_COLOR);
    curY += LINE_HEIGHT;
  }
  curY += CARD_PAD_Y * 0.5;
  drawHLine(ctx, cardX, curY, CARD_W, BORDER_COLOR);
  curY += SECTION_GAP;

  // ── 사주 기둥 비교 ──
  curY += CARD_PAD_Y * 0.5;
  drawCentered(ctx, '─── 사주 비교 ───', centerX, curY, SECTION_TITLE_COLOR);
  curY += LINE_HEIGHT + 8;

  // 본인 기둥
  drawLeft(ctx, `${name1}:`, leftX, curY, LABEL_COLOR);
  curY += LINE_HEIGHT;
  const pillars1 = [
    { label: '년', p: saju.yearPillar },
    { label: '월', p: saju.monthPillar },
    { label: '일', p: saju.dayPillar },
    ...(saju.hourPillar ? [{ label: '시', p: saju.hourPillar }] : []),
  ];
  const col1Count = pillars1.length;
  const col1W = CARD_W / col1Count;
  // 천간
  for (let i = 0; i < col1Count; i++) {
    const cx = cardX + col1W * i + col1W / 2;
    const p = pillars1[i].p;
    drawCentered(ctx, `${p.stem.korean}(${p.stem.hanja})`, cx, curY, ELEMENT_COLORS[p.stem.element]);
  }
  curY += LINE_HEIGHT;
  // 지지
  for (let i = 0; i < col1Count; i++) {
    const cx = cardX + col1W * i + col1W / 2;
    const p = pillars1[i].p;
    drawCentered(ctx, `${p.branch.korean}(${p.branch.hanja})`, cx, curY, ELEMENT_COLORS[p.branch.element]);
  }
  curY += LINE_HEIGHT + 8;

  // 상대방 기둥
  drawLeft(ctx, `${name2}:`, leftX, curY, LABEL_COLOR);
  curY += LINE_HEIGHT;
  const pillars2 = [
    { label: '년', p: partnerSaju.yearPillar },
    { label: '월', p: partnerSaju.monthPillar },
    { label: '일', p: partnerSaju.dayPillar },
    ...(partnerSaju.hourPillar ? [{ label: '시', p: partnerSaju.hourPillar }] : []),
  ];
  const col2Count = pillars2.length;
  const col2W = CARD_W / col2Count;
  // 천간
  for (let i = 0; i < col2Count; i++) {
    const cx = cardX + col2W * i + col2W / 2;
    const p = pillars2[i].p;
    drawCentered(ctx, `${p.stem.korean}(${p.stem.hanja})`, cx, curY, ELEMENT_COLORS[p.stem.element]);
  }
  curY += LINE_HEIGHT;
  // 지지
  for (let i = 0; i < col2Count; i++) {
    const cx = cardX + col2W * i + col2W / 2;
    const p = pillars2[i].p;
    drawCentered(ctx, `${p.branch.korean}(${p.branch.hanja})`, cx, curY, ELEMENT_COLORS[p.branch.element]);
  }
  curY += LINE_HEIGHT + CARD_PAD_Y * 0.5;
  drawHLine(ctx, cardX, curY, CARD_W, BORDER_COLOR);
  curY += SECTION_GAP;

  // ── 현자의 한마디 ──
  curY += CARD_PAD_Y * 0.5;
  drawCentered(ctx, '─── 현자의 한마디 ───', centerX, curY, SECTION_TITLE_COLOR);
  curY += LINE_HEIGHT + 8;
  for (const line of wrappedWisdom) {
    drawLeft(ctx, line, leftX, curY, WISDOM_COLOR);
    curY += LINE_HEIGHT;
  }
  curY += CARD_PAD_Y * 0.5;
  drawHLine(ctx, cardX, curY, CARD_W, BORDER_COLOR);
  curY += SECTION_GAP;

  // ── 하단 ──
  curY += CARD_PAD_Y * 0.5;
  drawCentered(ctx, `풀이일: ${new Date().toLocaleDateString('ko-KR')}`, centerX, curY, FOOTER_COLOR);
  curY += LINE_HEIGHT;
  drawCentered(ctx, 'Labyrinth of Four Pillars', centerX, curY, FOOTER_COLOR);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('PNG 변환 실패')),
      'image/png',
    );
  });
}
