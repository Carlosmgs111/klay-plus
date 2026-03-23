import type { GetAllProjectionsForSources } from "../../../../semantic-processing/projection/application/use-cases/GetAllProjectionsForSources";
import type { ProjectionSummary, ProjectionStatsPort } from "../../application/ports/ProjectionStatsPort";

/**
 * Adapts GetAllProjectionsForSources use case to the ProjectionStatsPort interface.
 * The return type is structurally compatible: GetAllProjectionsForSources returns
 * ExistingProjectionInfo[] which has the same fields as ProjectionSummary.
 */
export class ProjectionStatsAdapter implements ProjectionStatsPort {
  constructor(private readonly _getAllProjectionsForSources: GetAllProjectionsForSources) {}

  async getAllProjectionsForSources(sourceIds: string[]): Promise<Map<string, ProjectionSummary[]>> {
    return this._getAllProjectionsForSources.execute(sourceIds);
  }
}
