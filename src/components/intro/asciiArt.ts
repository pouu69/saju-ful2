/** Full-size dragon/phoenix art for md+ screens (640px+) */
export const DRAGON_PHOENIX_FULL: string[] = [
  '          ╭─────────────────────╮',
  '       ╱                         ╲',
  '     龍                             鳳',
  '    ╱  ╲    ◆ ═══════════ ◆    ╱  ╲',
  '   ╱    ╲   ║             ║   ╱    ╲',
  '  ╱  ╱╲  ╲  ║  命    理  ║  ╱  ╱╲  ╲',
  '  ╲  ╲╱  ╱  ║             ║  ╲  ╲╱  ╱',
  '   ╲    ╱   ◆ ═══════════ ◆   ╲    ╱',
  '    ╲  ╱                         ╲  ╱',
  '      ╲                         ╱',
  '          ╰─────────────────────╯',
  '',
  '      사 주 명 리 의  미 궁',
  '      四 柱 命 理 의  迷 宮',
];

/** Compact art for small screens (<640px) */
export const DRAGON_PHOENIX_COMPACT: string[] = [
  '    ╭───────────────╮',
  '  龍    ◆══════◆    鳳',
  '  ╱ ╲   ║ 命理 ║   ╱ ╲',
  '  ╲ ╱   ◆══════◆   ╲ ╱',
  '    ╰───────────────╯',
  '',
  '  사 주 명 리 의  미 궁',
  '  四 柱 命 理 의  迷 宮',
];

/** Line interval in ms (~70ms per line ≈ 1s for full art) */
export const LINE_INTERVAL_MS = 70;

/** Safety timeout — force complete after this many ms */
export const SAFETY_TIMEOUT_MS = 2000;
