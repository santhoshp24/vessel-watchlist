import { useCallback, useEffect, useMemo, useState } from 'react';

import type {
  NoteInput,
  NoteRecord,
  PortCallInput,
  PortCallPatch,
  PortCallRecord,
  VesselInput,
  VesselRecord,
} from '@/domain/types';
import { getRepository } from '@/services';
import { loadSampleData } from '@/services/sampleData';

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

/** Watched vessels first, then alphabetical. */
function sortVessels(vessels: readonly VesselRecord[]): VesselRecord[] {
  return [...vessels].sort(
    (a, b) =>
      Number(b.isWatched) - Number(a.isWatched) || a.name.localeCompare(b.name)
  );
}

/**
 * Loads the watchlist and exposes the mutations the UI needs.
 *
 * Mutations used by forms resolve to an error message (or `null` on success) so
 * the form can show it next to its fields. Mutations triggered from buttons
 * report failures through the shared `error` banner instead.
 */
export function useWatchlist() {
  const repository = useMemo(() => getRepository(), []);
  const [vessels, setVessels] = useState<VesselRecord[]>([]);
  const [portCalls, setPortCalls] = useState<PortCallRecord[]>([]);
  const [notes, setNotes] = useState<NoteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [v, c, n] = await Promise.all([
        repository.listVessels(),
        repository.listPortCalls(),
        repository.listNotes(),
      ]);
      setVessels(sortVessels(v));
      setPortCalls(c);
      setNotes(n);
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setLoading(false);
    }
  }, [repository]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /** For forms: returns the error message instead of showing the banner. */
  const submit = useCallback(
    async (action: () => Promise<unknown>): Promise<string | null> => {
      try {
        await action();
        await refresh();
        return null;
      } catch (e) {
        return messageOf(e);
      }
    },
    [refresh]
  );

  /** For buttons: failures go to the shared banner. */
  const perform = useCallback(
    async (action: () => Promise<unknown>): Promise<void> => {
      const message = await submit(action);
      if (message) setError(message);
    },
    [submit]
  );

  return {
    vessels,
    portCalls,
    notes,
    loading,
    error,
    dismissError: () => setError(null),

    addVessel: (input: VesselInput) =>
      submit(() => repository.createVessel(input)),
    addPortCall: (vesselId: string, input: PortCallInput) =>
      submit(() => repository.createPortCall(vesselId, input)),
    addNote: (vesselId: string, input: NoteInput) =>
      submit(() => repository.addNote(vesselId, input)),

    setWatched: (vesselId: string, isWatched: boolean) =>
      perform(() => repository.setWatched(vesselId, isWatched)),
    deleteVessel: (vesselId: string) =>
      perform(() => repository.deleteVessel(vesselId)),
    updatePortCall: (id: string, patch: PortCallPatch) =>
      perform(() => repository.updatePortCall(id, patch)),
    deletePortCall: (id: string) =>
      perform(() => repository.deletePortCall(id)),
    deleteNote: (id: string) => perform(() => repository.deleteNote(id)),
    loadSamples: () => perform(() => loadSampleData(repository)),
  };
}

export type Watchlist = ReturnType<typeof useWatchlist>;
