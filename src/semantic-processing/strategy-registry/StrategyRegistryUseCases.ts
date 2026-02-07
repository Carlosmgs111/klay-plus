import { RegisterStrategy } from "./application/RegisterStrategy.js";
import type { ProcessingStrategyRepository } from "./domain/ProcessingStrategyRepository.js";
import type { EventPublisher } from "../../shared/domain/EventPublisher.js";

export class StrategyRegistryUseCases {
  readonly registerStrategy: RegisterStrategy;

  constructor(repository: ProcessingStrategyRepository, eventPublisher: EventPublisher) {
    this.registerStrategy = new RegisterStrategy(repository, eventPublisher);
  }
}
