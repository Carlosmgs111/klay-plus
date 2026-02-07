import type { EventPublisher } from "../../../shared/domain/index.js";
import { ExtractionJob } from "../domain/ExtractionJob.js";
import { ExtractionJobId } from "../domain/ExtractionJobId.js";
import type { ExtractionJobRepository } from "../domain/ExtractionJobRepository.js";
import type { ContentExtractor } from "../domain/ContentExtractor.js";

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
 * performs extraction, and stores the result in an ExtractionJob.
 * It does NOT interact with Source - that coordination is done by the facade.
 */
export class ExecuteExtraction {
  constructor(
    private readonly jobRepository: ExtractionJobRepository,
    private readonly extractor: ContentExtractor,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(command: ExecuteExtractionCommand): Promise<ExecuteExtractionResult> {
    const jobId = ExtractionJobId.create(command.jobId);
    const job = ExtractionJob.create(jobId, command.sourceId);

    job.start();

    try {
      const result = await this.extractor.extract({
        uri: command.uri,
        content: command.content,
        mimeType: command.mimeType,
      });

      job.complete(result);

      await this.jobRepository.save(job);
      await this.eventPublisher.publishAll(job.clearEvents());

      return {
        jobId: command.jobId,
        contentHash: result.contentHash,
        extractedText: result.text,
        metadata: result.metadata,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      job.fail(message);

      await this.jobRepository.save(job);
      await this.eventPublisher.publishAll(job.clearEvents());

      throw error;
    }
  }
}
