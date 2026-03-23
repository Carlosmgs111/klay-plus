import type { SourceRepository } from "../../domain/SourceRepository";
import type { EventPublisher } from "../../../../../shared/domain/EventPublisher";
import type { ExecuteExtraction } from "../../../extraction/application/ExecuteExtraction";
import { SourceId } from "../../domain/SourceId";
import type { SourceType } from "../../domain/SourceType";
import { SourceType as SourceTypeEnum } from "../../domain/SourceType";
import { SourceNotFoundError } from "../../domain/errors";
import { Result } from "../../../../../shared/domain/Result";
import type { DomainError } from "../../../../../shared/domain/errors";

const SOURCE_TYPE_TO_MIME: Record<SourceType, string> = {
  [SourceTypeEnum.Pdf]: "application/pdf",
  [SourceTypeEnum.Web]: "text/html",
  [SourceTypeEnum.Api]: "application/json",
  [SourceTypeEnum.PlainText]: "text/plain",
  [SourceTypeEnum.Markdown]: "text/markdown",
  [SourceTypeEnum.Csv]: "text/csv",
  [SourceTypeEnum.Json]: "application/json",
};

export interface ExtractSourceInput {
  jobId: string;
  sourceId: string;
}

export interface ExtractSourceSuccess {
  jobId: string;
  contentHash: string;
  changed: boolean;
}

export class ExtractSource {
  constructor(
    private readonly sourceRepository: SourceRepository,
    private readonly eventPublisher: EventPublisher,
    private readonly executeExtraction: ExecuteExtraction,
  ) {}

  async execute(
    params: ExtractSourceInput,
  ): Promise<Result<DomainError, ExtractSourceSuccess>> {
    const sourceId = SourceId.create(params.sourceId);
    const source = await this.sourceRepository.findById(sourceId);

    if (!source) {
      return Result.fail(new SourceNotFoundError(params.sourceId));
    }

    const mimeType = SOURCE_TYPE_TO_MIME[source.type];
    const extractionResult = await this.executeExtraction.execute({
      jobId: params.jobId,
      sourceId: params.sourceId,
      uri: source.uri,
      mimeType,
    });

    if (extractionResult.isFail()) {
      return Result.fail(extractionResult.error);
    }

    const changed = source.recordExtraction(extractionResult.value.contentHash);
    if (changed) {
      await this.sourceRepository.save(source);
      await this.eventPublisher.publishAll(source.clearEvents());
    }

    return Result.ok({
      jobId: params.jobId,
      contentHash: extractionResult.value.contentHash,
      changed,
    });
  }
}
