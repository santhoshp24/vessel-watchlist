import type {
  NoteInput,
  NoteRecord,
  PortCallInput,
  PortCallPatch,
  PortCallRecord,
  VesselInput,
  VesselRecord,
} from '@/domain/types';

/**
 * Everything the UI needs from a backend. There are two implementations: one
 * backed by the Rayfin client (Fabric) and an in-memory one used for local
 * development without a backend and for unit tests. Components only ever see
 * this interface.
 */
export interface WatchlistRepository {
  listVessels(): Promise<VesselRecord[]>;
  createVessel(input: VesselInput): Promise<VesselRecord>;
  setWatched(vesselId: string, isWatched: boolean): Promise<void>;
  /** Also removes the vessel's port calls and notes. */
  deleteVessel(vesselId: string): Promise<void>;

  listPortCalls(): Promise<PortCallRecord[]>;
  createPortCall(
    vesselId: string,
    input: PortCallInput
  ): Promise<PortCallRecord>;
  updatePortCall(id: string, patch: PortCallPatch): Promise<void>;
  deletePortCall(id: string): Promise<void>;

  listNotes(): Promise<NoteRecord[]>;
  addNote(vesselId: string, input: NoteInput): Promise<NoteRecord>;
  deleteNote(id: string): Promise<void>;
}

export class DuplicateVesselError extends Error {
  constructor(imo: string) {
    super(`A vessel with IMO ${imo} is already on your watchlist.`);
    this.name = 'DuplicateVesselError';
  }
}
