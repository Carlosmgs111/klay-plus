// Semantic Unit Module
export {
  SemanticUnit,
  SemanticUnitId,
  UnitSource,
  UnitVersion,
  VersionSourceSnapshot,
  SemanticState,
  UnitMetadata,
  SemanticUnitCreated,
  SemanticUnitVersioned,
  SemanticUnitDeprecated,
  SemanticUnitReprocessRequested,
  SemanticUnitSourceAdded,
  SemanticUnitSourceRemoved,
  SemanticUnitRolledBack,
  semanticUnitFactory,
} from "./semantic-unit";

export type {
  SemanticUnitRepository,
  SemanticUnitInfrastructurePolicy,
  ResolvedSemanticUnitInfra,
  SemanticUnitFactoryResult,
} from "./semantic-unit";

// Lineage Module
export {
  KnowledgeLineage,
  LineageId,
  Transformation,
  TransformationType,
  Trace,
  lineageFactory,
} from "./lineage";

export type {
  KnowledgeLineageRepository,
  LineageInfrastructurePolicy,
  ResolvedLineageInfra,
  LineageFactoryResult,
} from "./lineage";

// Facade Module (Recommended Entry Point)
export {
  SemanticKnowledgeFacade,
  createSemanticKnowledgeFacade,
  SemanticUnitNotFoundError,
  SemanticUnitAlreadyExistsError,
  SemanticUnitOperationError,
  LineageNotFoundError,
  LineageOperationError,
} from "./facade";

export type {
  SemanticKnowledgeFacadePolicy,
  ResolvedSemanticKnowledgeModules,
  CreateSemanticUnitSuccess,
  CreateSemanticUnitWithLineageSuccess,
  AddSourceSuccess,
  RemoveSourceSuccess,
  ReprocessSuccess,
  RollbackSuccess,
  DeprecateSemanticUnitWithLineageSuccess,
} from "./facade";
