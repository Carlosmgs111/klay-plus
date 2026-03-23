import type { ExecuteSemanticQueryCommand } from "./ExecuteSemanticQuery";
import { ExecuteSemanticQuery } from "./ExecuteSemanticQuery";
import type { RetrievalResult } from "../../domain/RetrievalResult";

export interface BatchQueryResult {
  results: Array<RetrievalResult | { error: unknown }>;
}

/**
 * BatchQuery — executes multiple semantic queries in parallel.
 *
 * Uses Promise.allSettled so individual query failures are captured
 * without aborting the whole batch.
 */
export class BatchQuery {
  constructor(private readonly _executeQuery: ExecuteSemanticQuery) {}

  async execute(
    queries: ExecuteSemanticQueryCommand[],
  ): Promise<BatchQueryResult> {
    const settled = await Promise.allSettled(
      queries.map((q) => this._executeQuery.execute(q)),
    );

    const results = settled.map((outcome) => {
      if (outcome.status === "fulfilled") {
        return outcome.value;
      }
      return { error: outcome.reason };
    });

    return { results };
  }
}
