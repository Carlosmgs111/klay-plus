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
