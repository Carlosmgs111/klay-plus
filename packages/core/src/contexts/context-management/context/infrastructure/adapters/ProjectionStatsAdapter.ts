import type { ProjectionQueries } from "../../../../semantic-processing/projection/application/use-cases/ProjectionQueries";
import type { ProjectionSummary, ProjectionStatsPort } from "../../application/ports/ProjectionStatsPort";

/**
 * Adapts ProjectionQueries to the ProjectionStatsPort interface.
 * Updated to use ProjectionQueries.listAllForSources() directly.
 */
export class ProjectionStatsAdapter implements ProjectionStatsPort {
  constructor(private readonly _projectionQueries: ProjectionQueries) {}

  async getAllProjectionsForSources(sourceIds: string[]): Promise<Map<string, ProjectionSummary[]>> {
    return this._projectionQueries.listAllForSources(sourceIds);
  }
}
