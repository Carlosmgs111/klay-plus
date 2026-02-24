import type { VectorEntry } from "../../../../../platform/vector/VectorEntry.js";

export interface VectorWriteStore {
  upsert(entries: VectorEntry[]): Promise<void>;
  delete(ids: string[]): Promise<void>;
  deleteBySemanticUnitId(semanticUnitId: string): Promise<void>;
  deleteByProjectionId(projectionId: string): Promise<void>;
}
