import { writeFile, appendFile, mkdir } from 'fs/promises';
import path from 'path';

const LOG_DIR = path.join(process.cwd(), 'logs');

function timestamp(): string {
  return new Date().toISOString();
}

function logFileName(): string {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return path.join(LOG_DIR, `${date}.log`);
}

async function ensureLogDir() {
  await mkdir(LOG_DIR, { recursive: true });
}

function formatEntry(level: string, category: string, message: string, data?: unknown): string {
  const base = `[${timestamp()}] [${level}] [${category}] ${message}`;
  if (data !== undefined) {
    return `${base}\n${JSON.stringify(data, null, 2)}\n`;
  }
  return `${base}\n`;
}

async function write(level: string, category: string, message: string, data?: unknown) {
  try {
    await ensureLogDir();
    const entry = formatEntry(level, category, message, data);
    await appendFile(logFileName(), entry, 'utf-8');
  } catch {
    // 로깅 실패가 앱을 중단시키면 안 됨
    console.error(`[logger] failed to write log: ${message}`);
  }
}

export const logger = {
  info: (category: string, message: string, data?: unknown) =>
    write('INFO', category, message, data),
  error: (category: string, message: string, data?: unknown) =>
    write('ERROR', category, message, data),
  debug: (category: string, message: string, data?: unknown) =>
    write('DEBUG', category, message, data),
};