import { AggregateRoot } from "../../../shared/domain/index.js";
import { SourceId } from "./SourceId.js";
import type { SourceType } from "./SourceType.js";
import { SourceVersion } from "./SourceVersion.js";
/**
 * Source aggregate - represents a reference to an external content source.
 * Does NOT store the actual content, only metadata and version tracking.
 * The extracted content is stored in ExtractionJob.
 */
export declare class Source extends AggregateRoot<SourceId> {
    private _name;
    private _type;
    private _uri;
    private _currentVersion;
    private _versions;
    private _registeredAt;
    private constructor();
    get name(): string;
    get type(): SourceType;
    get uri(): string;
    get currentVersion(): SourceVersion | null;
    get versions(): ReadonlyArray<SourceVersion>;
    get registeredAt(): Date;
    get hasBeenExtracted(): boolean;
    /**
     * Registers a new source. Content extraction happens separately.
     */
    static register(id: SourceId, name: string, type: SourceType, uri: string): Source;
    static reconstitute(id: SourceId, name: string, type: SourceType, uri: string, currentVersion: SourceVersion | null, versions: SourceVersion[], registeredAt: Date): Source;
    /**
     * Records that content was extracted. Only stores the hash.
     * Returns true if this is a new version (content changed), false otherwise.
     */
    recordExtraction(contentHash: string): boolean;
}
//# sourceMappingURL=Source.d.ts.map