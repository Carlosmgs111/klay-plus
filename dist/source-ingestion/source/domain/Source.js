import { AggregateRoot } from "../../../shared/domain/index.js";
import { SourceVersion } from "./SourceVersion.js";
import { SourceRegistered } from "./events/SourceRegistered.js";
import { SourceUpdated } from "./events/SourceUpdated.js";
/**
 * Source aggregate - represents a reference to an external content source.
 * Does NOT store the actual content, only metadata and version tracking.
 * The extracted content is stored in ExtractionJob.
 */
export class Source extends AggregateRoot {
    _name;
    _type;
    _uri;
    _currentVersion;
    _versions;
    _registeredAt;
    constructor(id, name, type, uri, currentVersion, versions, registeredAt) {
        super(id);
        this._name = name;
        this._type = type;
        this._uri = uri;
        this._currentVersion = currentVersion;
        this._versions = versions;
        this._registeredAt = registeredAt;
    }
    get name() {
        return this._name;
    }
    get type() {
        return this._type;
    }
    get uri() {
        return this._uri;
    }
    get currentVersion() {
        return this._currentVersion;
    }
    get versions() {
        return [...this._versions];
    }
    get registeredAt() {
        return this._registeredAt;
    }
    get hasBeenExtracted() {
        return this._currentVersion !== null;
    }
    /**
     * Registers a new source. Content extraction happens separately.
     */
    static register(id, name, type, uri) {
        if (!name)
            throw new Error("Source name is required");
        if (!uri)
            throw new Error("Source uri is required");
        const source = new Source(id, name, type, uri, null, // No version until extraction
        [], new Date());
        source.record({
            eventId: crypto.randomUUID(),
            occurredOn: new Date(),
            eventType: SourceRegistered.EVENT_TYPE,
            aggregateId: id.value,
            payload: {
                name,
                type,
                uri,
            },
        });
        return source;
    }
    static reconstitute(id, name, type, uri, currentVersion, versions, registeredAt) {
        return new Source(id, name, type, uri, currentVersion, versions, registeredAt);
    }
    /**
     * Records that content was extracted. Only stores the hash.
     * Returns true if this is a new version (content changed), false otherwise.
     */
    recordExtraction(contentHash) {
        if (this._currentVersion && !this._currentVersion.hasChanged(contentHash)) {
            return false;
        }
        const newVersion = this._currentVersion
            ? this._currentVersion.next(contentHash)
            : SourceVersion.initial(contentHash);
        this._currentVersion = newVersion;
        this._versions.push(newVersion);
        this.record({
            eventId: crypto.randomUUID(),
            occurredOn: new Date(),
            eventType: SourceUpdated.EVENT_TYPE,
            aggregateId: this.id.value,
            payload: {
                version: newVersion.version,
                contentHash,
            },
        });
        return true;
    }
}
//# sourceMappingURL=Source.js.map