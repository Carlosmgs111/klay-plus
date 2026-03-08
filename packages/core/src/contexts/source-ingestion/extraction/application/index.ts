import type { ExtractionJobRepository } from "../domain/ExtractionJobRepository";
import type { EventPublisher } from "../../../../shared/domain/EventPublisher";
import type { ExtractionJob } from "../domain/ExtractionJob";

export { ExecuteExtraction } from "./ExecuteExtraction";
export type {
  ExecuteExtractionCommand,
  ExecuteExtractionResult,
  ExtractorMap,
} from "./ExecuteExtraction";

// Note: UnsupportedMimeTypeError is now exported from domain/errors

import { ExecuteExtraction, type ExtractorMap } from "./ExecuteExtraction";

export class ExtractionUseCases {
  readonly executeExtraction: ExecuteExtraction;
  private readonly _repository: ExtractionJobRepository;

  constructor(
    repository: ExtractionJobRepository,
    extractors: ExtractorMap,
    eventPublisher: EventPublisher,
  ) {
    this._repository = repository;
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

  /**
   * Returns the latest completed ExtractionJob for a given sourceId,
   * or null if no completed extraction exists.
   */
  async getLatestCompletedBySourceId(
    sourceId: string,
  ): Promise<ExtractionJob | null> {
    const jobs = await this._repository.findBySourceId(sourceId);
    const completed = jobs.filter((job) => job.extractedText !== null);

    if (completed.length === 0) return null;

    return completed.reduce((latest, job) =>
      job.completedAt! > latest.completedAt! ? job : latest,
    );
  }
}
