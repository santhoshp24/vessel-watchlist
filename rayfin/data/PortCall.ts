import {
  authenticated,
  date,
  entity,
  one,
  set,
  text,
  uuid,
} from '@microsoft/rayfin-core';

import { Vessel } from './Vessel.js';

/**
 * One call of a vessel at a port. Delay is not stored: it is derived from
 * `eta` and `ata` in the app (see src/domain/delay.ts) so it can never drift
 * out of sync with the timestamps.
 */
@entity()
@authenticated('*', {
  policy: (claims, item) => claims.sub.eq(item.user_id),
})
export class PortCall {
  @uuid() id!: string;

  @text({ min: 1, max: 100 }) portName!: string;

  /** UN/LOCODE, e.g. AEAUH. Two letters of country plus three of location. */
  @text({ optional: true, max: 5, regex: /^[A-Z]{2}[A-Z0-9]{3}$/ })
  unlocode?: string;

  @set('expected', 'arrived', 'berthed', 'departed', 'cancelled')
  status!: 'expected' | 'arrived' | 'berthed' | 'departed' | 'cancelled';

  /** Estimated time of arrival. */
  @date() eta!: Date;

  /** Actual time of arrival. */
  @date({ optional: true }) ata?: Date;

  /** Actual time of departure. */
  @date({ optional: true }) atd?: Date;

  @text({ optional: true, max: 50 }) berth?: string;

  @set(
    'none',
    'congestion',
    'weather',
    'berth-unavailable',
    'customs',
    'red-sea-diversion',
    'technical',
    'other'
  )
  delayReason!:
    | 'none'
    | 'congestion'
    | 'weather'
    | 'berth-unavailable'
    | 'customs'
    | 'red-sea-diversion'
    | 'technical'
    | 'other';

  @text({ max: 128 }) user_id!: string;

  @one(() => Vessel) vessel!: Vessel;
}
