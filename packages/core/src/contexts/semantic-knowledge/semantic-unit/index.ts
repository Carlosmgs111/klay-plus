// ─── Domain ────────────────────────────────────────────────────────
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
} from "./domain/index.js";

export type { SemanticUnitRepository } from "./domain/index.js";

// ─── Application ───────────────────────────────────────────────────
export {
  CreateSemanticUnit,
  VersionSemanticUnit,
  DeprecateSemanticUnit,
  ReprocessSemanticUnit,
  SemanticUnitUseCases,
} from "./application/index.js";

export type {
  CreateSemanticUnitCommand,
  VersionSemanticUnitCommand,
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
