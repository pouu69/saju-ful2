/**
 * 카드 PNG 내보내기 공통 상수 및 캔버스 유틸리티
 * cardExport, compatCardExport, luckCardExport에서 공유
 */

import { ELEMENT_HEX } from '@/lib/saju/constants';

// ── 레이아웃 ──
export const FONT_SIZE = 16;
export const LINE_HEIGHT = 22;
export const CARD_PAD_X = 24;
export const CARD_PAD_Y = 16;
export const MARGIN = 32;
export const SECTION_GAP = 12;

// ── 공통 색상 ──
export const BG_COLOR = '#080600';
export const BORDER_COLOR = '#D4A020';
export const TITLE_COLOR = '#FFD060';
export const TITLE_HANJA_COLOR = '#CC8833';
export const FOOTER_COLOR = '#6A5828';

// ── 오행 색상 ──
export const ELEMENT_COLORS = ELEMENT_HEX;

// ── 폰트 ──
export const FONT_FAMILY = '"D2Coding", "D2 Coding", "Noto Sans Mono CJK KR", monospace';

// ── 캔버스 드로잉 유틸리티 ──

/** ctx.measureText 기반 텍스트 줄바꿈 */
export function wrapTextPx(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const paragraphs = text.split('\n');
  const result: string[] = [];
  for (const para of paragraphs) {
    if (para.trim() === '') { result.push(''); continue; }
    let current = '';
    for (const ch of para) {
      const test = current + ch;
      if (ctx.measureText(test).width > maxWidth && current.length > 0) {
        result.push(current);
        current = ch;
      } else {
        current = test;
      }
    }
    if (current) result.push(current);
  }
  return result;
}

/** 텍스트를 영역 중앙에 그리기 */
export function drawCentered(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  y: number,
  color: string,
) {
  const w = ctx.measureText(text).width;
  ctx.fillStyle = color;
  ctx.fillText(text, centerX - w / 2, y);
}

/** 텍스트를 왼쪽 정렬로 그리기 */
export function drawLeft(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
) {
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

/** 라벨 + 값 한 줄 그리기 (고정 valueX 정렬) */
export function drawLabelValue(
  ctx: CanvasRenderingContext2D,
  label: string,
  value: string,
  x: number,
  valueX: number,
  y: number,
  labelColor: string,
  valueColor: string,
) {
  drawLeft(ctx, label, x, y, labelColor);
  drawLeft(ctx, value, valueX, y, valueColor);
}

/** 가로 구분선 그리기 */
export function drawHLine(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, width: number,
  color: string, style: 'solid' | 'double' = 'solid',
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  if (style === 'double') {
    ctx.beginPath();
    ctx.moveTo(x, y - 1.5); ctx.lineTo(x + width, y - 1.5);
    ctx.moveTo(x, y + 1.5); ctx.lineTo(x + width, y + 1.5);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(x, y); ctx.lineTo(x + width, y);
    ctx.stroke();
  }
}

/** 둥근 모서리 카드 테두리 그리기 (글로우 효과 포함) */
export function drawCardBorder(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  borderColor: string, radius = 6,
) {
  function roundedRect() {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  ctx.shadowColor = borderColor;
  ctx.shadowBlur = 28;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  roundedRect();
  ctx.stroke();

  ctx.shadowBlur = 6;
  ctx.lineWidth = 1.5;
  roundedRect();
  ctx.stroke();
  ctx.shadowBlur = 0;
}
