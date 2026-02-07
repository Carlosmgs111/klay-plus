import type { SemanticUnitRepository } from "../domain/SemanticUnitRepository.js";
import type { EventPublisher } from "../../../shared/domain/EventPublisher.js";
export { CreateSemanticUnit } from "./CreateSemanticUnit.js";
export type { CreateSemanticUnitCommand } from "./CreateSemanticUnit.js";
export { VersionSemanticUnit } from "./VersionSemanticUnit.js";
export type { VersionSemanticUnitCommand } from "./VersionSemanticUnit.js";
export { DeprecateSemanticUnit } from "./DeprecateSemanticUnit.js";
export type { DeprecateSemanticUnitCommand } from "./DeprecateSemanticUnit.js";
export { ReprocessSemanticUnit } from "./ReprocessSemanticUnit.js";
export type { ReprocessSemanticUnitCommand } from "./ReprocessSemanticUnit.js";
import { CreateSemanticUnit } from "./CreateSemanticUnit.js";
import { VersionSemanticUnit } from "./VersionSemanticUnit.js";
import { DeprecateSemanticUnit } from "./DeprecateSemanticUnit.js";
import { ReprocessSemanticUnit } from "./ReprocessSemanticUnit.js";
export declare class SemanticUnitUseCases {
    readonly createSemanticUnit: CreateSemanticUnit;
    readonly versionSemanticUnit: VersionSemanticUnit;
    readonly deprecateSemanticUnit: DeprecateSemanticUnit;
    readonly reprocessSemanticUnit: ReprocessSemanticUnit;
    constructor(repository: SemanticUnitRepository, eventPublisher: EventPublisher);
}
//# sourceMappingURL=index.d.ts.map