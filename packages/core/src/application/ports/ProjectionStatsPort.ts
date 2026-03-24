/**
 * Cross-context port for reading projection statistics per source.
 * Consumed by application-layer ContextReadModel.
 * Implemented by ProjectionStatsAdapter (wraps semantic-processing ProjectionQueries).
 */
export interface ProjectionSummary {
  projectionId: string;
  processingProfileId: string;
  chunksCount: number;
  dimensions: number;
  model: string;
}

export interface ProjectionStatsPort {
  getAllProjectionsForSources(sourceIds: string[]): Promise<Map<string, ProjectionSummary[]>>;
}
