// ═══════════════════════════════════════════════════════════════════════════
// Semantic Unit Module
// ═══════════════════════════════════════════════════════════════════════════
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
  SemanticUnitUseCases,
  SemanticUnitComposer,
  CreateSemanticUnit,
  VersionSemanticUnit,
  DeprecateSemanticUnit,
  ReprocessSemanticUnit,
  semanticUnitFactory,
} from "./semantic-unit/index.js";

export type {
  SemanticUnitRepository,
  SemanticUnitInfrastructurePolicy,
  ResolvedSemanticUnitInfra,
  CreateSemanticUnitCommand,
  VersionSemanticUnitCommand,
  DeprecateSemanticUnitCommand,
  ReprocessSemanticUnitCommand,
} from "./semantic-unit/index.js";

// ═══════════════════════════════════════════════════════════════════════════
// Lineage Module
// ═══════════════════════════════════════════════════════════════════════════
export {
  KnowledgeLineage,
  LineageId,
  Transformation,
  TransformationType,
  Trace,
  LineageUseCases,
  LineageComposer,
  RegisterTransformation,
  lineageFactory,
} from "./lineage/index.js";

export type {
  KnowledgeLineageRepository,
  LineageInfrastructurePolicy,
  ResolvedLineageInfra,
  RegisterTransformationCommand,
} from "./lineage/index.js";

// ═══════════════════════════════════════════════════════════════════════════
// Orchestrator Module
// ═══════════════════════════════════════════════════════════════════════════
export {
  SemanticKnowledgeOrchestrator,
  SemanticKnowledgeOrchestratorComposer,
  semanticKnowledgeOrchestratorFactory,
} from "./orchestrator/index.js";

export type {
  SemanticKnowledgeOrchestratorPolicy,
  SemanticKnowledgeInfraPolicy,
  ResolvedSemanticKnowledgeModules,
} from "./orchestrator/index.js";
