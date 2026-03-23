import type { SourceRepository } from "../../domain/SourceRepository";
import type { ExtractionJobRepository } from "../../../extraction/domain/ExtractionJobRepository";
import { SourceId } from "../../domain/SourceId";
import { SourceNotFoundError } from "../../domain/errors";
import { ExtractionNotAvailableError } from "../../../extraction/domain/errors";
import { ExtractionStatus } from "../../../extraction/domain/ExtractionStatus";
import { Result } from "../../../../../shared/domain/Result";
import type { DomainError } from "../../../../../shared/domain/errors";

export interface GetExtractedTextInput {
  sourceId: string;
}

export class GetExtractedText {
  constructor(
    private readonly sourceRepository: SourceRepository,
    private readonly extractionJobRepository: ExtractionJobRepository,
  ) {}

  async execute(
    params: GetExtractedTextInput,
  ): Promise<Result<DomainError, { text: string }>> {
    const source = await this.sourceRepository.findById(
      SourceId.create(params.sourceId),
    );

    if (!source) {
      return Result.fail(new SourceNotFoundError(params.sourceId));
    }

    const jobs = await this.extractionJobRepository.findBySourceId(params.sourceId);
    const completed = jobs.filter(
      (job) => job.status === ExtractionStatus.Completed && job.extractedText !== null,
    );

    const latestCompleted = completed.length > 0
      ? completed.reduce((latest, job) =>
          job.completedAt! > latest.completedAt! ? job : latest,
        )
      : null;

    if (!latestCompleted || !latestCompleted.extractedText) {
      return Result.fail(new ExtractionNotAvailableError(params.sourceId));
    }

    return Result.ok({ text: latestCompleted.extractedText });
  }
}
