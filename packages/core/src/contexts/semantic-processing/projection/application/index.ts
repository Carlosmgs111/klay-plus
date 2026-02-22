import type { SemanticProjectionRepository } from "../domain/SemanticProjectionRepository.js";
import type { VectorWriteStore } from "../domain/ports/VectorWriteStore.js";
import type { EventPublisher } from "../../../../shared/domain/EventPublisher.js";
import type { ProcessingProfileRepository } from "../../processing-profile/domain/ProcessingProfileRepository.js";
import type { ProcessingProfileMaterializer } from "../composition/ProcessingProfileMaterializer.js";

// ─── Use Cases ─────────────────────────────────────────────────────
export { GenerateProjection } from "./GenerateProjection.js";
export type {
  GenerateProjectionCommand,
  GenerateProjectionResult,
} from "./GenerateProjection.js";

// ─── Use Cases Facade ──────────────────────────────────────────────
import { GenerateProjection } from "./GenerateProjection.js";

export class ProjectionUseCases {
  readonly generateProjection: GenerateProjection;

  constructor(
    repository: SemanticProjectionRepository,
    profileRepository: ProcessingProfileRepository,
    materializer: ProcessingProfileMaterializer,
    vectorStore: VectorWriteStore,
    eventPublisher: EventPublisher,
  ) {
    this.generateProjection = new GenerateProjection(
      repository,
      profileRepository,
      materializer,
      vectorStore,
      eventPublisher,
    );
  }
}
