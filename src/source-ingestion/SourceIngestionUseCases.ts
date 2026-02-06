import { RegisterSource } from "./source/application/RegisterSource.js";
import { UpdateSource } from "./source/application/UpdateSource.js";
import { ExecuteExtraction } from "./extraction/application/ExecuteExtraction.js";
import type { SourceRepository } from "./source/domain/SourceRepository.js";
import type { ExtractionJobRepository } from "./extraction/domain/ExtractionJobRepository.js";
import type { SourceExtractor } from "./source/domain/SourceExtractor.js";
import type { EventPublisher } from "../shared/domain/EventPublisher.js";

export class SourceIngestionUseCases {
  readonly registerSource: RegisterSource;
  readonly updateSource: UpdateSource;
  readonly executeExtraction: ExecuteExtraction;

  constructor(
    sourceRepository: SourceRepository,
    extractionJobRepository: ExtractionJobRepository,
    sourceExtractor: SourceExtractor,
    eventPublisher: EventPublisher,
  ) {
    this.registerSource = new RegisterSource(sourceRepository, sourceExtractor, eventPublisher);
    this.updateSource = new UpdateSource(sourceRepository, sourceExtractor, eventPublisher);
    this.executeExtraction = new ExecuteExtraction(
      extractionJobRepository,
      sourceRepository,
      sourceExtractor,
      eventPublisher,
    );
  }
}
