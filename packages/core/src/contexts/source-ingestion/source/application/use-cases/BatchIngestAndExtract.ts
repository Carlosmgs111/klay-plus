import type { SourceType } from "../../domain/SourceType";
import type { IngestAndExtract } from "./IngestAndExtract";

export interface BatchIngestAndExtractInput {
  sources: Array<{
    sourceId: string;
    sourceName: string;
    uri: string;
    type: SourceType;
    extractionJobId: string;
  }>;
}

export interface BatchIngestAndExtractItemResult {
  sourceId: string;
  jobId: string;
  success: boolean;
  contentHash?: string;
  error?: string;
}

export class BatchIngestAndExtract {
  constructor(
    private readonly ingestAndExtract: IngestAndExtract,
  ) {}

  async execute(
    params: BatchIngestAndExtractInput,
  ): Promise<BatchIngestAndExtractItemResult[]> {
    const results = await Promise.allSettled(
      params.sources.map((source) => this.ingestAndExtract.execute(source)),
    );

    return results.map((promiseResult, index) => {
      if (promiseResult.status === "fulfilled") {
        const result = promiseResult.value;
        if (result.isOk()) {
          return {
            sourceId: result.value.sourceId,
            jobId: result.value.jobId,
            success: true,
            contentHash: result.value.contentHash,
          };
        }
        return {
          sourceId: params.sources[index].sourceId,
          jobId: params.sources[index].extractionJobId,
          success: false,
          error: result.error.message,
        };
      }
      return {
        sourceId: params.sources[index].sourceId,
        jobId: params.sources[index].extractionJobId,
        success: false,
        error: promiseResult.reason instanceof Error
          ? promiseResult.reason.message
          : String(promiseResult.reason),
      };
    });
  }
}
