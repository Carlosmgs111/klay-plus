import type { EventPublisher } from "../../../shared/domain/index.js";
import { ExtractionJob } from "../domain/ExtractionJob.js";
import { ExtractionJobId } from "../domain/ExtractionJobId.js";
import type { ExtractionJobRepository } from "../domain/ExtractionJobRepository.js";
import type { SourceExtractor } from "../../source/domain/SourceExtractor.js";
import type { SourceRepository } from "../../source/domain/SourceRepository.js";
import { SourceId } from "../../source/domain/SourceId.js";

export interface ExecuteExtractionCommand {
  jobId: string;
  sourceId: string;
}

export class ExecuteExtraction {
  constructor(
    private readonly jobRepository: ExtractionJobRepository,
    private readonly sourceRepository: SourceRepository,
    private readonly extractor: SourceExtractor,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(command: ExecuteExtractionCommand): Promise<void> {
    const jobId = ExtractionJobId.create(command.jobId);
    const job = ExtractionJob.create(jobId, command.sourceId);

    const sourceId = SourceId.create(command.sourceId);
    const source = await this.sourceRepository.findById(sourceId);

    if (!source) {
      throw new Error(`Source ${command.sourceId} not found`);
    }

    job.start();

    try {
      const extraction = await this.extractor.extract(source.uri, source.type);
      source.updateContent(extraction.rawContent, extraction.contentHash);
      job.complete();

      await this.sourceRepository.save(source);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      job.fail(message);
    }

    await this.jobRepository.save(job);
    await this.eventPublisher.publishAll(job.clearEvents());
  }
}
