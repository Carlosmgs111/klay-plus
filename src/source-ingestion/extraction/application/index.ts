import type { ExtractionJobRepository } from "../domain/ExtractionJobRepository.js";
import type { ContentExtractor } from "../domain/ContentExtractor.js";
import type { EventPublisher } from "../../../shared/domain/EventPublisher.js";

// ─── Use Cases ─────────────────────────────────────────────────────
export { ExecuteExtraction } from "./ExecuteExtraction.js";
export type { ExecuteExtractionCommand, ExecuteExtractionResult } from "./ExecuteExtraction.js";

// ─── Use Cases Facade ──────────────────────────────────────────────
import { ExecuteExtraction } from "./ExecuteExtraction.js";

export class ExtractionUseCases {
  readonly executeExtraction: ExecuteExtraction;

  constructor(
    repository: ExtractionJobRepository,
    extractor: ContentExtractor,
    eventPublisher: EventPublisher,
  ) {
    this.executeExtraction = new ExecuteExtraction(
      repository,
      extractor,
      eventPublisher,
    );
  }
}
