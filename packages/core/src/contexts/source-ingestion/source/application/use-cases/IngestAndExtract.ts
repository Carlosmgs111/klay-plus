import type { SourceRepository } from "../../domain/SourceRepository";
import type { EventPublisher } from "../../../../../shared/domain/EventPublisher";
import type { ExecuteExtraction } from "../../../extraction/application/ExecuteExtraction";
import { SourceId } from "../../domain/SourceId";
import type { SourceType } from "../../domain/SourceType";
import { SourceType as SourceTypeEnum } from "../../domain/SourceType";
import { Result } from "../../../../../shared/domain/Result";
import type { DomainError } from "../../../../../shared/domain/errors";
import { RegisterSource } from "./RegisterSource";

const SOURCE_TYPE_TO_MIME: Record<SourceType, string> = {
  [SourceTypeEnum.Pdf]: "application/pdf",
  [SourceTypeEnum.Web]: "text/html",
  [SourceTypeEnum.Api]: "application/json",
  [SourceTypeEnum.PlainText]: "text/plain",
  [SourceTypeEnum.Markdown]: "text/markdown",
  [SourceTypeEnum.Csv]: "text/csv",
  [SourceTypeEnum.Json]: "application/json",
};

export interface IngestAndExtractInput {
  sourceId: string;
  sourceName: string;
  uri: string;
  type: SourceType;
  extractionJobId: string;
  content?: ArrayBuffer;
}

export interface IngestAndExtractSuccess {
  sourceId: string;
  jobId: string;
  contentHash: string;
  extractedText: string;
  metadata: Record<string, unknown>;
}

export class IngestAndExtract {
  private readonly registerSource: RegisterSource;

  constructor(
    private readonly sourceRepository: SourceRepository,
    private readonly eventPublisher: EventPublisher,
    private readonly executeExtraction: ExecuteExtraction,
  ) {
    this.registerSource = new RegisterSource(sourceRepository, eventPublisher);
  }

  async execute(
    params: IngestAndExtractInput,
  ): Promise<Result<DomainError, IngestAndExtractSuccess>> {
    // 1. Register source
    const registerResult = await this.registerSource.execute({
      id: params.sourceId,
      name: params.sourceName,
      uri: params.uri,
      type: params.type,
    });

    if (registerResult.isFail()) {
      return Result.fail(registerResult.error);
    }

    // 2. Execute extraction
    const mimeType = SOURCE_TYPE_TO_MIME[params.type];
    const extractionResult = await this.executeExtraction.execute({
      jobId: params.extractionJobId,
      sourceId: params.sourceId,
      uri: params.uri,
      mimeType,
      content: params.content,
    });

    if (extractionResult.isFail()) {
      return Result.fail(extractionResult.error);
    }

    // 3. Update source with content hash
    const sourceId = SourceId.create(params.sourceId);
    const source = await this.sourceRepository.findById(sourceId);
    if (source) {
      const changed = source.recordExtraction(extractionResult.value.contentHash);
      if (changed) {
        await this.sourceRepository.save(source);
        await this.eventPublisher.publishAll(source.clearEvents());
      }
    }

    return Result.ok({
      sourceId: params.sourceId,
      jobId: params.extractionJobId,
      contentHash: extractionResult.value.contentHash,
      extractedText: extractionResult.value.extractedText,
      metadata: extractionResult.value.metadata,
    });
  }
}
