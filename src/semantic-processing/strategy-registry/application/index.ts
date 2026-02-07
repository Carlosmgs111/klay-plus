import type { ProcessingStrategyRepository } from "../domain/ProcessingStrategyRepository.js";
import type { EventPublisher } from "../../../shared/domain/EventPublisher.js";

// ─── Use Cases ─────────────────────────────────────────────────────
export { RegisterStrategy } from "./RegisterStrategy.js";
export type { RegisterStrategyCommand } from "./RegisterStrategy.js";

// ─── Use Cases Facade ──────────────────────────────────────────────
import { RegisterStrategy } from "./RegisterStrategy.js";

export class StrategyRegistryUseCases {
  readonly registerStrategy: RegisterStrategy;

  constructor(repository: ProcessingStrategyRepository, eventPublisher: EventPublisher) {
    this.registerStrategy = new RegisterStrategy(repository, eventPublisher);
  }
}
