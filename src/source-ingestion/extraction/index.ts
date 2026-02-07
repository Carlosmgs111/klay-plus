// ─── Domain ────────────────────────────────────────────────────────
export {
  ExtractionJob,
  ExtractionJobId,
  ExtractionStatus,
  ExtractionCompleted,
  ExtractionFailed,
} from "./domain/index.js";

export type { ExtractionJobRepository } from "./domain/index.js";

// ─── Application ───────────────────────────────────────────────────
export { ExecuteExtraction } from "./application/index.js";
export type { ExecuteExtractionCommand } from "./application/index.js";

// ─── Composition ───────────────────────────────────────────────────
export { ExtractionUseCases } from "./ExtractionUseCases.js";
export { ExtractionComposer } from "./composition/ExtractionComposer.js";
export type {
  ExtractionInfrastructurePolicy,
  ResolvedExtractionInfra,
} from "./composition/infra-policies.js";

// ─── Module Factory ────────────────────────────────────────────────
import type { ExtractionInfrastructurePolicy } from "./composition/infra-policies.js";
import type { ExtractionUseCases as _UseCases } from "./ExtractionUseCases.js";

export async function extractionFactory(
  policy: ExtractionInfrastructurePolicy,
): Promise<_UseCases> {
  const { ExtractionComposer } = await import("./composition/ExtractionComposer.js");
  const { ExtractionUseCases } = await import("./ExtractionUseCases.js");
  const infra = await ExtractionComposer.resolve(policy);
  return new ExtractionUseCases(
    infra.repository,
    infra.sourceRepository,
    infra.sourceExtractor,
    infra.eventPublisher,
  );
}
