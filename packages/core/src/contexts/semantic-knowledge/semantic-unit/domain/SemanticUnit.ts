import { AggregateRoot } from "../../../../shared/domain/index.js";
import { SemanticUnitId } from "./SemanticUnitId.js";
import { SemanticVersion } from "./SemanticVersion.js";
import { SemanticState, canTransition } from "./SemanticState.js";
import { Origin } from "./Origin.js";
import { Meaning } from "./Meaning.js";
import { UnitMetadata } from "./UnitMetadata.js";
import { SemanticUnitCreated } from "./events/SemanticUnitCreated.js";
import { SemanticUnitVersioned } from "./events/SemanticUnitVersioned.js";
import { SemanticUnitDeprecated } from "./events/SemanticUnitDeprecated.js";
import { SemanticUnitReprocessRequested } from "./events/SemanticUnitReprocessRequested.js";
import { SemanticUnitOriginAdded } from "./events/SemanticUnitOriginAdded.js";

export class SemanticUnit extends AggregateRoot<SemanticUnitId> {
  private _state: SemanticState;
  private _origins: Origin[];
  private _currentVersion: SemanticVersion;
  private _versions: SemanticVersion[];
  private _metadata: UnitMetadata;

  private constructor(
    id: SemanticUnitId,
    state: SemanticState,
    origins: Origin[],
    currentVersion: SemanticVersion,
    versions: SemanticVersion[],
    metadata: UnitMetadata,
  ) {
    super(id);
    this._state = state;
    this._origins = origins;
    this._currentVersion = currentVersion;
    this._versions = versions;
    this._metadata = metadata;
  }

  get state(): SemanticState {
    return this._state;
  }

  /** Backward-compatible accessor — returns the primary (first) origin. */
  get origin(): Origin {
    return this._origins[0];
  }

  get origins(): ReadonlyArray<Origin> {
    return [...this._origins];
  }

  get primaryOrigin(): Origin {
    return this._origins[0];
  }

  get currentVersion(): SemanticVersion {
    return this._currentVersion;
  }

  get versions(): ReadonlyArray<SemanticVersion> {
    return [...this._versions];
  }

  get metadata(): UnitMetadata {
    return this._metadata;
  }

  static create(
    id: SemanticUnitId,
    origin: Origin,
    meaning: Meaning,
    metadata: UnitMetadata,
  ): SemanticUnit {
    const initialVersion = SemanticVersion.initial(meaning);
    const unit = new SemanticUnit(
      id,
      SemanticState.Draft,
      [origin],
      initialVersion,
      [initialVersion],
      metadata,
    );

    unit.record({
      eventId: crypto.randomUUID(),
      occurredOn: new Date(),
      eventType: SemanticUnitCreated.EVENT_TYPE,
      aggregateId: id.value,
      payload: {
        origins: [
          {
            sourceId: origin.sourceId,
            sourceType: origin.sourceType,
            resourceId: origin.resourceId,
          },
        ],
        origin: { sourceId: origin.sourceId, sourceType: origin.sourceType },
        language: meaning.language,
        state: SemanticState.Draft,
      },
    });

    return unit;
  }

  static reconstitute(
    id: SemanticUnitId,
    state: SemanticState,
    origins: Origin[],
    currentVersion: SemanticVersion,
    versions: SemanticVersion[],
    metadata: UnitMetadata,
  ): SemanticUnit {
    return new SemanticUnit(
      id,
      state,
      origins,
      currentVersion,
      versions,
      metadata,
    );
  }

  addOrigin(origin: Origin): void {
    if (this._state === SemanticState.Archived) {
      throw new Error("Cannot add origin to an archived semantic unit");
    }

    const exists = this._origins.some(
      (o) => o.sourceId === origin.sourceId,
    );
    if (exists) {
      throw new Error(
        `Origin with sourceId '${origin.sourceId}' already attached`,
      );
    }

    this._origins.push(origin);
    this._metadata = this._metadata.withUpdatedTimestamp();

    this.record({
      eventId: crypto.randomUUID(),
      occurredOn: new Date(),
      eventType: SemanticUnitOriginAdded.EVENT_TYPE,
      aggregateId: this.id.value,
      payload: {
        sourceId: origin.sourceId,
        sourceType: origin.sourceType,
        resourceId: origin.resourceId,
      },
    });
  }

  removeOrigin(sourceId: string): void {
    if (this._origins.length <= 1) {
      throw new Error(
        "Cannot remove the last origin — at least one origin is required",
      );
    }

    const index = this._origins.findIndex((o) => o.sourceId === sourceId);
    if (index === -1) {
      throw new Error(`Origin with sourceId '${sourceId}' not found`);
    }

    this._origins.splice(index, 1);
    this._metadata = this._metadata.withUpdatedTimestamp();
  }

  addVersion(meaning: Meaning, reason: string): void {
    if (this._state === SemanticState.Archived) {
      throw new Error("Cannot version an archived semantic unit");
    }

    const newVersion = this._currentVersion.next(meaning, reason);
    this._currentVersion = newVersion;
    this._versions.push(newVersion);
    this._metadata = this._metadata.withUpdatedTimestamp();

    this.record({
      eventId: crypto.randomUUID(),
      occurredOn: new Date(),
      eventType: SemanticUnitVersioned.EVENT_TYPE,
      aggregateId: this.id.value,
      payload: {
        version: newVersion.version,
        reason,
      },
    });
  }

  activate(): void {
    this.transitionTo(SemanticState.Active);
  }

  deprecate(reason: string): void {
    this.transitionTo(SemanticState.Deprecated);

    this.record({
      eventId: crypto.randomUUID(),
      occurredOn: new Date(),
      eventType: SemanticUnitDeprecated.EVENT_TYPE,
      aggregateId: this.id.value,
      payload: { reason },
    });
  }

  archive(): void {
    this.transitionTo(SemanticState.Archived);
  }

  requestReprocessing(reason: string): void {
    if (this._state === SemanticState.Archived) {
      throw new Error("Cannot reprocess an archived semantic unit");
    }

    this.record({
      eventId: crypto.randomUUID(),
      occurredOn: new Date(),
      eventType: SemanticUnitReprocessRequested.EVENT_TYPE,
      aggregateId: this.id.value,
      payload: {
        currentVersion: this._currentVersion.version,
        reason,
      },
    });
  }

  private transitionTo(newState: SemanticState): void {
    if (!canTransition(this._state, newState)) {
      throw new Error(
        `Invalid state transition from ${this._state} to ${newState}`,
      );
    }
    this._state = newState;
    this._metadata = this._metadata.withUpdatedTimestamp();
  }
}
