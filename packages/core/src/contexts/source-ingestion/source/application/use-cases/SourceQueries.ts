import type { SourceRepository } from "../../domain/SourceRepository";
import type { ExtractionJobRepository } from "../../../extraction/domain/ExtractionJobRepository";
import { SourceId } from "../../domain/SourceId";
import { SourceNotFoundError } from "../../domain/errors";
import { ExtractionNotAvailableError } from "../../../extraction/domain/errors";
import { ExtractionStatus } from "../../../extraction/domain/ExtractionStatus";
import { Result } from "../../../../../shared/domain/Result";
import type { DomainError } from "../../../../../shared/domain/errors";
import type { Source } from "../../domain/Source";

/**
 * SourceQueries — Consolidated read-side use cases for source-ingestion.
 *
 * Merges: GetSource, ListSources, GetSourceCount, GetExtractedText
 */
export class SourceQueries {
  constructor(
    private readonly _sourceRepo: SourceRepository,
    private readonly _extractionRepo: ExtractionJobRepository,
  ) {}

  // From GetSource — raw aggregate
  async getById(sourceId: string): Promise<Source | null> {
    return this._sourceRepo.findById(SourceId.create(sourceId));
  }

  // From ListSources — all sources
  async listAll(): Promise<Source[]> {
    return this._sourceRepo.findAll();
  }

  // From GetSourceCount — total count
  async count(): Promise<number> {
    return this._sourceRepo.count();
  }

  // From GetExtractedText — returns latest completed extracted text
  async getExtractedText(
    sourceId: string,
  ): Promise<Result<DomainError, { text: string }>> {
    const source = await this._sourceRepo.findById(SourceId.create(sourceId));

    if (!source) {
      return Result.fail(new SourceNotFoundError(sourceId));
    }

    const jobs = await this._extractionRepo.findBySourceId(sourceId);
    const completed = jobs.filter(
      (job) => job.status === ExtractionStatus.Completed && job.extractedText !== null,
    );

    const latestCompleted = completed.length > 0
      ? completed.reduce((latest, job) =>
          job.completedAt! > latest.completedAt! ? job : latest,
        )
      : null;

    if (!latestCompleted || !latestCompleted.extractedText) {
      return Result.fail(new ExtractionNotAvailableError(sourceId));
    }

    return Result.ok({ text: latestCompleted.extractedText });
  }

  // Convenience: check source existence (used by SourceIngestionPort)
  async exists(sourceId: string): Promise<boolean> {
    const source = await this._sourceRepo.findById(SourceId.create(sourceId));
    return source !== null;
  }
}
