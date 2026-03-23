import type { VectorEntry } from "../../../../../shared/vector/VectorEntry";

export interface VectorWriteStore {
  upsert(entries: VectorEntry[]): Promise<void>;
  delete(ids: string[]): Promise<void>;
  deleteByProjectionId(projectionId: string): Promise<void>;
  deleteBySourceId(sourceId: string): Promise<void>;
}
