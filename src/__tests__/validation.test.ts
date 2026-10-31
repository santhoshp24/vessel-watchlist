import { describe, expect, it } from 'vitest';

import { withImoCheckDigit } from '@/domain/imo';
import {
  validateNote,
  validatePortCall,
  validateVessel,
  type PortCallFormValues,
  type VesselFormValues,
} from '@/domain/validation';

const goodVessel: VesselFormValues = {
  imo: withImoCheckDigit('950001'),
  name: 'DEMO GULF TRADER',
  vesselType: 'container',
  flag: '',
};

const goodCall: PortCallFormValues = {
  portName: 'Jebel Ali',
  unlocode: 'aejea',
  status: 'expected',
  eta: '2026-11-02T08:30',
  ata: '',
  atd: '',
  berth: '',
  delayReason: 'none',
};

describe('vessel form validation', () => {
  it('accepts a valid vessel and drops a blank flag', () => {
    const result = validateVessel(goodVessel);
    expect(result).toEqual({
      ok: true,
      value: {
        imo: goodVessel.imo,
        name: 'DEMO GULF TRADER',
        vesselType: 'container',
        flag: undefined,
      },
    });
  });

  it('uses the entity regex for IMO shape', () => {
    const result = validateVessel({ ...goodVessel, imo: '12ab' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.imo).toBeDefined();
  });

  it('rejects an IMO with a bad check digit', () => {
    const bad = `${goodVessel.imo.slice(0, 6)}${(Number(goodVessel.imo[6]) + 1) % 10}`;
    const result = validateVessel({ ...goodVessel, imo: bad });
    expect(result).toEqual({
      ok: false,
      errors: { imo: 'This IMO number fails the check-digit test.' },
    });
  });

  it('requires a name', () => {
    const result = validateVessel({ ...goodVessel, name: '   ' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.name).toBeDefined();
  });
});

describe('port call form validation', () => {
  it('accepts a valid call and upper-cases the UN/LOCODE', () => {
    const result = validatePortCall(goodCall);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.unlocode).toBe('AEJEA');
      expect(result.value.eta).toBeInstanceOf(Date);
      expect(result.value.ata).toBeUndefined();
    }
  });

  it('requires an ETA', () => {
    const result = validatePortCall({ ...goodCall, eta: '' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.eta).toBeDefined();
  });

  it('rejects a malformed UN/LOCODE', () => {
    const result = validatePortCall({ ...goodCall, unlocode: 'ZZ' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.unlocode).toBeDefined();
  });

  it('rejects departure before arrival', () => {
    const result = validatePortCall({
      ...goodCall,
      status: 'departed',
      ata: '2026-11-02T10:00',
      atd: '2026-11-02T09:00',
    });
    expect(result).toEqual({
      ok: false,
      errors: { atd: 'Departure cannot be before arrival.' },
    });
  });

  it('rejects "expected" once an actual arrival exists', () => {
    const result = validatePortCall({ ...goodCall, ata: '2026-11-02T10:00' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.status).toBeDefined();
  });
});

describe('note form validation', () => {
  it('trims the body and treats a blank tag as absent', () => {
    expect(validateNote({ body: '  hello  ', tag: ' ' })).toEqual({
      ok: true,
      value: { body: 'hello', tag: undefined },
    });
  });

  it('rejects an empty body and an over-long body', () => {
    expect(validateNote({ body: '', tag: '' }).ok).toBe(false);
    expect(validateNote({ body: 'x'.repeat(501), tag: '' }).ok).toBe(false);
  });
});
