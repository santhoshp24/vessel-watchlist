import { MemoryRepository } from './memoryRepository';
import { getRayfinClient, isLocalBackend } from './rayfinClient';
import type { WatchlistRepository } from './repository';
import { RayfinRepository } from './rayfinRepository';

let repository: WatchlistRepository | null = null;

/**
 * Picks the backend once: Rayfin when a Fabric backend is configured,
 * otherwise an in-memory repository so the app works with no backend at all.
 */
export function getRepository(): WatchlistRepository {
  if (!repository) {
    repository = isLocalBackend()
      ? new MemoryRepository()
      : new RayfinRepository(getRayfinClient());
  }
  return repository;
}

export type { WatchlistRepository };
