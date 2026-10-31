import type { DelayReason, PortCallRecord } from './types';

const MS_PER_HOUR = 3_600_000;

/**
 * Hours the vessel arrived after its ETA, rounded to one decimal place.
 * Negative means early. Returns `null` until an actual arrival is recorded.
 */
export function delayHours(
  call: Pick<PortCallRecord, 'eta' | 'ata'>
): number | null {
  if (!call.ata) return null;
  const hours = (call.ata.getTime() - call.eta.getTime()) / MS_PER_HOUR;
  return Math.round(hours * 10) / 10;
}

export type DelayBand = 'early' | 'on-time' | 'late' | 'severe';

/** Within +/- 2 hours counts as on time; more than 24 hours late is severe. */
export function delayBand(hours: number): DelayBand {
  if (hours < -2) return 'early';
  if (hours <= 2) return 'on-time';
  if (hours <= 24) return 'late';
  return 'severe';
}

export interface PortStats {
  portName: string;
  calls: number;
  /** Calls that have an actual arrival and therefore a measurable delay. */
  measuredCalls: number;
  averageDelayHours: number;
  worstDelayHours: number;
}

/** Average and worst delay per port, worst average first. */
export function portStats(calls: readonly PortCallRecord[]): PortStats[] {
  const byPort = new Map<string, { total: number; delays: number[] }>();

  for (const call of calls) {
    const entry = byPort.get(call.portName) ?? { total: 0, delays: [] };
    entry.total += 1;
    const hours = delayHours(call);
    if (hours !== null) entry.delays.push(hours);
    byPort.set(call.portName, entry);
  }

  return [...byPort.entries()]
    .map(([portName, { total, delays }]) => ({
      portName,
      calls: total,
      measuredCalls: delays.length,
      averageDelayHours:
        delays.length === 0
          ? 0
          : Math.round(
              (delays.reduce((sum, h) => sum + h, 0) / delays.length) * 10
            ) / 10,
      worstDelayHours: delays.length === 0 ? 0 : Math.max(...delays),
    }))
    .sort((a, b) => b.averageDelayHours - a.averageDelayHours);
}

/** How many calls were attributed to each delay reason (excluding "none"). */
export function reasonBreakdown(
  calls: readonly PortCallRecord[]
): Array<{ reason: DelayReason; count: number }> {
  const counts = new Map<DelayReason, number>();
  for (const call of calls) {
    if (call.delayReason === 'none') continue;
    counts.set(call.delayReason, (counts.get(call.delayReason) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);
}
