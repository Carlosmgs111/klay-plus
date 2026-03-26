/**
 * Port for reading projection statistics per source.
 * Consumed by GetContextDetail, ListContextSummary use cases.
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
