import type { ProjectionType } from "../../domain/ProjectionType";
import type { ProcessContent } from "./ProcessContent";

export interface BatchProcessContentItem {
  projectionId: string;
  sourceId: string;
  content: string;
  type: ProjectionType;
  processingProfileId: string;
}

export interface BatchProcessContentResult {
  projectionId: string;
  success: boolean;
  chunksCount?: number;
  error?: string;
}

export class BatchProcessContent {
  constructor(
    private readonly _processContent: ProcessContent,
  ) {}

  async execute(
    items: BatchProcessContentItem[],
  ): Promise<BatchProcessContentResult[]> {
    const results = await Promise.allSettled(
      items.map((item) => this._processContent.execute(item)),
    );

    return results.map((promiseResult, index) => {
      if (promiseResult.status === "fulfilled") {
        const result = promiseResult.value;
        if (result.isOk()) {
          return {
            projectionId: result.value.projectionId,
            success: true,
            chunksCount: result.value.chunksCount,
          };
        }
        return {
          projectionId: items[index].projectionId,
          success: false,
          error: result.error.message,
        };
      }
      return {
        projectionId: items[index].projectionId,
        success: false,
        error:
          promiseResult.reason instanceof Error
            ? promiseResult.reason.message
            : String(promiseResult.reason),
      };
    });
  }
}
