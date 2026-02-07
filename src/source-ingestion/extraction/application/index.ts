import type { ExtractionJobRepository } from "../domain/ExtractionJobRepository.js";
import type { SourceRepository } from "../../source/domain/SourceRepository.js";
import type { SourceExtractor } from "../../source/domain/SourceExtractor.js";
import type { EventPublisher } from "../../../shared/domain/EventPublisher.js";

// ─── Use Cases ─────────────────────────────────────────────────────
export { ExecuteExtraction } from "./ExecuteExtraction.js";
export type { ExecuteExtractionCommand } from "./ExecuteExtraction.js";

// ─── Use Cases Facade ──────────────────────────────────────────────
import { ExecuteExtraction } from "./ExecuteExtraction.js";

export class ExtractionUseCases {
  readonly executeExtraction: ExecuteExtraction;

  constructor(
    repository: ExtractionJobRepository,
    sourceRepository: SourceRepository,
    sourceExtractor: SourceExtractor,
    eventPublisher: EventPublisher,
  ) {
    this.executeExtraction = new ExecuteExtraction(
      repository,
      sourceRepository,
      sourceExtractor,
      eventPublisher,
    );
  }
}
