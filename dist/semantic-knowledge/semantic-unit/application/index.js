// ─── Use Cases ─────────────────────────────────────────────────────
export { CreateSemanticUnit } from "./CreateSemanticUnit.js";
export { VersionSemanticUnit } from "./VersionSemanticUnit.js";
export { DeprecateSemanticUnit } from "./DeprecateSemanticUnit.js";
export { ReprocessSemanticUnit } from "./ReprocessSemanticUnit.js";
// ─── Use Cases Facade ──────────────────────────────────────────────
import { CreateSemanticUnit } from "./CreateSemanticUnit.js";
import { VersionSemanticUnit } from "./VersionSemanticUnit.js";
import { DeprecateSemanticUnit } from "./DeprecateSemanticUnit.js";
import { ReprocessSemanticUnit } from "./ReprocessSemanticUnit.js";
export class SemanticUnitUseCases {
    createSemanticUnit;
    versionSemanticUnit;
    deprecateSemanticUnit;
    reprocessSemanticUnit;
    constructor(repository, eventPublisher) {
        this.createSemanticUnit = new CreateSemanticUnit(repository, eventPublisher);
        this.versionSemanticUnit = new VersionSemanticUnit(repository, eventPublisher);
        this.deprecateSemanticUnit = new DeprecateSemanticUnit(repository, eventPublisher);
        this.reprocessSemanticUnit = new ReprocessSemanticUnit(repository, eventPublisher);
    }
}
//# sourceMappingURL=index.js.map