// Source module
export {
  Source,
  SourceId,
  SourceType,
  SourceVersion,
  SourceRegistered,
  SourceUpdated,
  SourceExtracted,
} from "./source/domain/index.js";

export type {
  SourceRepository,
  SourceExtractor,
  ExtractionResult,
} from "./source/domain/index.js";

export { RegisterSource, UpdateSource } from "./source/application/index.js";
export type {
  RegisterSourceCommand,
  UpdateSourceCommand,
} from "./source/application/index.js";

// Extraction module
export {
  ExtractionJob,
  ExtractionJobId,
  ExtractionStatus,
  ExtractionCompleted,
  ExtractionFailed,
} from "./extraction/domain/index.js";

export type { ExtractionJobRepository } from "./extraction/domain/index.js";

export { ExecuteExtraction } from "./extraction/application/index.js";
export type { ExecuteExtractionCommand } from "./extraction/application/index.js";

// ─── Composition ───────────────────────────────────────────────────
export { SourceIngestionUseCases } from "./SourceIngestionUseCases.js";
export { SourceIngestionComposer } from "./composition/SourceIngestionComposer.js";
export type {
  SourceIngestionInfrastructurePolicy,
  ResolvedSourceIngestionInfra,
} from "./composition/infra-policies.js";

// ─── Module Factory ────────────────────────────────────────────────
import type { SourceIngestionInfrastructurePolicy } from "./composition/infra-policies.js";
import type { SourceIngestionUseCases as _SIUseCases } from "./SourceIngestionUseCases.js";

export async function sourceIngestionFactory(
  policy: SourceIngestionInfrastructurePolicy,
): Promise<_SIUseCases> {
  const { SourceIngestionComposer } = await import(
    "./composition/SourceIngestionComposer.js"
  );
  const { SourceIngestionUseCases } = await import(
    "./SourceIngestionUseCases.js"
  );
  const infra = await SourceIngestionComposer.resolve(policy);
  return new SourceIngestionUseCases(
    infra.sourceRepository,
    infra.extractionJobRepository,
    infra.sourceExtractor,
    infra.eventPublisher,
  );
}
