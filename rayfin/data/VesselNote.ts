import {
  authenticated,
  date,
  entity,
  one,
  text,
  uuid,
} from '@microsoft/rayfin-core';

import { Vessel } from './Vessel.js';

/** A short free-text note an analyst attaches to a vessel. */
@entity()
@authenticated('*', {
  policy: (claims, item) => claims.sub.eq(item.user_id),
})
export class VesselNote {
  @uuid() id!: string;

  @text({ min: 1, max: 500 }) body!: string;

  /** Optional single tag such as "congestion" or "follow-up". */
  @text({ optional: true, max: 40 }) tag?: string;

  @date() createdAt!: Date;

  @text({ max: 128 }) user_id!: string;

  @one(() => Vessel) vessel!: Vessel;
}
