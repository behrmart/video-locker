import { execFile } from 'node:child_process';

const cache = new Map<string, { fingerprint: string; value: Promise<number | null> }>();
let running = 0;
const waiting: Array<() => void> = [];

async function probeDuration(filename: string): Promise<number | null> {
  // Limit concurrent probes even when several users browse at once.
  if (running >= 3) await new Promise<void>(resolve => waiting.push(resolve));
  else running++;
  try {
    return await new Promise<number | null>(resolve => {
      execFile('ffprobe', [
        '-v', 'error', '-protocol_whitelist', 'file,pipe',
        '-show_entries', 'format=duration:stream=duration', '-of', 'json', filename
      ], { timeout: 15000, maxBuffer: 256 * 1024, windowsHide: true }, (error, stdout) => {
        if (error) { resolve(null); return; }
        try {
          const metadata = JSON.parse(stdout);
          const values = [metadata.format?.duration, ...(metadata.streams ?? []).map((s: { duration?: string }) => s.duration)]
            .filter(value => value !== undefined && value !== null && value !== '')
            .map(Number).filter(value => Number.isFinite(value) && value >= 0);
          resolve(values.length ? Math.max(...values) : null);
        } catch { resolve(null); }
      });
    });
  } finally {
    const next = waiting.shift();
    if (next) next();
    else running--;
  }
}

export function getVideoDuration(filename: string, size: number, modifiedAt: number): Promise<number | null> {
  const fingerprint = size + ':' + modifiedAt;
  const cached = cache.get(filename);
  if (cached?.fingerprint === fingerprint) return cached.value;
  const value = probeDuration(filename);
  // Bound memory use; matching in-flight requests share the same promise.
  if (cache.size >= 1000) cache.delete(cache.keys().next().value!);
  cache.set(filename, { fingerprint, value });
  return value;
}
