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
import type { SemanticUnitInfrastructurePolicy } from "./composition/infra-policies.js";
import type { SemanticUnitUseCases as _UseCases } from "./application/index.js";

export async function semanticUnitFactory(
  policy: SemanticUnitInfrastructurePolicy,
): Promise<_UseCases> {
  const { SemanticUnitComposer } = await import("./composition/SemanticUnitComposer.js");
  const { SemanticUnitUseCases } = await import("./application/index.js");
  const infra = await SemanticUnitComposer.resolve(policy);
  return new SemanticUnitUseCases(infra.repository, infra.eventPublisher);
}
