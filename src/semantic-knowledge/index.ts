// Semantic Unit module
export {
  SemanticUnit,
  SemanticUnitId,
  SemanticVersion,
  SemanticState,
  Origin,
  Meaning,
  UnitMetadata,
  SemanticUnitCreated,
  SemanticUnitVersioned,
  SemanticUnitDeprecated,
  SemanticUnitReprocessRequested,
} from "./semantic-unit/domain/index.js";

export type { SemanticUnitRepository } from "./semantic-unit/domain/index.js";

export {
  CreateSemanticUnit,
  VersionSemanticUnit,
  DeprecateSemanticUnit,
  ReprocessSemanticUnit,
} from "./semantic-unit/application/index.js";

export type {
  CreateSemanticUnitCommand,
  VersionSemanticUnitCommand,
  DeprecateSemanticUnitCommand,
  ReprocessSemanticUnitCommand,
} from "./semantic-unit/application/index.js";

// Lineage module
export {
  KnowledgeLineage,
  LineageId,
  Transformation,
  TransformationType,
  Trace,
} from "./lineage/domain/index.js";

export type { KnowledgeLineageRepository } from "./lineage/domain/index.js";

export { RegisterTransformation } from "./lineage/application/index.js";
export type { RegisterTransformationCommand } from "./lineage/application/index.js";

// ─── Composition ───────────────────────────────────────────────────
export { SemanticKnowledgeUseCases } from "./SemanticKnowledgeUseCases.js";
export { SemanticKnowledgeComposer } from "./composition/SemanticKnowledgeComposer.js";
export type {
  SemanticKnowledgeInfrastructurePolicy,
  ResolvedSemanticKnowledgeInfra,
} from "./composition/infra-policies.js";

// ─── Module Factory ────────────────────────────────────────────────
import type { SemanticKnowledgeInfrastructurePolicy } from "./composition/infra-policies.js";
import type { SemanticKnowledgeUseCases as _SKUseCases } from "./SemanticKnowledgeUseCases.js";

export async function semanticKnowledgeFactory(
  policy: SemanticKnowledgeInfrastructurePolicy,
): Promise<_SKUseCases> {
  const { SemanticKnowledgeComposer } = await import(
    "./composition/SemanticKnowledgeComposer.js"
  );
  const { SemanticKnowledgeUseCases } = await import(
    "./SemanticKnowledgeUseCases.js"
  );
  const infra = await SemanticKnowledgeComposer.resolve(policy);
  return new SemanticKnowledgeUseCases(
    infra.semanticUnitRepository,
    infra.lineageRepository,
    infra.eventPublisher,
  );
}
