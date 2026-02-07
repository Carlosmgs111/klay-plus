// ─── Domain ────────────────────────────────────────────────────────
export {
  Source,
  SourceId,
  SourceType,
  SourceVersion,
  SourceRegistered,
  SourceUpdated,
  SourceExtracted,
} from "./domain/index.js";

export type {
  SourceRepository,
  SourceExtractor,
  ExtractionResult,
} from "./domain/index.js";

// ─── Application ───────────────────────────────────────────────────
export { RegisterSource, UpdateSource } from "./application/index.js";
export type {
  RegisterSourceCommand,
  UpdateSourceCommand,
} from "./application/index.js";

// ─── Infrastructure ────────────────────────────────────────────────
export { TextSourceExtractor } from "./infrastructure/adapters/TextSourceExtractor.js";
export { PdfBrowserExtractor } from "./infrastructure/adapters/PdfBrowserExtractor.js";
export { PdfServerExtractor } from "./infrastructure/adapters/PdfServerExtractor.js";

// ─── Composition ───────────────────────────────────────────────────
export { SourceUseCases } from "./SourceUseCases.js";
export { SourceComposer } from "./composition/SourceComposer.js";
export type {
  SourceInfrastructurePolicy,
  ResolvedSourceInfra,
} from "./composition/infra-policies.js";

// ─── Module Factory ────────────────────────────────────────────────
import type { SourceInfrastructurePolicy } from "./composition/infra-policies.js";
import type { SourceUseCases as _UseCases } from "./SourceUseCases.js";

export async function sourceFactory(
  policy: SourceInfrastructurePolicy,
): Promise<_UseCases> {
  const { SourceComposer } = await import("./composition/SourceComposer.js");
  const { SourceUseCases } = await import("./SourceUseCases.js");
  const infra = await SourceComposer.resolve(policy);
  return new SourceUseCases(infra.repository, infra.extractor, infra.eventPublisher);
}
