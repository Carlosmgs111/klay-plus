import type { ExtractionInfrastructurePolicy } from "./factory";
import type { ExecuteExtraction } from "../application/ExecuteExtraction";
import type { ExtractionJobRepository } from "../domain/ExtractionJobRepository";

export interface ExtractionWiringResult {
  executeExtraction: ExecuteExtraction;
  /** Exposed for intra-context use by source module (SourceQueries) */
  extractionJobRepository: ExtractionJobRepository;
}

export async function extractionWiring(
  policy: ExtractionInfrastructurePolicy,
): Promise<ExtractionWiringResult> {
  const { extractionFactory } = await import("./factory");
  const { useCases, infra } = await extractionFactory(policy);

  return {
    executeExtraction: useCases.executeExtraction,
    extractionJobRepository: infra.repository,
  };
}
