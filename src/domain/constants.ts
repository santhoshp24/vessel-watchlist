import type { DelayReason, PortCallStatus, VesselType } from './types';

type Assert<T extends true> = T;
/** True when `Listed` covers every member of `All`. */
type Covers<All, Listed> = [Exclude<All, Listed>] extends [never]
  ? true
  : false;

export const VESSEL_TYPES = [
  'container',
  'tanker',
  'bulk-carrier',
  'ro-ro',
  'general-cargo',
  'other',
] as const satisfies readonly VesselType[];

export const PORT_CALL_STATUSES = [
  'expected',
  'arrived',
  'berthed',
  'departed',
  'cancelled',
] as const satisfies readonly PortCallStatus[];

export const DELAY_REASONS = [
  'none',
  'congestion',
  'weather',
  'berth-unavailable',
  'customs',
  'red-sea-diversion',
  'technical',
  'other',
] as const satisfies readonly DelayReason[];

/**
 * Compile-time exhaustiveness checks: if a value is added to a `@set(...)`
 * decorator on an entity but not to the lists above, these types stop
 * compiling and the build fails instead of the UI silently missing an option.
 */
export type ExhaustiveChecks = [
  Assert<Covers<VesselType, (typeof VESSEL_TYPES)[number]>>,
  Assert<Covers<PortCallStatus, (typeof PORT_CALL_STATUSES)[number]>>,
  Assert<Covers<DelayReason, (typeof DELAY_REASONS)[number]>>,
];

/** "bulk-carrier" -> "Bulk carrier" */
export function humanize(value: string): string {
  const spaced = value.replace(/-/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
