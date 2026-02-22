import type { ExtractionJobRepository } from "../domain/ExtractionJobRepository.js";
import type { EventPublisher } from "../../../../shared/domain/EventPublisher";

// ─── Use Cases ─────────────────────────────────────────────────────
export { ExecuteExtraction } from "./ExecuteExtraction.js";
export type {
  ExecuteExtractionCommand,
  ExecuteExtractionResult,
  ExtractorMap,
} from "./ExecuteExtraction.js";

// Note: UnsupportedMimeTypeError is now exported from domain/errors

// ─── Use Cases Container ──────────────────────────────────────────────
import { ExecuteExtraction, type ExtractorMap } from "./ExecuteExtraction.js";

export class ExtractionUseCases {
  readonly executeExtraction: ExecuteExtraction;

  constructor(
    repository: ExtractionJobRepository,
    extractors: ExtractorMap,
    eventPublisher: EventPublisher,
  ) {
    this.executeExtraction = new ExecuteExtraction(
      repository,
      extractors,
      eventPublisher,
    );
  }

  /**
   * Returns the list of supported MIME types for extraction.
   */
  getSupportedMimeTypes(): string[] {
    return this.executeExtraction.getSupportedMimeTypes();
  }
}
