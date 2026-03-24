import type { ProjectionQueries } from "../../contexts/semantic-processing/projection/application/use-cases/ProjectionQueries";
import type { ProjectionSummary, ProjectionStatsPort } from "../ports/ProjectionStatsPort";

export class ProjectionStatsAdapter implements ProjectionStatsPort {
  constructor(private readonly _projectionQueries: ProjectionQueries) {}

  async getAllProjectionsForSources(sourceIds: string[]): Promise<Map<string, ProjectionSummary[]>> {
    return this._projectionQueries.listAllForSources(sourceIds);
  }
}
