import type { SourceRepository } from "../domain/SourceRepository.js";
import type { SourceExtractor } from "../domain/SourceExtractor.js";
import type { EventPublisher } from "../../../shared/domain/EventPublisher.js";

// ─── Use Cases ─────────────────────────────────────────────────────
export { RegisterSource } from "./RegisterSource.js";
export type { RegisterSourceCommand } from "./RegisterSource.js";

export { UpdateSource } from "./UpdateSource.js";
export type { UpdateSourceCommand } from "./UpdateSource.js";

// ─── Use Cases Facade ──────────────────────────────────────────────
import { RegisterSource } from "./RegisterSource.js";
import { UpdateSource } from "./UpdateSource.js";

export class SourceUseCases {
  readonly registerSource: RegisterSource;
  readonly updateSource: UpdateSource;

  constructor(
    repository: SourceRepository,
    extractor: SourceExtractor,
    eventPublisher: EventPublisher,
  ) {
    this.registerSource = new RegisterSource(repository, extractor, eventPublisher);
    this.updateSource = new UpdateSource(repository, extractor, eventPublisher);
  }
}
