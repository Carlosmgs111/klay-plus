/**
 * DTO and conversion functions for persisting VectorEntry to storage backends
 * (IndexedDB, NeDB). Separated from the VectorEntry interface to keep
 * serialization concerns in infrastructure.
 */

import type { VectorEntry } from "./VectorEntry";

export interface VectorEntryDTO {
  id: string;
  sourceId: string;
  vector: number[];
  content: string;
  metadata: Record<string, unknown>;
}

/** Legacy DTO format — stored data may still have semanticUnitId instead of sourceId */
interface LegacyVectorEntryDTO {
  id: string;
  semanticUnitId?: string;
  sourceId?: string;
  vector: number[];
  content: string;
  metadata: Record<string, unknown>;
}

export function toDTO(entry: VectorEntry): VectorEntryDTO {
  return {
    id: entry.id,
    sourceId: entry.sourceId,
    vector: [...entry.vector],
    content: entry.content,
    metadata: { ...entry.metadata },
  };
}

export function fromDTO(dto: VectorEntryDTO | LegacyVectorEntryDTO): VectorEntry {
  // Migration: accept both legacy semanticUnitId and new sourceId
  const sourceId = dto.sourceId ?? (dto as LegacyVectorEntryDTO).semanticUnitId ?? "";
  return {
    id: dto.id,
    sourceId,
    vector: dto.vector,
    content: dto.content,
    metadata: dto.metadata,
  };
}
