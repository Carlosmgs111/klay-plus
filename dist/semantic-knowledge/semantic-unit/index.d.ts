export { SemanticUnit, SemanticUnitId, SemanticVersion, SemanticState, Origin, Meaning, UnitMetadata, SemanticUnitCreated, SemanticUnitVersioned, SemanticUnitDeprecated, SemanticUnitReprocessRequested, } from "./domain/index.js";
export type { SemanticUnitRepository } from "./domain/index.js";
export { CreateSemanticUnit, VersionSemanticUnit, DeprecateSemanticUnit, ReprocessSemanticUnit, SemanticUnitUseCases, } from "./application/index.js";
export type { CreateSemanticUnitCommand, VersionSemanticUnitCommand, DeprecateSemanticUnitCommand, ReprocessSemanticUnitCommand, } from "./application/index.js";
export { SemanticUnitComposer } from "./composition/SemanticUnitComposer.js";
export type { SemanticUnitInfrastructurePolicy, ResolvedSemanticUnitInfra, } from "./composition/infra-policies.js";
import type { SemanticUnitInfrastructurePolicy } from "./composition/infra-policies.js";
import type { SemanticUnitUseCases as _UseCases } from "./application/index.js";
export declare function semanticUnitFactory(policy: SemanticUnitInfrastructurePolicy): Promise<_UseCases>;
//# sourceMappingURL=index.d.ts.map