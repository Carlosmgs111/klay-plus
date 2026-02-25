// ─── Domain ────────────────────────────────────────────────────────
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
} from "./domain/index.js";

export type { SemanticUnitRepository } from "./domain/index.js";

// ─── Application ───────────────────────────────────────────────────
export {
  CreateSemanticUnit,
  AddSourceToSemanticUnit,
  RemoveSourceFromSemanticUnit,
  RollbackSemanticUnit,
  DeprecateSemanticUnit,
  ReprocessSemanticUnit,
  SemanticUnitUseCases,
} from "./application/index.js";

export type {
  CreateSemanticUnitCommand,
  AddSourceCommand,
  RemoveSourceCommand,
  RollbackSemanticUnitCommand,
  DeprecateSemanticUnitCommand,
  ReprocessSemanticUnitCommand,
} from "./application/index.js";

// ─── Composition ───────────────────────────────────────────────────
export { SemanticUnitComposer } from "./composition/SemanticUnitComposer.js";
export type {
  SemanticUnitInfrastructurePolicy,
  ResolvedSemanticUnitInfra,
} from "./composition/infra-policies.js";

// ─── Module Factory ────────────────────────────────────────────────
export { semanticUnitFactory } from "./composition/semantic-unit.factory.js";
export type { SemanticUnitFactoryResult } from "./composition/semantic-unit.factory.js";
