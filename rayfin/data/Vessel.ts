import {
  authenticated,
  boolean,
  date,
  entity,
  many,
  set,
  text,
  uuid,
} from '@microsoft/rayfin-core';

import { PortCall } from './PortCall.js';
import { VesselNote } from './VesselNote.js';

/**
 * A vessel on the signed-in user's watchlist.
 *
 * Row-level security: a user can only see and change rows whose `user_id`
 * matches their own subject claim. The same policy is applied to every entity.
 */
@entity()
@authenticated('*', {
  policy: (claims, item) => claims.sub.eq(item.user_id),
})
export class Vessel {
  @uuid() id!: string;

  /** 7-digit IMO ship identification number (check digit validated in the app). */
  @text({ min: 7, max: 7, regex: /^\d{7}$/ }) imo!: string;

  @text({ min: 1, max: 100 }) name!: string;

  @set(
    'container',
    'tanker',
    'bulk-carrier',
    'ro-ro',
    'general-cargo',
    'other'
  )
  vesselType!:
    | 'container'
    | 'tanker'
    | 'bulk-carrier'
    | 'ro-ro'
    | 'general-cargo'
    | 'other';

  @text({ optional: true, max: 60 }) flag?: string;

  /** Watched vessels are pinned to the top of the watchlist. */
  @boolean() isWatched!: boolean;

  @date() createdAt!: Date;

  @text({ max: 128 }) user_id!: string;

  @many(() => PortCall) portCalls?: PortCall[];
  @many(() => VesselNote) notes?: VesselNote[];
}
