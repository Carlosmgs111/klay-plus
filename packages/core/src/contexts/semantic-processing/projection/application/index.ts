import type { SemanticProjectionRepository } from "../domain/SemanticProjectionRepository";
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
