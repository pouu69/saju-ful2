/**
 * 한글/CJK 문자의 표시 너비를 계산한다 (한글=2, ASCII=1).
 */
export function getDisplayWidth(str: string): number {
  let width = 0;
  for (const char of str) {
    const code = char.charCodeAt(0);
    if (
      (code >= 0xAC00 && code <= 0xD7AF) || // 한글
      (code >= 0x4E00 && code <= 0x9FFF) || // 한자
      (code >= 0x3400 && code <= 0x4DBF) || // 한자 확장
      (code >= 0xFF00 && code <= 0xFFEF)    // 전각
    ) {
      width += 2;
    } else {
      width += 1;
    }
  }
  return width;
}

/**
 * 한글 포함 문자열을 지정 너비로 오른쪽 패딩한다.
 */
export function padKr(str: string, width: number): string {
  const len = getDisplayWidth(str);
  return str + ' '.repeat(Math.max(0, width - len));
}
