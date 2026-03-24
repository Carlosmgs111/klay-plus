import type { ProjectionQueries } from "../../contexts/semantic-processing/projection/application/use-cases/ProjectionQueries";
import type { CleanupProjections } from "../../contexts/semantic-processing/projection/application/use-cases/CleanupProjections";
import type { GenerateProjection } from "../../contexts/semantic-processing/projection/application/use-cases/GenerateProjection";
import type {
  ProjectionOperationsPort,
  ExistingProjectionInfo,
  ProcessContentInput,
  ProcessContentSuccess,
} from "../ports/ProjectionOperationsPort";
import { Result } from "../../shared/domain/Result";
import type { DomainError } from "../../shared/domain/errors";

export class ProjectionOperationsAdapter implements ProjectionOperationsPort {
  constructor(
    private readonly _projectionQueries: ProjectionQueries,
    private readonly _cleanupProjections: CleanupProjections,
    private readonly _generateProjection: GenerateProjection,
  ) {}

  findExistingProjection(sourceId: string, profileId: string): Promise<ExistingProjectionInfo | null> {
    return this._projectionQueries.findExisting(sourceId, profileId);
  }

  cleanupSourceProjectionForProfile(sourceId: string, profileId: string): Promise<string | null> {
    return this._cleanupProjections.execute({ sourceId, profileId }) as Promise<string | null>;
  }

  async processContent(input: ProcessContentInput): Promise<Result<DomainError, ProcessContentSuccess>> {
    const result = await this._generateProjection.execute({
      projectionId: input.projectionId,
      sourceId: input.sourceId,
      content: input.content,
      type: input.type,
      processingProfileId: input.processingProfileId,
    });

    if (result.isFail()) {
      return Result.fail(result.error as unknown as DomainError);
    }

    return Result.ok({
      projectionId: result.value.projectionId,
      chunksCount: result.value.chunksCount,
      dimensions: result.value.dimensions,
      model: result.value.model,
      processingProfileVersion: result.value.processingProfileVersion,
    });
  }
}
