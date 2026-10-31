import { describe, expect, it } from 'vitest';

import { pluralize } from '@/lib/format';

describe('pluralize', () => {
  it('uses the singular only for exactly one', () => {
    expect(pluralize(0, 'call')).toBe('0 calls');
    expect(pluralize(1, 'call')).toBe('1 call');
    expect(pluralize(2, 'call')).toBe('2 calls');
  });

  it('accepts an irregular plural', () => {
    expect(pluralize(1, 'port of call', 'ports of call')).toBe('1 port of call');
    expect(pluralize(3, 'port of call', 'ports of call')).toBe('3 ports of call');
  });
});
