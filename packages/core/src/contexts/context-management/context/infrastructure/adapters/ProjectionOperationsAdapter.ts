import type { FindExistingProjection } from "../../../../semantic-processing/projection/application/use-cases/FindExistingProjection";
import type { CleanupSourceProjectionForProfile } from "../../../../semantic-processing/projection/application/use-cases/CleanupSourceProjectionForProfile";
import type { ProcessContent } from "../../../../semantic-processing/projection/application/use-cases/ProcessContent";
import type {
  ProjectionOperationsPort,
  ExistingProjectionInfo,
  ProcessContentInput,
  ProcessContentSuccess,
} from "../../application/ports/ProjectionOperationsPort";
import type { Result } from "../../../../../shared/domain/Result";
import type { DomainError } from "../../../../../shared/domain/errors";

/**
 * Implements ProjectionOperationsPort using individual semantic-processing use cases.
 */
export class ProjectionOperationsAdapter implements ProjectionOperationsPort {
  constructor(
    private readonly _findExistingProjection: FindExistingProjection,
    private readonly _cleanupSourceProjectionForProfile: CleanupSourceProjectionForProfile,
    private readonly _processContent: ProcessContent,
  ) {}

  findExistingProjection(sourceId: string, profileId: string): Promise<ExistingProjectionInfo | null> {
    return this._findExistingProjection.execute(sourceId, profileId);
  }

  cleanupSourceProjectionForProfile(sourceId: string, profileId: string): Promise<string | null> {
    return this._cleanupSourceProjectionForProfile.execute(sourceId, profileId);
  }

  processContent(input: ProcessContentInput): Promise<Result<DomainError, ProcessContentSuccess>> {
    return this._processContent.execute(input);
  }
}
