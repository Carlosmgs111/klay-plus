import { RegisterSource } from "./application/RegisterSource.js";
import { UpdateSource } from "./application/UpdateSource.js";
import type { SourceRepository } from "./domain/SourceRepository.js";
import type { SourceExtractor } from "./domain/SourceExtractor.js";
import type { EventPublisher } from "../../shared/domain/EventPublisher.js";

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
