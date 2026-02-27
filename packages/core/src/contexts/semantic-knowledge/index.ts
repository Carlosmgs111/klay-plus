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
  SemanticUnitUseCases,
  SemanticUnitComposer,
  CreateSemanticUnit,
  AddSourceToSemanticUnit,
  RemoveSourceFromSemanticUnit,
  RollbackSemanticUnit,
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
  AddSourceCommand,
  RemoveSourceCommand,
  RollbackSemanticUnitCommand,
  DeprecateSemanticUnitCommand,
  ReprocessSemanticUnitCommand,
} from "./semantic-unit/index.js";

// Lineage Module
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

// Facade Module (Recommended Entry Point)
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
  CreateSemanticUnitSuccess,
  CreateSemanticUnitWithLineageSuccess,
  AddSourceSuccess,
  RemoveSourceSuccess,
  ReprocessSuccess,
  RollbackSuccess,
  DeprecateSemanticUnitWithLineageSuccess,
} from "./facade/index.js";
