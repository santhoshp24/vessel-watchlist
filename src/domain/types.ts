import type { PortCall } from '../../rayfin/data/PortCall';
import type { Vessel } from '../../rayfin/data/Vessel';

/**
 * The string-literal unions live on the entities, where the `@set(...)`
 * decorators declare them. Deriving the app types from the entities keeps the
 * database schema and the UI from ever disagreeing about the allowed values.
 */
export type VesselType = Vessel['vesselType'];
export type PortCallStatus = PortCall['status'];
export type DelayReason = PortCall['delayReason'];

/** Plain records the UI works with (no navigation properties, dates as Date). */
export interface VesselRecord {
  id: string;
  imo: string;
  name: string;
  vesselType: VesselType;
  flag?: string;
  isWatched: boolean;
  createdAt: Date;
}

export interface PortCallRecord {
  id: string;
  vesselId: string;
  portName: string;
  unlocode?: string;
  status: PortCallStatus;
  eta: Date;
  ata?: Date;
  atd?: Date;
  berth?: string;
  delayReason: DelayReason;
}

export interface NoteRecord {
  id: string;
  vesselId: string;
  body: string;
  tag?: string;
  createdAt: Date;
}

export type VesselInput = Pick<VesselRecord, 'imo' | 'name' | 'vesselType'> &
  Partial<Pick<VesselRecord, 'flag'>>;

export type PortCallInput = Omit<PortCallRecord, 'id' | 'vesselId'>;

export type NoteInput = Pick<NoteRecord, 'body'> &
  Partial<Pick<NoteRecord, 'tag'>>;

export type PortCallPatch = Partial<
  Pick<
    PortCallRecord,
    'status' | 'ata' | 'atd' | 'berth' | 'delayReason'
  >
>;
