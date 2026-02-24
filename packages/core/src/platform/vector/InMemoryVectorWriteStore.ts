import type { VectorEntry } from "./VectorEntry.js";

/**
 * In-memory vector write store for testing and in-memory infrastructure.
 *
 * Uses structural typing (no explicit implements) to avoid importing
 * the VectorWriteStore port from a specific context — platform must
 * not depend on contexts.
 */
export class InMemoryVectorWriteStore {
  private entries = new Map<string, VectorEntry>();

  async upsert(entries: VectorEntry[]): Promise<void> {
    for (const entry of entries) {
      this.entries.set(entry.id, entry);
    }
  }

  async delete(ids: string[]): Promise<void> {
    for (const id of ids) {
      this.entries.delete(id);
    }
  }

  async deleteBySemanticUnitId(semanticUnitId: string): Promise<void> {
    for (const [id, entry] of this.entries) {
      if (entry.semanticUnitId === semanticUnitId) {
        this.entries.delete(id);
      }
    }
  }

  async deleteByProjectionId(projectionId: string): Promise<void> {
    for (const [id, entry] of this.entries) {
      if (entry.metadata?.projectionId === projectionId) {
        this.entries.delete(id);
      }
    }
  }

  /**
   * Exposes the internal entries Map for cross-context in-memory wiring.
   * The knowledge-retrieval context receives this Map to create its VectorReadStore.
   */
  get sharedEntries(): Map<string, VectorEntry> {
    return this.entries;
  }

  getEntryCount(): number {
    return this.entries.size;
  }
}
