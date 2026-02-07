import { RegisterTransformation } from "./application/RegisterTransformation.js";
import type { KnowledgeLineageRepository } from "./domain/KnowledgeLineageRepository.js";
import type { EventPublisher } from "../../shared/domain/EventPublisher.js";

export class LineageUseCases {
  readonly registerTransformation: RegisterTransformation;

  constructor(repository: KnowledgeLineageRepository, eventPublisher: EventPublisher) {
    this.registerTransformation = new RegisterTransformation(repository, eventPublisher);
  }
}
