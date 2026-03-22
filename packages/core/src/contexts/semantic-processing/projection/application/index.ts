import type { SemanticProjectionRepository } from "../domain/SemanticProjectionRepository";
import type { SemanticProjection } from "../domain/SemanticProjection";
import type { VectorWriteStore } from "../domain/ports/VectorWriteStore";
import type { EventPublisher } from "../../../../shared/domain/EventPublisher";
import type { ProcessingProfileRepository } from "../../processing-profile/domain/ProcessingProfileRepository";
import type { ProcessingProfileMaterializer } from "../composition/ProcessingProfileMaterializer";

export { GenerateProjection } from "./GenerateProjection";
export type {
  GenerateProjectionCommand,
  GenerateProjectionResult,
} from "./GenerateProjection";

import { GenerateProjection } from "./GenerateProjection";

export class ProjectionUseCases {
  readonly generateProjection: GenerateProjection;

  private readonly _repository: SemanticProjectionRepository;
  private readonly _vectorStore: VectorWriteStore;

  constructor(
    repository: SemanticProjectionRepository,
    profileRepository: ProcessingProfileRepository,
    materializer: ProcessingProfileMaterializer,
    vectorStore: VectorWriteStore,
    eventPublisher: EventPublisher,
  ) {
    this._repository = repository;
    this._vectorStore = vectorStore;
    this.generateProjection = new GenerateProjection(
      repository,
      profileRepository,
      materializer,
      vectorStore,
      eventPublisher,
    );
  }

  /** Delete all projections and vector entries for a source. */
  async cleanupSourceData(sourceId: string): Promise<void> {
    await this._repository.deleteBySourceId(sourceId);
    await this._vectorStore.deleteBySourceId(sourceId);
  }

  /** Delete only the projection (and its vectors) for a specific profile. Returns deleted projection ID or null. */
  async cleanupSourceProjectionForProfile(sourceId: string, profileId: string): Promise<string | null> {
    const projection = await this._repository.findBySourceIdAndProfileId(sourceId, profileId);
    if (!projection) return null;
    await this._vectorStore.deleteByProjectionId(projection.id.value);
    await this._repository.delete(projection.id);
    return projection.id.value;
  }

  /** Find an existing projection for a source+profile combination. */
  async findProjectionForProfile(sourceId: string, profileId: string): Promise<SemanticProjection | null> {
    return this._repository.findBySourceIdAndProfileId(sourceId, profileId);
  }

  /** Find all projections for a source (across all profiles). */
  async findAllForSource(sourceId: string): Promise<SemanticProjection[]> {
    return this._repository.findBySourceId(sourceId);
  }
}
