import type { IngestSource, IngestSourceInput } from "./IngestSource";

export interface BatchIngestItemResult {
  sourceId: string;
  jobId?: string;
  success: boolean;
  contentHash?: string;
  error?: string;
}

/**
 * BatchIngest — maps IngestSource over an array of inputs.
 *
 * Merges: BatchRegister (maps RegisterSource) + BatchIngestAndExtract (maps IngestAndExtract)
 * Both are subsumed by IngestSource which handles both file and external paths.
 */
export class BatchIngest {
  constructor(
    private readonly _ingestSource: IngestSource,
  ) {}

  async execute(
    inputs: IngestSourceInput[],
  ): Promise<BatchIngestItemResult[]> {
    const results = await Promise.allSettled(
      inputs.map((input) => this._ingestSource.execute(input)),
    );

    return results.map((promiseResult, index) => {
      const sourceId = inputs[index].sourceId;
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
          sourceId,
          success: false,
          error: result.error.message,
        };
      }
      return {
        sourceId,
        success: false,
        error: promiseResult.reason instanceof Error
          ? promiseResult.reason.message
          : String(promiseResult.reason),
      };
    });
  }
}
