import type { RayfinClient } from '@microsoft/rayfin-client';

import type {
  NoteInput,
  NoteRecord,
  PortCallInput,
  PortCallPatch,
  PortCallRecord,
  VesselInput,
  VesselRecord,
} from '@/domain/types';

import type { VesselWatchlistSchema } from '../../rayfin/data/schema';

import { DuplicateVesselError, type WatchlistRepository } from './repository';

type Client = RayfinClient<VesselWatchlistSchema>;

const PAGE_SIZE = 100;

/** The API may return dates as ISO strings; normalise to `Date`. */
function toDate(value: unknown): Date {
  return value instanceof Date ? value : new Date(String(value));
}

function toOptionalDate(value: unknown): Date | undefined {
  return value === null || value === undefined ? undefined : toDate(value);
}

/** Optional text columns come back as `null`; the UI uses `undefined`. */
function toOptionalText(value: string | null | undefined): string | undefined {
  return value ?? undefined;
}

/**
 * `.execute()` silently truncates at one page, so every list goes through
 * cursor pagination until `hasNextPage` is false.
 */
async function fetchAllPages<T>(
  fetchPage: (
    cursor: string | undefined
  ) => Promise<{ items: T[]; endCursor?: string | null; hasNextPage: boolean }>
): Promise<T[]> {
  const all: T[] = [];
  let cursor: string | undefined;
  for (;;) {
    const page = await fetchPage(cursor);
    all.push(...page.items);
    if (!page.hasNextPage || !page.endCursor) return all;
    cursor = page.endCursor;
  }
}

export class RayfinRepository implements WatchlistRepository {
  constructor(private readonly client: Client) {}

  /** Row-level security keys every row to the signed-in user's subject claim. */
  private requireUserId(): string {
    const session = this.client.auth.getSession();
    if (!session.isAuthenticated || !session.user) {
      throw new Error('You need to be signed in to do that.');
    }
    return session.user.id;
  }

  async listVessels(): Promise<VesselRecord[]> {
    const rows = await fetchAllPages((cursor) => {
      const query = this.client.data.Vessel.select([
        'id',
        'imo',
        'name',
        'vesselType',
        'flag',
        'isWatched',
        'createdAt',
      ])
        .orderBy({ createdAt: 'asc' })
        .first(PAGE_SIZE);
      return (cursor ? query.after(cursor) : query).executePaginated();
    });

    return rows.map((row) => ({
      id: row.id,
      imo: row.imo,
      name: row.name,
      vesselType: row.vesselType,
      flag: toOptionalText(row.flag),
      isWatched: row.isWatched,
      createdAt: toDate(row.createdAt),
    }));
  }

  async createVessel(input: VesselInput): Promise<VesselRecord> {
    const userId = this.requireUserId();

    // The IMO must be unique per user. A composite constraint is not
    // available on entities, so it is enforced here.
    const existing = await this.client.data.Vessel.select(['id'])
      .where({ imo: { eq: input.imo } })
      .execute();
    if (existing.length > 0) throw new DuplicateVesselError(input.imo);

    const created = await this.client.data.Vessel.create({
      imo: input.imo,
      name: input.name,
      vesselType: input.vesselType,
      flag: input.flag,
      isWatched: false,
      createdAt: new Date(),
      user_id: userId,
    });

    return {
      id: created.id,
      imo: input.imo,
      name: input.name,
      vesselType: input.vesselType,
      flag: input.flag,
      isWatched: false,
      createdAt: toDate(created.createdAt),
    };
  }

  async setWatched(vesselId: string, isWatched: boolean): Promise<void> {
    await this.client.data.Vessel.update({ id: vesselId }, { isWatched });
  }

  async deleteVessel(vesselId: string): Promise<void> {
    // Children first so no foreign key is left dangling.
    const [calls, notes] = await Promise.all([
      this.listPortCalls(),
      this.listNotes(),
    ]);
    for (const call of calls.filter((c) => c.vesselId === vesselId)) {
      await this.client.data.PortCall.delete({ id: call.id });
    }
    for (const note of notes.filter((n) => n.vesselId === vesselId)) {
      await this.client.data.VesselNote.delete({ id: note.id });
    }
    await this.client.data.Vessel.delete({ id: vesselId });
  }

  async listPortCalls(): Promise<PortCallRecord[]> {
    const rows = await fetchAllPages((cursor) => {
      const query = this.client.data.PortCall.select([
        'id',
        'portName',
        'unlocode',
        'status',
        'eta',
        'ata',
        'atd',
        'berth',
        'delayReason',
        'vessel.id',
      ])
        .orderBy({ eta: 'desc' })
        .first(PAGE_SIZE);
      return (cursor ? query.after(cursor) : query).executePaginated();
    });

    return rows.map((row) => ({
      id: row.id,
      vesselId: row.vessel.id,
      portName: row.portName,
      unlocode: toOptionalText(row.unlocode),
      status: row.status,
      eta: toDate(row.eta),
      ata: toOptionalDate(row.ata),
      atd: toOptionalDate(row.atd),
      berth: toOptionalText(row.berth),
      delayReason: row.delayReason,
    }));
  }

  async createPortCall(
    vesselId: string,
    input: PortCallInput
  ): Promise<PortCallRecord> {
    const created = await this.client.data.PortCall.create({
      portName: input.portName,
      unlocode: input.unlocode,
      status: input.status,
      eta: input.eta,
      ata: input.ata,
      atd: input.atd,
      berth: input.berth,
      delayReason: input.delayReason,
      user_id: this.requireUserId(),
      vessel: { id: vesselId },
    });
    return { ...input, id: created.id, vesselId };
  }

  async updatePortCall(id: string, patch: PortCallPatch): Promise<void> {
    await this.client.data.PortCall.update({ id }, patch);
  }

  async deletePortCall(id: string): Promise<void> {
    await this.client.data.PortCall.delete({ id });
  }

  async listNotes(): Promise<NoteRecord[]> {
    const rows = await fetchAllPages((cursor) => {
      const query = this.client.data.VesselNote.select([
        'id',
        'body',
        'tag',
        'createdAt',
        'vessel.id',
      ])
        .orderBy({ createdAt: 'desc' })
        .first(PAGE_SIZE);
      return (cursor ? query.after(cursor) : query).executePaginated();
    });

    return rows.map((row) => ({
      id: row.id,
      vesselId: row.vessel.id,
      body: row.body,
      tag: toOptionalText(row.tag),
      createdAt: toDate(row.createdAt),
    }));
  }

  async addNote(vesselId: string, input: NoteInput): Promise<NoteRecord> {
    const createdAt = new Date();
    const created = await this.client.data.VesselNote.create({
      body: input.body,
      tag: input.tag,
      createdAt,
      user_id: this.requireUserId(),
      vessel: { id: vesselId },
    });
    return {
      id: created.id,
      vesselId,
      body: input.body,
      tag: input.tag,
      createdAt,
    };
  }

  async deleteNote(id: string): Promise<void> {
    await this.client.data.VesselNote.delete({ id });
  }
}
