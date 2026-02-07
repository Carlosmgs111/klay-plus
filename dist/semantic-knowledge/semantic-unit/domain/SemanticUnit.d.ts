import { AggregateRoot } from "../../../shared/domain/index.js";
import { SemanticUnitId } from "./SemanticUnitId.js";
import { SemanticVersion } from "./SemanticVersion.js";
import { SemanticState } from "./SemanticState.js";
import { Origin } from "./Origin.js";
import { Meaning } from "./Meaning.js";
import { UnitMetadata } from "./UnitMetadata.js";
export declare class SemanticUnit extends AggregateRoot<SemanticUnitId> {
    private _state;
    private _origin;
    private _currentVersion;
    private _versions;
    private _metadata;
    private constructor();
    get state(): SemanticState;
    get origin(): Origin;
    get currentVersion(): SemanticVersion;
    get versions(): ReadonlyArray<SemanticVersion>;
    get metadata(): UnitMetadata;
    static create(id: SemanticUnitId, origin: Origin, meaning: Meaning, metadata: UnitMetadata): SemanticUnit;
    static reconstitute(id: SemanticUnitId, state: SemanticState, origin: Origin, currentVersion: SemanticVersion, versions: SemanticVersion[], metadata: UnitMetadata): SemanticUnit;
    addVersion(meaning: Meaning, reason: string): void;
    activate(): void;
    deprecate(reason: string): void;
    archive(): void;
    requestReprocessing(reason: string): void;
    private transitionTo;
}
//# sourceMappingURL=SemanticUnit.d.ts.map