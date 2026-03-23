import type { SourceType } from "../../domain/SourceType";
import type { RegisterSource } from "./RegisterSource";

export interface BatchRegisterInput {
  sources: Array<{
    id: string;
    name: string;
    uri: string;
    type: SourceType;
  }>;
}

export interface BatchRegisterItemResult {
  sourceId: string;
  success: boolean;
  error?: string;
}

export class BatchRegister {
  constructor(
    private readonly registerSource: RegisterSource,
  ) {}

  async execute(
    params: BatchRegisterInput,
  ): Promise<BatchRegisterItemResult[]> {
    const results = await Promise.allSettled(
      params.sources.map((source) => this.registerSource.execute(source)),
    );

    return results.map((promiseResult, index) => {
      if (promiseResult.status === "fulfilled") {
        const result = promiseResult.value;
        if (result.isOk()) {
          return { sourceId: result.value.sourceId, success: true };
        }
        return {
          sourceId: params.sources[index].id,
          success: false,
          error: result.error.message,
        };
      }
      return {
        sourceId: params.sources[index].id,
        success: false,
        error: promiseResult.reason instanceof Error
          ? promiseResult.reason.message
          : String(promiseResult.reason),
      };
    });
  }
}
