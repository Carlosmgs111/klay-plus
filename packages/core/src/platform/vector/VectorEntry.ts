// ─── VectorEntry ─────────────────────────────────────────────────────────────
//
// Represents a stored vector embedding entry.
// This is a TECHNICAL structure for vector storage, NOT a domain concept.
// It lives in platform/ because it describes the shape of data that flows
// between the write-side (semantic-processing) and the read-side (knowledge-retrieval)
// through vector infrastructure.

export interface VectorEntry {
  id: string;
  semanticUnitId: string;
  vector: number[];
  content: string;
  metadata: Record<string, unknown>;
}
