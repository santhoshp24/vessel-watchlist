import type {
  NoteInput,
  NoteRecord,
  PortCallInput,
  PortCallPatch,
  PortCallRecord,
  VesselInput,
  VesselRecord,
} from '@/domain/types';

import { DuplicateVesselError, type WatchlistRepository } from './repository';

/** In-memory repository: local dev without a backend, and unit tests. */
export class MemoryRepository implements WatchlistRepository {
  private vessels = new Map<string, VesselRecord>();
  private portCalls = new Map<string, PortCallRecord>();
  private notes = new Map<string, NoteRecord>();

  listVessels(): Promise<VesselRecord[]> {
    return Promise.resolve([...this.vessels.values()]);
  }

  createVessel(input: VesselInput): Promise<VesselRecord> {
    const exists = [...this.vessels.values()].some((v) => v.imo === input.imo);
    if (exists) return Promise.reject(new DuplicateVesselError(input.imo));

    const vessel: VesselRecord = {
      id: crypto.randomUUID(),
      imo: input.imo,
      name: input.name,
      vesselType: input.vesselType,
      flag: input.flag,
      isWatched: false,
      createdAt: new Date(),
    };
    this.vessels.set(vessel.id, vessel);
    return Promise.resolve({ ...vessel });
  }

  setWatched(vesselId: string, isWatched: boolean): Promise<void> {
    const vessel = this.vessels.get(vesselId);
    if (!vessel) return Promise.reject(new Error('Vessel not found.'));
    vessel.isWatched = isWatched;
    return Promise.resolve();
  }

  deleteVessel(vesselId: string): Promise<void> {
    this.vessels.delete(vesselId);
    for (const [id, call] of this.portCalls) {
      if (call.vesselId === vesselId) this.portCalls.delete(id);
    }
    for (const [id, note] of this.notes) {
      if (note.vesselId === vesselId) this.notes.delete(id);
    }
    return Promise.resolve();
  }

  listPortCalls(): Promise<PortCallRecord[]> {
    return Promise.resolve([...this.portCalls.values()]);
  }

  createPortCall(
    vesselId: string,
    input: PortCallInput
  ): Promise<PortCallRecord> {
    if (!this.vessels.has(vesselId)) {
      return Promise.reject(new Error('Vessel not found.'));
    }
    const call: PortCallRecord = {
      ...input,
      id: crypto.randomUUID(),
      vesselId,
    };
    this.portCalls.set(call.id, call);
    return Promise.resolve({ ...call });
  }

  updatePortCall(id: string, patch: PortCallPatch): Promise<void> {
    const call = this.portCalls.get(id);
    if (!call) return Promise.reject(new Error('Port call not found.'));
    Object.assign(call, patch);
    return Promise.resolve();
  }

  deletePortCall(id: string): Promise<void> {
    this.portCalls.delete(id);
    return Promise.resolve();
  }

  listNotes(): Promise<NoteRecord[]> {
    return Promise.resolve([...this.notes.values()]);
  }

  addNote(vesselId: string, input: NoteInput): Promise<NoteRecord> {
    if (!this.vessels.has(vesselId)) {
      return Promise.reject(new Error('Vessel not found.'));
    }
    const note: NoteRecord = {
      id: crypto.randomUUID(),
      vesselId,
      body: input.body,
      tag: input.tag,
      createdAt: new Date(),
    };
    this.notes.set(note.id, note);
    return Promise.resolve({ ...note });
  }

  deleteNote(id: string): Promise<void> {
    this.notes.delete(id);
    return Promise.resolve();
  }
}
