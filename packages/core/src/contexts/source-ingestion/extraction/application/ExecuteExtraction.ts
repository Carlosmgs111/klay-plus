import type { EventPublisher } from "../../../../shared/domain";
import { Result } from "../../../../shared/domain/Result";
import { ExtractionJob } from "../domain/ExtractionJob";
import { ExtractionJobId } from "../domain/ExtractionJobId";
import type { ExtractionJobRepository } from "../domain/ExtractionJobRepository";
import type { ContentExtractor } from "../domain/ContentExtractor";
import {
  UnsupportedMimeTypeError,
  ExtractionFailedError,
  type ExtractionError,
} from "../domain/errors";

/**
 * Map of MIME types to their corresponding content extractors.
 */
export type ExtractorMap = Map<string, ContentExtractor>;

export interface ExecuteExtractionCommand {
  jobId: string;
  sourceId: string;
  uri: string;
  mimeType: string;
  content?: ArrayBuffer;
}

export interface ExecuteExtractionResult {
  jobId: string;
  contentHash: string;
  extractedText: string;
  metadata: Record<string, unknown>;
}

/**
 * Use case for executing content extraction.
 *
 * This use case is pure: it receives the URI and mimeType directly,
 * selects the appropriate extractor, performs extraction, and stores
 * the result in an ExtractionJob.
 *
 * It does NOT interact with Source - that coordination is done by the service.
 */
export class ExecuteExtraction {
  constructor(
    private readonly jobRepository: ExtractionJobRepository,
    private readonly extractors: ExtractorMap,
    private readonly eventPublisher: EventPublisher,
  ) {}

  /**
   * Returns the list of supported MIME types.
   */
  getSupportedMimeTypes(): string[] {
    return Array.from(this.extractors.keys());
  }

  async execute(
    command: ExecuteExtractionCommand,
  ): Promise<Result<ExtractionError, ExecuteExtractionResult>> {
    const jobId = ExtractionJobId.create(command.jobId);
    const job = ExtractionJob.create(jobId, command.sourceId);

    // Select extractor based on mimeType
    const extractor = this.extractors.get(command.mimeType);

    if (!extractor) {
      return Result.fail(
        new UnsupportedMimeTypeError(command.mimeType, this.getSupportedMimeTypes()),
      );
    }

    job.start();

    try {
      const result = await extractor.extract({
        uri: command.uri,
        content: command.content,
        mimeType: command.mimeType,
      });

      job.complete(result);

      await this.jobRepository.save(job);
      await this.eventPublisher.publishAll(job.clearEvents());

      return Result.ok({
        jobId: command.jobId,
        contentHash: result.contentHash,
        extractedText: result.text,
        metadata: result.metadata,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      job.fail(message);

      await this.jobRepository.save(job);
      await this.eventPublisher.publishAll(job.clearEvents());

      return Result.fail(
        new ExtractionFailedError(
          command.sourceId,
          message,
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }
}
