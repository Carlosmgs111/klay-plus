import { AggregateRoot } from "../../../../shared/domain";
import { SemanticUnitId } from "./SemanticUnitId";
import { SemanticState, canTransition } from "./SemanticState";
import type { UnitSource } from "./UnitSource";
import { UnitVersion } from "./UnitVersion";
import { VersionSourceSnapshot } from "./VersionSourceSnapshot";
import { UnitMetadata } from "./UnitMetadata";
import { SemanticUnitCreated } from "./events/SemanticUnitCreated";
import { SemanticUnitVersioned } from "./events/SemanticUnitVersioned";
import { SemanticUnitDeprecated } from "./events/SemanticUnitDeprecated";
import { SemanticUnitReprocessRequested } from "./events/SemanticUnitReprocessRequested";
import { SemanticUnitSourceAdded } from "./events/SemanticUnitSourceAdded";
import { SemanticUnitSourceRemoved } from "./events/SemanticUnitSourceRemoved";
import { SemanticUnitRolledBack } from "./events/SemanticUnitRolledBack";

export class SemanticUnit extends AggregateRoot<SemanticUnitId> {
  private _name: string;
  private _description: string;
  private _language: string;
  private _state: SemanticState;
  private _sources: UnitSource[];
  private _versions: UnitVersion[];
  private _currentVersionNumber: number | null;
  private _metadata: UnitMetadata;

  private constructor(
    id: SemanticUnitId,
    name: string,
    description: string,
    language: string,
    state: SemanticState,
    sources: UnitSource[],
    versions: UnitVersion[],
    currentVersionNumber: number | null,
    metadata: UnitMetadata,
  ) {
    super(id);
    this._name = name;
    this._description = description;
    this._language = language;
    this._state = state;
    this._sources = sources;
    this._versions = versions;
    this._currentVersionNumber = currentVersionNumber;
    this._metadata = metadata;
  }

  get name(): string {
    return this._name;
  }

  get description(): string {
    return this._description;
  }

  get language(): string {
    return this._language;
  }

  get state(): SemanticState {
    return this._state;
  }

  get currentVersion(): UnitVersion | null {
    if (this._currentVersionNumber === null) return null;
    return this._versions.find((v) => v.version === this._currentVersionNumber) ?? null;
  }

  get versions(): ReadonlyArray<UnitVersion> {
    return [...this._versions];
  }

  get metadata(): UnitMetadata {
    return this._metadata;
  }

  /** Sources included in the current active version. */
  get activeSources(): ReadonlyArray<UnitSource> {
    const cv = this.currentVersion;
    if (!cv) return [];
    const activeSourceIds = new Set(cv.sourceSnapshots.map((s) => s.sourceId));
    return this._sources.filter((s) => activeSourceIds.has(s.sourceId));
  }

  /** All sources in the pool (including those not in current version). */
  get allSources(): ReadonlyArray<UnitSource> {
    return [...this._sources];
  }

  static create(
    id: SemanticUnitId,
    name: string,
    description: string,
    language: string,
    metadata: UnitMetadata,
  ): SemanticUnit {
    const unit = new SemanticUnit(
      id,
      name,
      description,
      language,
      SemanticState.Draft,
      [],
      [],
      null,
      metadata,
    );

    unit.record({
      eventId: crypto.randomUUID(),
      occurredOn: new Date(),
      eventType: SemanticUnitCreated.EVENT_TYPE,
      aggregateId: id.value,
      payload: {
        name,
        description,
        language,
        state: SemanticState.Draft,
      },
    });

    return unit;
  }

  static reconstitute(
    id: SemanticUnitId,
    name: string,
    description: string,
    language: string,
    state: SemanticState,
    sources: UnitSource[],
    versions: UnitVersion[],
    currentVersionNumber: number | null,
    metadata: UnitMetadata,
  ): SemanticUnit {
    return new SemanticUnit(
      id,
      name,
      description,
      language,
      state,
      sources,
      versions,
      currentVersionNumber,
      metadata,
    );
  }

  addSource(
    source: UnitSource,
    profileId: string,
    profileVersion: number,
  ): UnitVersion {
    if (this._state === SemanticState.Archived) {
      throw new Error("Cannot add source to an archived semantic unit");
    }

    const exists = this._sources.some((s) => s.sourceId === source.sourceId);
    if (exists) {
      throw new Error(
        `Source with sourceId '${source.sourceId}' already attached`,
      );
    }

    // Add source to the pool
    this._sources.push(source);

    // Build snapshots: existing active sources + new source
    const snapshots = this.buildSnapshotsForCurrentSources();
    const newSnapshot = VersionSourceSnapshot.create(source.sourceId, source.contentHash);
    snapshots.push(newSnapshot);

    // Create version
    const newVersion = this._currentVersionNumber === null
      ? UnitVersion.initial(profileId, profileVersion, snapshots)
      : this.currentVersion!.next(profileId, profileVersion, snapshots, `Source added: ${source.sourceId}`);

    this._versions.push(newVersion);
    this._currentVersionNumber = newVersion.version;
    this._metadata = this._metadata.withUpdatedTimestamp();

    this.record({
      eventId: crypto.randomUUID(),
      occurredOn: new Date(),
      eventType: SemanticUnitSourceAdded.EVENT_TYPE,
      aggregateId: this.id.value,
      payload: {
        sourceId: source.sourceId,
        sourceType: source.sourceType,
        resourceId: source.resourceId,
      },
    });

    this.record({
      eventId: crypto.randomUUID(),
      occurredOn: new Date(),
      eventType: SemanticUnitVersioned.EVENT_TYPE,
      aggregateId: this.id.value,
      payload: {
        version: newVersion.version,
        reason: newVersion.reason,
      },
    });

    return newVersion;
  }

  removeSource(sourceId: string): UnitVersion {
    if (this._state === SemanticState.Archived) {
      throw new Error("Cannot remove source from an archived semantic unit");
    }

    const sourceIndex = this._sources.findIndex((s) => s.sourceId === sourceId);
    if (sourceIndex === -1) {
      throw new Error(`Source with sourceId '${sourceId}' not found`);
    }

    // Must have at least one source remaining in the version
    const cv = this.currentVersion;
    if (!cv) {
      throw new Error("Cannot remove source when no version exists");
    }

    const activeSourceIds = cv.sourceSnapshots.map((s) => s.sourceId);
    const remainingActive = activeSourceIds.filter((id) => id !== sourceId);
    if (remainingActive.length === 0) {
      throw new Error(
        "Cannot remove the last active source — at least one source is required in a version",
      );
    }

    // Build new version without the removed source's snapshot
    const newSnapshots = cv.sourceSnapshots
      .filter((s) => s.sourceId !== sourceId)
      .map((s) => VersionSourceSnapshot.create(s.sourceId, s.contentHash, [...s.projectionIds]));

    const newVersion = cv.next(
      cv.processingProfileId,
      cv.processingProfileVersion,
      newSnapshots,
      `Source removed: ${sourceId}`,
    );

    this._versions.push(newVersion);
    this._currentVersionNumber = newVersion.version;
    this._metadata = this._metadata.withUpdatedTimestamp();

    this.record({
      eventId: crypto.randomUUID(),
      occurredOn: new Date(),
      eventType: SemanticUnitSourceRemoved.EVENT_TYPE,
      aggregateId: this.id.value,
      payload: { sourceId },
    });

    this.record({
      eventId: crypto.randomUUID(),
      occurredOn: new Date(),
      eventType: SemanticUnitVersioned.EVENT_TYPE,
      aggregateId: this.id.value,
      payload: {
        version: newVersion.version,
        reason: newVersion.reason,
      },
    });

    return newVersion;
  }

  reprocess(
    profileId: string,
    profileVersion: number,
    reason: string,
  ): UnitVersion {
    if (this._state === SemanticState.Archived) {
      throw new Error("Cannot reprocess an archived semantic unit");
    }

    const cv = this.currentVersion;
    if (!cv) {
      throw new Error("Cannot reprocess a semantic unit with no version");
    }

    // New version with same sources but new processing profile (projectionIds reset)
    const newSnapshots = cv.sourceSnapshots.map((s) =>
      VersionSourceSnapshot.create(s.sourceId, s.contentHash),
    );

    const newVersion = cv.next(profileId, profileVersion, newSnapshots, reason);

    this._versions.push(newVersion);
    this._currentVersionNumber = newVersion.version;
    this._metadata = this._metadata.withUpdatedTimestamp();

    this.record({
      eventId: crypto.randomUUID(),
      occurredOn: new Date(),
      eventType: SemanticUnitReprocessRequested.EVENT_TYPE,
      aggregateId: this.id.value,
      payload: {
        currentVersion: newVersion.version,
        reason,
        processingProfileId: profileId,
        processingProfileVersion: profileVersion,
      },
    });

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

    return newVersion;
  }

  rollbackToVersion(targetVersion: number): void {
    const target = this._versions.find((v) => v.version === targetVersion);
    if (!target) {
      throw new Error(`Version ${targetVersion} not found`);
    }

    const previousVersion = this._currentVersionNumber;
    this._currentVersionNumber = targetVersion;
    this._metadata = this._metadata.withUpdatedTimestamp();

    this.record({
      eventId: crypto.randomUUID(),
      occurredOn: new Date(),
      eventType: SemanticUnitRolledBack.EVENT_TYPE,
      aggregateId: this.id.value,
      payload: {
        fromVersion: previousVersion,
        toVersion: targetVersion,
      },
    });
  }

  recordProjectionForSource(sourceId: string, projectionId: string): void {
    const cv = this.currentVersion;
    if (!cv) {
      throw new Error("Cannot record projection when no version exists");
    }

    const versionIndex = this._versions.findIndex((v) => v.version === cv.version);
    if (versionIndex === -1) return;

    const snapshotIndex = cv.sourceSnapshots.findIndex((s) => s.sourceId === sourceId);
    if (snapshotIndex === -1) {
      throw new Error(`Source '${sourceId}' not found in current version`);
    }

    // Rebuild the version with the updated snapshot
    const updatedSnapshots = [...cv.sourceSnapshots];
    updatedSnapshots[snapshotIndex] = updatedSnapshots[snapshotIndex].withProjectionId(projectionId);

    const updatedVersion = UnitVersion.reconstitute(
      cv.version,
      cv.processingProfileId,
      cv.processingProfileVersion,
      updatedSnapshots,
      cv.createdAt,
      cv.reason,
    );

    this._versions[versionIndex] = updatedVersion;
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

  private transitionTo(newState: SemanticState): void {
    if (!canTransition(this._state, newState)) {
      throw new Error(
        `Invalid state transition from ${this._state} to ${newState}`,
      );
    }
    this._state = newState;
    this._metadata = this._metadata.withUpdatedTimestamp();
  }

  private buildSnapshotsForCurrentSources(): VersionSourceSnapshot[] {
    const cv = this.currentVersion;
    if (!cv) return [];

    // Carry over existing snapshots (preserving projectionIds)
    return cv.sourceSnapshots.map((s) =>
      VersionSourceSnapshot.create(s.sourceId, s.contentHash, [...s.projectionIds]),
    );
  }
}
