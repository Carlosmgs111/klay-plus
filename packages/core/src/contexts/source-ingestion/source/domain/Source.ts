import { AggregateRoot } from "../../../../shared/domain/index";
import { SourceId } from "./SourceId.js";
import type { SourceType } from "./SourceType.js";
import { SourceVersion } from "./SourceVersion.js";
import { SourceRegistered } from "./events/SourceRegistered.js";
import { SourceUpdated } from "./events/SourceUpdated.js";

/**
 * Source aggregate - represents a reference to an external content source.
 * Does NOT store the actual content, only metadata and version tracking.
 * The extracted content is stored in ExtractionJob.
 */
export class Source extends AggregateRoot<SourceId> {
  private _name: string;
  private _type: SourceType;
  private _uri: string;
  private _currentVersion: SourceVersion | null;
  private _versions: SourceVersion[];
  private _registeredAt: Date;

  private constructor(
    id: SourceId,
    name: string,
    type: SourceType,
    uri: string,
    currentVersion: SourceVersion | null,
    versions: SourceVersion[],
    registeredAt: Date,
  ) {
    super(id);
    this._name = name;
    this._type = type;
    this._uri = uri;
    this._currentVersion = currentVersion;
    this._versions = versions;
    this._registeredAt = registeredAt;
  }

  get name(): string {
    return this._name;
  }

  get type(): SourceType {
    return this._type;
  }

  get uri(): string {
    return this._uri;
  }

  get currentVersion(): SourceVersion | null {
    return this._currentVersion;
  }

  get versions(): ReadonlyArray<SourceVersion> {
    return [...this._versions];
  }

  get registeredAt(): Date {
    return this._registeredAt;
  }

  get hasBeenExtracted(): boolean {
    return this._currentVersion !== null;
  }

  /**
   * Registers a new source. Content extraction happens separately.
   */
  static register(
    id: SourceId,
    name: string,
    type: SourceType,
    uri: string,
  ): Source {
    if (!name) throw new Error("Source name is required");
    if (!uri) throw new Error("Source uri is required");

    const source = new Source(
      id,
      name,
      type,
      uri,
      null, // No version until extraction
      [],
      new Date(),
    );

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

  static reconstitute(
    id: SourceId,
    name: string,
    type: SourceType,
    uri: string,
    currentVersion: SourceVersion | null,
    versions: SourceVersion[],
    registeredAt: Date,
  ): Source {
    return new Source(id, name, type, uri, currentVersion, versions, registeredAt);
  }

  /**
   * Records that content was extracted. Only stores the hash.
   * Returns true if this is a new version (content changed), false otherwise.
   */
  recordExtraction(contentHash: string): boolean {
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
