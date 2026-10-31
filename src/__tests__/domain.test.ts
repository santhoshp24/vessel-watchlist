import { describe, expect, it } from 'vitest';

import { delayBand, delayHours, portStats, reasonBreakdown } from '@/domain/delay';
import { isValidImo, withImoCheckDigit } from '@/domain/imo';
import type { PortCallRecord } from '@/domain/types';

function call(overrides: Partial<PortCallRecord>): PortCallRecord {
  return {
    id: crypto.randomUUID(),
    vesselId: 'v1',
    portName: 'Jebel Ali',
    status: 'departed',
    eta: new Date('2026-11-01T00:00:00Z'),
    delayReason: 'none',
    ...overrides,
  };
}

describe('IMO check digit', () => {
  it('accepts a number with a correct check digit', () => {
    // Worked example for stem 950001: 9*7 + 5*6 + 0*5 + 0*4 + 0*3 + 1*2 = 95,
    // so the check digit is 5 and the full number is 9500015.
    expect(withImoCheckDigit('950001')).toBe('9500015');
    expect(isValidImo('9500015')).toBe(true);
  });

  it('rejects a wrong check digit, wrong length, and non-digits', () => {
    const good = withImoCheckDigit('950001');
    const wrongDigit = `${good.slice(0, 6)}${(Number(good[6]) + 1) % 10}`;
    expect(isValidImo(wrongDigit)).toBe(false);
    expect(isValidImo('123456')).toBe(false);
    expect(isValidImo('12345678')).toBe(false);
    expect(isValidImo('12345ab')).toBe(false);
  });

  it('rejects a stem that is not six digits', () => {
    expect(() => withImoCheckDigit('12345')).toThrow();
  });
});

describe('delay calculation', () => {
  it('is null until the vessel has arrived', () => {
    expect(delayHours(call({ ata: undefined }))).toBeNull();
  });

  it('is positive when late and negative when early, to one decimal', () => {
    const eta = new Date('2026-11-01T00:00:00Z');
    expect(delayHours({ eta, ata: new Date('2026-11-01T06:30:00Z') })).toBe(6.5);
    expect(delayHours({ eta, ata: new Date('2026-10-31T21:00:00Z') })).toBe(-3);
  });

  it('bands delays', () => {
    expect(delayBand(-5)).toBe('early');
    expect(delayBand(0)).toBe('on-time');
    expect(delayBand(2)).toBe('on-time');
    expect(delayBand(10)).toBe('late');
    expect(delayBand(30)).toBe('severe');
  });
});

describe('port statistics', () => {
  const eta = new Date('2026-11-01T00:00:00Z');
  const hoursLater = (h: number) => new Date(eta.getTime() + h * 3_600_000);

  it('averages measured delays per port and sorts worst first', () => {
    const stats = portStats([
      call({ portName: 'Jebel Ali', eta, ata: hoursLater(4) }),
      call({ portName: 'Jebel Ali', eta, ata: hoursLater(8) }),
      call({ portName: 'Jebel Ali', eta }), // not arrived: counted, not measured
      call({ portName: 'Fujairah', eta, ata: hoursLater(20) }),
    ]);

    expect(stats.map((s) => s.portName)).toEqual(['Fujairah', 'Jebel Ali']);
    const jebelAli = stats.find((s) => s.portName === 'Jebel Ali');
    expect(jebelAli).toMatchObject({
      calls: 3,
      measuredCalls: 2,
      averageDelayHours: 6,
      worstDelayHours: 8,
    });
  });

  it('reports zero rather than NaN for a port with nothing measured', () => {
    const [only] = portStats([call({ portName: 'Abu Dhabi' })]);
    expect(only?.averageDelayHours).toBe(0);
    expect(only?.worstDelayHours).toBe(0);
  });

  it('counts delay reasons, ignoring "none"', () => {
    const breakdown = reasonBreakdown([
      call({ delayReason: 'congestion' }),
      call({ delayReason: 'congestion' }),
      call({ delayReason: 'weather' }),
      call({ delayReason: 'none' }),
    ]);
    expect(breakdown).toEqual([
      { reason: 'congestion', count: 2 },
      { reason: 'weather', count: 1 },
    ]);
  });
});
