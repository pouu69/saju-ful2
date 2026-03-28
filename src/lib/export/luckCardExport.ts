/**
 * 대운/세운 카드 PNG 내보내기
 * Canvas 프리미티브로 카드 렌더링 → PNG Blob
 */

import { SajuResult } from '@/lib/saju/types';
import { ELEMENT_NAMES } from '@/lib/saju/constants';
import { getCurrentLuckInfo } from '@/lib/saju/helpers';
import { extractWisdom } from './cardExport';
import {
  FONT_SIZE, LINE_HEIGHT, CARD_PAD_X, CARD_PAD_Y, MARGIN, SECTION_GAP,
  BG_COLOR, BORDER_COLOR, TITLE_COLOR, TITLE_HANJA_COLOR, FOOTER_COLOR,
  ELEMENT_COLORS, FONT_FAMILY,
  wrapTextPx, drawCentered, drawLeft, drawHLine,
} from './cardConstants';

const INFO_NAME_COLOR = '#FFFFFF';
const INFO_DATE_COLOR = '#BBBBBB';
const SECTION_TITLE_COLOR = '#CC88FF';
const LABEL_COLOR = '#8A7848';
const CURRENT_MARKER_COLOR = '#FF8866';
const WISDOM_COLOR = '#E8D8C0';

export async function renderLuckCardToPng(
  saju: SajuResult,
  aiCache: Record<string, string>,
  options?: { cardWidth?: number },
): Promise<Blob> {
  const CARD_W = options?.cardWidth ?? 520;
  const { currentAge, currentCycle } = getCurrentLuckInfo(saju);
  const name = saju.birthInfo.name || '무명';
  const bi = saju.birthInfo;
  const dateStr = bi.year ? `${bi.year}년 ${bi.month}월 ${bi.day}일` : '';
  const yl = saju.yearlyLuck;

  // 대운 표시할 주기들 (최대 8개)
  const cycles = saju.luckCycles.slice(0, 8);

  // AI 요약 텍스트
  const luckText = aiCache['luck-card'] || aiCache['luck'] || '';

  // 임시 캔버스로 텍스트 측정
  const tmpCanvas = document.createElement('canvas');
  tmpCanvas.width = 1; tmpCanvas.height = 1;
  const tmpCtx = tmpCanvas.getContext('2d')!;
  tmpCtx.font = `${FONT_SIZE}px ${FONT_FAMILY}`;

  const wisdomMaxW = CARD_W - CARD_PAD_X * 2;
  const wrappedLuck = luckText
    ? wrapTextPx(tmpCtx, luckText, wisdomMaxW).slice(0, 6)
    : [];

  // 높이 계산
  const titleH = CARD_PAD_Y + LINE_HEIGHT * 3 + CARD_PAD_Y;
  const infoH = CARD_PAD_Y + LINE_HEIGHT * 2 + CARD_PAD_Y;
  const cycleH = CARD_PAD_Y + LINE_HEIGHT + 8 + LINE_HEIGHT * cycles.length + CARD_PAD_Y;
  const yearlyH = CARD_PAD_Y + LINE_HEIGHT + 8 + LINE_HEIGHT * 2 + CARD_PAD_Y;
  const luckTextH = wrappedLuck.length > 0
    ? CARD_PAD_Y + LINE_HEIGHT + 8 + LINE_HEIGHT * wrappedLuck.length + CARD_PAD_Y
    : 0;
  const footerH = CARD_PAD_Y + LINE_HEIGHT * 2 + CARD_PAD_Y;

  const totalCardH = titleH + infoH + cycleH + yearlyH + luckTextH + footerH;
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
  let curY = cardY;

  // ── 제목 ──
  curY += CARD_PAD_Y + LINE_HEIGHT * 0.5;
  drawCentered(ctx, '대 운 · 세 운   카 드', centerX, curY, TITLE_COLOR);
  curY += LINE_HEIGHT;
  drawCentered(ctx, '大 運 · 歲 運', centerX, curY, TITLE_HANJA_COLOR);
  curY += LINE_HEIGHT + CARD_PAD_Y * 0.5;
  drawHLine(ctx, cardX, curY, CARD_W, BORDER_COLOR);
  curY += SECTION_GAP;

  // ── 사용자 정보 ──
  curY += CARD_PAD_Y * 0.5;
  drawCentered(ctx, name, centerX, curY, INFO_NAME_COLOR);
  curY += LINE_HEIGHT;
  drawCentered(ctx, `${dateStr}  ·  현재 ${currentAge}세`, centerX, curY, INFO_DATE_COLOR);
  curY += LINE_HEIGHT + CARD_PAD_Y * 0.5;
  drawHLine(ctx, cardX, curY, CARD_W, BORDER_COLOR);
  curY += SECTION_GAP;

  // ── 대운 타임라인 ──
  curY += CARD_PAD_Y * 0.5;
  drawCentered(ctx, '─── 대운의 흐름 ───', centerX, curY, SECTION_TITLE_COLOR);
  curY += LINE_HEIGHT + 8;

  for (const cycle of cycles) {
    const isCurrent = currentCycle === cycle;
    const stemEl = cycle.pillar.stem.element;
    const ageRange = `${cycle.startAge}-${cycle.endAge}세`;
    const pillarText = `${cycle.pillar.ganjiKorean}(${cycle.pillar.ganjiHanja})`;
    const elName = ELEMENT_NAMES[stemEl];
    const marker = isCurrent ? '  ◀ 현재' : '';

    drawLeft(ctx, ageRange, leftX, curY, isCurrent ? CURRENT_MARKER_COLOR : LABEL_COLOR);
    const ageW = ctx.measureText(ageRange + '  ').width;
    drawLeft(ctx, pillarText, leftX + ageW, curY, ELEMENT_COLORS[stemEl]);
    const pillarW = ctx.measureText(pillarText + '  ').width;
    drawLeft(ctx, `${elName.korean}(${elName.hanja})`, leftX + ageW + pillarW, curY, ELEMENT_COLORS[stemEl]);
    if (marker) {
      const fullW = ctx.measureText(ageRange + '  ' + pillarText + '  ' + `${elName.korean}(${elName.hanja})`).width;
      drawLeft(ctx, marker, leftX + ageW + pillarW + ctx.measureText(`${elName.korean}(${elName.hanja})`).width + 4, curY, CURRENT_MARKER_COLOR);
    }
    curY += LINE_HEIGHT;
  }

  curY += CARD_PAD_Y * 0.5;
  drawHLine(ctx, cardX, curY, CARD_W, BORDER_COLOR);
  curY += SECTION_GAP;

  // ── 올해 세운 ──
  curY += CARD_PAD_Y * 0.5;
  drawCentered(ctx, '─── 올해의 기운 ───', centerX, curY, SECTION_TITLE_COLOR);
  curY += LINE_HEIGHT + 8;

  const ylStemEl = yl.pillar.stem.element;
  const ylElName = ELEMENT_NAMES[ylStemEl];
  drawCentered(ctx,
    `${yl.year}년 세운: ${yl.pillar.ganjiKorean}(${yl.pillar.ganjiHanja})`,
    centerX, curY, ELEMENT_COLORS[ylStemEl]);
  curY += LINE_HEIGHT;
  drawCentered(ctx,
    `${ylElName.korean}(${ylElName.hanja})의 기운이 흐르는 해`,
    centerX, curY, WISDOM_COLOR);
  curY += LINE_HEIGHT + CARD_PAD_Y * 0.5;
  drawHLine(ctx, cardX, curY, CARD_W, BORDER_COLOR);
  curY += SECTION_GAP;

  // ── AI 요약 (있으면) ──
  if (wrappedLuck.length > 0) {
    curY += CARD_PAD_Y * 0.5;
    drawCentered(ctx, '─── 현자의 한마디 ───', centerX, curY, SECTION_TITLE_COLOR);
    curY += LINE_HEIGHT + 8;
    for (const line of wrappedLuck) {
      drawLeft(ctx, line, leftX, curY, WISDOM_COLOR);
      curY += LINE_HEIGHT;
    }
    curY += CARD_PAD_Y * 0.5;
    drawHLine(ctx, cardX, curY, CARD_W, BORDER_COLOR);
    curY += SECTION_GAP;
  }

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
