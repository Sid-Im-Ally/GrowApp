import type { ReadingSession } from '../types';

const DEFAULT_PPM = 1.0;
const SAMPLE_SIZE = 5;

export function estimatePagesPerMinute(sessions: ReadingSession[]): number {
  const recent = sessions
    .filter((s) => s.completed && s.minutesAvailable > 0)
    .slice(-SAMPLE_SIZE);
  if (recent.length === 0) return DEFAULT_PPM;
  const rates = recent.map((s) => (s.actualEndPage - s.startPage + 1) / s.minutesAvailable);
  const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
  return Math.max(0.1, Math.min(10, avg));
}
