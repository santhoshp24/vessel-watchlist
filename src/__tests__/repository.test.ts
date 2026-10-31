import { beforeEach, describe, expect, it } from 'vitest';

import { MemoryRepository } from '@/services/memoryRepository';
import { DuplicateVesselError } from '@/services/repository';
import { loadSampleData } from '@/services/sampleData';

describe('MemoryRepository', () => {
  let repo: MemoryRepository;

  beforeEach(() => {
    repo = new MemoryRepository();
  });

  it('rejects a duplicate IMO', async () => {
    await repo.createVessel({ imo: '9500015', name: 'A', vesselType: 'tanker' });
    await expect(
      repo.createVessel({ imo: '9500015', name: 'B', vesselType: 'tanker' })
    ).rejects.toBeInstanceOf(DuplicateVesselError);
  });

  it('removes a vessel together with its calls and notes', async () => {
    const vessel = await repo.createVessel({
      imo: '9500015',
      name: 'A',
      vesselType: 'container',
    });
    await repo.createPortCall(vessel.id, {
      portName: 'Jebel Ali',
      status: 'expected',
      eta: new Date(),
      delayReason: 'none',
    });
    await repo.addNote(vessel.id, { body: 'hello' });

    await repo.deleteVessel(vessel.id);

    expect(await repo.listVessels()).toEqual([]);
    expect(await repo.listPortCalls()).toEqual([]);
    expect(await repo.listNotes()).toEqual([]);
  });

  it('refuses to attach a call to a vessel that does not exist', async () => {
    await expect(
      repo.createPortCall('missing', {
        portName: 'Jebel Ali',
        status: 'expected',
        eta: new Date(),
        delayReason: 'none',
      })
    ).rejects.toThrow('Vessel not found');
  });

  it('updates a port call', async () => {
    const vessel = await repo.createVessel({
      imo: '9500015',
      name: 'A',
      vesselType: 'container',
    });
    const created = await repo.createPortCall(vessel.id, {
      portName: 'Jebel Ali',
      status: 'expected',
      eta: new Date(),
      delayReason: 'none',
    });
    const ata = new Date();
    await repo.updatePortCall(created.id, { status: 'arrived', ata });

    const [updated] = await repo.listPortCalls();
    expect(updated).toMatchObject({ status: 'arrived', ata });
  });

  it('loads sample data with relationships intact', async () => {
    await loadSampleData(repo);
    const [vessels, calls, notes] = await Promise.all([
      repo.listVessels(),
      repo.listPortCalls(),
      repo.listNotes(),
    ]);

    expect(vessels.length).toBeGreaterThan(0);
    expect(vessels.some((v) => v.isWatched)).toBe(true);
    const vesselIds = new Set(vessels.map((v) => v.id));
    expect(calls.every((c) => vesselIds.has(c.vesselId))).toBe(true);
    expect(notes.every((n) => vesselIds.has(n.vesselId))).toBe(true);
  });
});
