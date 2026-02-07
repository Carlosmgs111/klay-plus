import type { KnowledgeLineageRepository } from "../domain/KnowledgeLineageRepository.js";
import type { EventPublisher } from "../../../shared/domain/EventPublisher.js";

// ─── Use Cases ─────────────────────────────────────────────────────
export { RegisterTransformation } from "./RegisterTransformation.js";
export type { RegisterTransformationCommand } from "./RegisterTransformation.js";

// ─── Use Cases Facade ──────────────────────────────────────────────
import { RegisterTransformation } from "./RegisterTransformation.js";

export class LineageUseCases {
  readonly registerTransformation: RegisterTransformation;

  constructor(repository: KnowledgeLineageRepository, eventPublisher: EventPublisher) {
    this.registerTransformation = new RegisterTransformation(repository, eventPublisher);
  }
}
