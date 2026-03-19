function timestamp(): string {
  return new Date().toISOString();
}

function formatEntry(level: string, category: string, message: string, data?: unknown): string {
  const base = `[${timestamp()}] [${level}] [${category}] ${message}`;
  if (data !== undefined) {
    return `${base} ${JSON.stringify(data)}`;
  }
  return base;
}

function write(level: string, category: string, message: string, data?: unknown) {
  const entry = formatEntry(level, category, message, data);
  switch (level) {
    case 'ERROR':
      console.error(entry);
      break;
    case 'DEBUG':
      console.debug(entry);
      break;
    default:
      console.log(entry);
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
