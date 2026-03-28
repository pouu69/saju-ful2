/**
 * 사주 카드 PNG 내보내기
 * Canvas 그리기 프리미티브로 카드 렌더링 → PNG 다운로드
 */

import { SajuResult } from '@/lib/saju/types';
import { ELEMENT_NAMES } from '@/lib/saju/constants';
import { countTenGods } from '@/lib/saju/helpers';
import { logger } from '@/lib/logger';
import { getZodiacArt } from './zodiacArt';
import {
  FONT_SIZE, LINE_HEIGHT, CARD_PAD_X, CARD_PAD_Y, MARGIN, SECTION_GAP,
  BG_COLOR, BORDER_COLOR, TITLE_COLOR, TITLE_HANJA_COLOR, FOOTER_COLOR,
  ELEMENT_COLORS, FONT_FAMILY,
  wrapTextPx, drawCentered, drawLeft, drawLabelValue, drawHLine, drawCardBorder,
} from './cardConstants';

const CARD_INNER_W = 520;

const DIM_COLOR = '#8A6618';
const INFO_NAME_COLOR = '#FFFFFF';
const INFO_DATE_COLOR = '#BBBBBB';
const ZODIAC_ART_COLOR = '#48B8A8';
const ZODIAC_LABEL_COLOR = '#66DDCC';
const WISDOM_TITLE_COLOR = '#CC88FF';
const WISDOM_TEXT_COLOR = '#E8D8C0';
const PILLAR_HEADER_COLOR = '#8A7848';
const SUMMARY_TITLE_COLOR = '#CC88FF';
const SUMMARY_LABEL_COLOR = '#8A7848';
const SINSAL_COLOR = '#FF8866';

// 12간지 동물 이모지 맵
const ANIMAL_EMOJI: Record<string, string> = {
  '쥐': '🐭', '소': '🐄', '호랑이': '🐯', '토끼': '🐰',
  '용': '🐉', '뱀': '🐍', '말': '🐎', '양': '🐑',
  '원숭이': '🐒', '닭': '🐓', '개': '🐕', '돼지': '🐖',
};

const MAX_WISDOM_LINES = 8;

/** AI 캐시에서 현자의 한마디 추출 */
export function extractWisdom(aiCache: Record<string, string>): string {
  const roomOrder = ['synthesis', 'luck', 'compatibility'];
  for (const roomId of roomOrder) {
    const text = aiCache[roomId];
    if (!text) continue;

    const marker = '현자의 한마디';
    const idx = text.indexOf(marker);
    if (idx === -1) continue;

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
      if (started && trimmed !== '') {
        wisdomLines.push(trimmed);
      }
    }

    if (wisdomLines.length > 0) {
      return wisdomLines.join('\n');
    }
  }
  return '길은 이미 당신 안에 있습니다.';
}

/** Canvas에 카드 렌더링 후 PNG Blob 반환 */
export async function renderCardToPng(
  saju: SajuResult,
  aiCache: Record<string, string>,
  options?: { cardWidth?: number },
): Promise<Blob> {
  const CARD_W = options?.cardWidth ?? CARD_INNER_W;
  const animal = saju.yearPillar.branch.animal;
  const zodiacArt = getZodiacArt(animal);
  const dm = saju.dayMaster;
  const dmEl = ELEMENT_NAMES[dm.element];
  const yearBranch = saju.yearPillar.branch;
  const name = saju.birthInfo.name || '무명';
  const bi = saju.birthInfo;
  const dateStr = bi.year ? `${bi.year}년 ${bi.month}월 ${bi.day}일` : '';
  const genderStr = bi.gender === 'male' ? '남' : bi.gender === 'female' ? '여' : '';

  // 사주 네 기둥
  const pillars = [
    { label: '년주', p: saju.yearPillar },
    { label: '월주', p: saju.monthPillar },
    { label: '일주', p: saju.dayPillar },
    ...(saju.hourPillar ? [{ label: '시주', p: saju.hourPillar }] : []),
  ];

  // 사주 요약 데이터 준비
  const fe = saju.fiveElements;
  const domEl = ELEMENT_NAMES[fe.dominant];
  const defEl = ELEMENT_NAMES[fe.deficient];
  const sortedGods = countTenGods(saju.tenGods);
  const topGods = sortedGods.slice(0, 2).map(([n, c]) => `${n}(${c})`).join(', ');
  const sinsals = saju.sinsals.slice(0, 3); // 최대 3개

  // 먼저 높이를 계산하기 위해 임시 캔버스로 measureText
  const tmpCanvas = document.createElement('canvas');
  tmpCanvas.width = 1; tmpCanvas.height = 1;
  const tmpCtx = tmpCanvas.getContext('2d')!;
  tmpCtx.font = `${FONT_SIZE}px ${FONT_FAMILY}`;

  const wisdom = extractWisdom(aiCache);
  const wisdomMaxW = CARD_W - CARD_PAD_X * 2;
  const wrappedWisdom = wrapTextPx(tmpCtx, wisdom, wisdomMaxW).slice(0, MAX_WISDOM_LINES);

  // 섹션별 높이 계산
  // 제목: 장식줄 + 한글제목 + 한자제목 = 3줄 → 4줄로 변경 (장식 헤더 추가)
  const titleH = CARD_PAD_Y + LINE_HEIGHT * 4 + CARD_PAD_Y;
  const infoH = CARD_PAD_Y + LINE_HEIGHT * 2 + CARD_PAD_Y;
  // 동물 아트: 이모지 행(1.8 * LINE_HEIGHT) + 아트 줄 수
  const artH = CARD_PAD_Y + Math.ceil(LINE_HEIGHT * 1.8) + LINE_HEIGHT * zodiacArt.length + CARD_PAD_Y;
  const wisdomH = CARD_PAD_Y + LINE_HEIGHT + 8 + LINE_HEIGHT * wrappedWisdom.length + CARD_PAD_Y;
  const pillarH = CARD_PAD_Y + LINE_HEIGHT * 3 + CARD_PAD_Y;
  // 요약: 제목 + 강한오행 + 약한오행 + 십성 + 신살(있으면)
  const summaryLineCount = 3 + (sinsals.length > 0 ? 1 : 0);
  const summaryH = CARD_PAD_Y + LINE_HEIGHT + 8 + LINE_HEIGHT * summaryLineCount + CARD_PAD_Y;
  const footerH = CARD_PAD_Y + LINE_HEIGHT * 2 + CARD_PAD_Y;

  const totalCardH = titleH + infoH + artH + wisdomH + pillarH + summaryH + footerH;
  const canvasW = CARD_W + MARGIN * 2;
  const canvasH = totalCardH + MARGIN * 2;

  const canvas = document.createElement('canvas');
  canvas.width = canvasW * 2;
  canvas.height = canvasH * 2;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(2, 2);

  // ── 배경 ──
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, canvasW, canvasH);

  // ── 카드 외곽 테두리 (글로우) ──
  const cardX = MARGIN;
  const cardY = MARGIN;
  const cardW = CARD_W;
  const cardH = totalCardH;

  drawCardBorder(ctx, cardX, cardY, cardW, cardH, BORDER_COLOR);

  // ── 폰트 설정 ──
  ctx.font = `${FONT_SIZE}px ${FONT_FAMILY}`;
  ctx.textBaseline = 'top';

  const centerX = cardX + cardW / 2;
  const leftX = cardX + CARD_PAD_X;
  let curY = cardY;

  // 일간 오행 색상 (정보 섹션에 활용)
  const dmColor = ELEMENT_COLORS[dm.element];

  // ── 1) 제목 섹션 ──
  curY += CARD_PAD_Y + LINE_HEIGHT * 0.5;
  drawCentered(ctx, '龍 ══ 사주명리의 미궁 ══ 鳳', centerX, curY, DIM_COLOR);
  curY += LINE_HEIGHT;
  drawCentered(ctx, '사 주 명 리 의   미 궁', centerX, curY, TITLE_COLOR);
  curY += LINE_HEIGHT;
  drawCentered(ctx, '四 柱 命 理 의   迷 宮', centerX, curY, TITLE_HANJA_COLOR);
  curY += LINE_HEIGHT + CARD_PAD_Y * 0.5;
  drawHLine(ctx, cardX, curY, cardW, BORDER_COLOR, 'double');
  curY += SECTION_GAP;

  // ── 2) 사용자 정보 ──
  curY += CARD_PAD_Y * 0.5;
  // 이름은 흰색, 날짜/성별은 연한 회색으로 분리 렌더링
  const nameText = name;
  const detailText = `  ·  ${dateStr}  ${genderStr}`;
  const fullInfoW = ctx.measureText(nameText + detailText).width;
  const infoStartX = centerX - fullInfoW / 2;
  drawLeft(ctx, nameText, infoStartX, curY, INFO_NAME_COLOR);
  drawLeft(ctx, detailText, infoStartX + ctx.measureText(nameText).width, curY, INFO_DATE_COLOR);
  curY += LINE_HEIGHT;

  // 일간 정보 — 일간 글자는 오행색, 나머지는 회색
  const dmLabel = '일간: ';
  const dmValue = `${dm.korean}(${dmEl.hanja})`;
  const dmSep = ' · ';
  const dmAnimal = `${yearBranch.animal}띠(${yearBranch.hanja})`;
  const pillarFullW = ctx.measureText(dmLabel + dmValue + dmSep + dmAnimal).width;
  let px = centerX - pillarFullW / 2;
  drawLeft(ctx, dmLabel, px, curY, INFO_DATE_COLOR);
  px += ctx.measureText(dmLabel).width;
  drawLeft(ctx, dmValue, px, curY, dmColor);
  px += ctx.measureText(dmValue).width;
  drawLeft(ctx, dmSep, px, curY, INFO_DATE_COLOR);
  px += ctx.measureText(dmSep).width;
  drawLeft(ctx, dmAnimal, px, curY, ZODIAC_ART_COLOR);
  curY += LINE_HEIGHT + CARD_PAD_Y * 0.5;
  drawHLine(ctx, cardX, curY, cardW, BORDER_COLOR, 'double');
  curY += SECTION_GAP;

  // ── 3) 12지 동물 아트 ──
  curY += CARD_PAD_Y * 0.5;
  // 동물 이모지 — serif 폰트로 크게 표시
  const animalEmoji = ANIMAL_EMOJI[animal] ?? '⭐';
  ctx.font = '32px serif';
  drawCentered(ctx, animalEmoji, centerX, curY, ZODIAC_LABEL_COLOR);
  curY += LINE_HEIGHT * 1.8;
  // 폰트 복원
  ctx.font = `${FONT_SIZE}px ${FONT_FAMILY}`;
  for (let ai = 0; ai < zodiacArt.length; ai++) {
    const artLine = zodiacArt[ai];
    // 동물 이름/한자가 포함된 줄은 밝은 청록, 나머지는 청록
    const isLabel = artLine.includes('·');
    drawCentered(ctx, artLine, centerX, curY, isLabel ? ZODIAC_LABEL_COLOR : ZODIAC_ART_COLOR);
    curY += LINE_HEIGHT;
  }
  curY += CARD_PAD_Y * 0.5;
  drawHLine(ctx, cardX, curY, cardW, BORDER_COLOR, 'double');
  curY += SECTION_GAP;

  // ── 4) 현자의 한마디 ──
  curY += CARD_PAD_Y * 0.5;
  drawCentered(ctx, '─── 현자의 한마디 ───', centerX, curY, WISDOM_TITLE_COLOR);
  curY += LINE_HEIGHT + 8;
  for (const wLine of wrappedWisdom) {
    drawLeft(ctx, wLine, leftX, curY, WISDOM_TEXT_COLOR);
    curY += LINE_HEIGHT;
  }
  curY += CARD_PAD_Y * 0.5;
  drawHLine(ctx, cardX, curY, cardW, BORDER_COLOR, 'double');
  curY += SECTION_GAP;

  // ── 5) 사주 네 기둥 (오행별 색상) ──
  curY += CARD_PAD_Y * 0.5;
  const colCount = pillars.length;
  const colW = cardW / colCount;

  // 오행 컬러 배경 (기둥별 반투명 사각형)
  const colBgH = LINE_HEIGHT * 3; // header + 천간 + 지지 3행 높이
  for (let i = 0; i < colCount; i++) {
    const colLeft = cardX + colW * i;
    const elColor = ELEMENT_COLORS[pillars[i].p.stem.element];
    // 반투명 배경
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = elColor;
    ctx.fillRect(colLeft + 2, curY, colW - 4, colBgH);
    ctx.globalAlpha = 1.0;
    // 테두리
    ctx.strokeStyle = elColor;
    ctx.globalAlpha = 0.25;
    ctx.lineWidth = 1;
    ctx.strokeRect(colLeft + 2, curY, colW - 4, colBgH);
    ctx.globalAlpha = 1.0;
  }

  // 헤더 행
  for (let i = 0; i < colCount; i++) {
    const cx = cardX + colW * i + colW / 2;
    drawCentered(ctx, pillars[i].label, cx, curY, PILLAR_HEADER_COLOR);
  }
  curY += LINE_HEIGHT;

  // 천간 행 — 각 기둥의 천간 오행 색상
  for (let i = 0; i < colCount; i++) {
    const cx = cardX + colW * i + colW / 2;
    const p = pillars[i].p;
    drawCentered(ctx, `${p.stem.korean}(${p.stem.hanja})`, cx, curY, ELEMENT_COLORS[p.stem.element]);
  }
  curY += LINE_HEIGHT;

  // 지지 행 — 각 기둥의 지지 오행 색상
  for (let i = 0; i < colCount; i++) {
    const cx = cardX + colW * i + colW / 2;
    const p = pillars[i].p;
    drawCentered(ctx, `${p.branch.korean}(${p.branch.hanja})`, cx, curY, ELEMENT_COLORS[p.branch.element]);
  }
  curY += LINE_HEIGHT + CARD_PAD_Y * 0.5;
  drawHLine(ctx, cardX, curY, cardW, BORDER_COLOR, 'double');
  curY += SECTION_GAP;

  // ── 6) 사주 요약 (오행·십성·신살) ──
  curY += CARD_PAD_Y * 0.5;
  drawCentered(ctx, '─── 사주 요약 ───', centerX, curY, SUMMARY_TITLE_COLOR);
  curY += LINE_HEIGHT + 8;

  // 고정 값 컬럼 위치 (가장 긴 라벨 "주요 십성" 기준)
  const valueX = leftX + ctx.measureText('주요 십성  ').width;

  drawLabelValue(ctx, '강한 오행', `${domEl.korean}(${domEl.hanja})`, leftX, valueX, curY, SUMMARY_LABEL_COLOR, ELEMENT_COLORS[fe.dominant]);
  curY += LINE_HEIGHT;
  drawLabelValue(ctx, '약한 오행', `${defEl.korean}(${defEl.hanja})`, leftX, valueX, curY, SUMMARY_LABEL_COLOR, ELEMENT_COLORS[fe.deficient]);
  curY += LINE_HEIGHT;
  drawLabelValue(ctx, '주요 십성', topGods, leftX, valueX, curY, SUMMARY_LABEL_COLOR, TITLE_COLOR);
  curY += LINE_HEIGHT;

  if (sinsals.length > 0) {
    drawLabelValue(ctx, '신살', sinsals.map(s => s.name).join(', '), leftX, valueX, curY, SUMMARY_LABEL_COLOR, SINSAL_COLOR);
    curY += LINE_HEIGHT;
  }

  curY += CARD_PAD_Y * 0.5;
  drawHLine(ctx, cardX, curY, cardW, BORDER_COLOR, 'double');
  curY += SECTION_GAP;

  // ── 7) 하단 ──
  curY += CARD_PAD_Y * 0.5;
  const dateNow = new Date().toLocaleDateString('ko-KR');
  drawCentered(ctx, `풀이일: ${dateNow}`, centerX, curY, FOOTER_COLOR);
  curY += LINE_HEIGHT;
  drawCentered(ctx, 'Labyrinth of Four Pillars', centerX, curY, FOOTER_COLOR);

  // ── Canvas → Blob ──
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('PNG 변환 실패'));
      },
      'image/png',
    );
  });
}

/** a.download 클릭으로 다운로드 */
function tryAnchorDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/** 다운로드 (a.click) */
export function downloadBlob(blob: Blob, filename: string): boolean {
  tryAnchorDownload(blob, filename);
  return true;
}

/** 카드 PNG 다운로드 */
export async function downloadCardPng(
  saju: SajuResult,
  aiCache: Record<string, string>,
): Promise<boolean> {
  try {
    const blob = await renderCardToPng(saju, aiCache);
    const name = saju.birthInfo.name || '사주';
    const filename = `${name}_사주카드_${new Date().toISOString().slice(0, 10)}.png`;
    return downloadBlob(blob, filename);
  } catch (err) {
    logger.error('cardExport', 'PNG 생성 실패', err);
    return false;
  }
}
