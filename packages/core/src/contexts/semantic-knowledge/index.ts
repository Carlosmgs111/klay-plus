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
  SemanticUnitFactoryResult,
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
  LineageFactoryResult,
  RegisterTransformationCommand,
} from "./lineage/index.js";

// ═══════════════════════════════════════════════════════════════════════════
// Facade Module (Recommended Entry Point)
// ═══════════════════════════════════════════════════════════════════════════
export {
  SemanticKnowledgeFacade,
  SemanticKnowledgeFacadeComposer,
  createSemanticKnowledgeFacade,
  SemanticUnitNotFoundError,
  SemanticUnitAlreadyExistsError,
  SemanticUnitOperationError,
  LineageNotFoundError,
  LineageOperationError,
} from "./facade/index.js";

export type {
  SemanticKnowledgeFacadePolicy,
  ResolvedSemanticKnowledgeModules,
  CreateSemanticUnitWithLineageSuccess,
  VersionSemanticUnitWithLineageSuccess,
  DeprecateSemanticUnitWithLineageSuccess,
} from "./facade/index.js";
