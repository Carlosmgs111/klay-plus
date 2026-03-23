/**
 * Port for reading projection statistics (chunksCount, dimensions, model) per source.
 * Consumed by GetContextDetails and ListContextsSummary use cases.
 * Implemented by ProjectionStatsAdapter (wraps SemanticProcessingService).
 */
export interface ProjectionSummary {
  projectionId: string;
  processingProfileId: string;
  chunksCount: number;
  dimensions: number;
  model: string;
}

export interface ProjectionStatsPort {
  /** Returns a map keyed by sourceId → array of projections for that source (across all profiles). */
  getAllProjectionsForSources(sourceIds: string[]): Promise<Map<string, ProjectionSummary[]>>;
}
