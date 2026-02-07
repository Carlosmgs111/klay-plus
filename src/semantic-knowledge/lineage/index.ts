// ─── Domain ────────────────────────────────────────────────────────
export {
  KnowledgeLineage,
  LineageId,
  Transformation,
  TransformationType,
  Trace,
} from "./domain/index.js";

export type { KnowledgeLineageRepository } from "./domain/index.js";

// ─── Application ───────────────────────────────────────────────────
export { RegisterTransformation } from "./application/index.js";
export type { RegisterTransformationCommand } from "./application/index.js";

// ─── Composition ───────────────────────────────────────────────────
export { LineageUseCases } from "./LineageUseCases.js";
export { LineageComposer } from "./composition/LineageComposer.js";
export type {
  LineageInfrastructurePolicy,
  ResolvedLineageInfra,
} from "./composition/infra-policies.js";

// ─── Module Factory ────────────────────────────────────────────────
import type { LineageInfrastructurePolicy } from "./composition/infra-policies.js";
import type { LineageUseCases as _UseCases } from "./LineageUseCases.js";

export async function lineageFactory(
  policy: LineageInfrastructurePolicy,
): Promise<_UseCases> {
  const { LineageComposer } = await import("./composition/LineageComposer.js");
  const { LineageUseCases } = await import("./LineageUseCases.js");
  const infra = await LineageComposer.resolve(policy);
  return new LineageUseCases(infra.repository, infra.eventPublisher);
}
