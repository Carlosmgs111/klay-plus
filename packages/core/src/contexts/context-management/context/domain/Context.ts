import { AggregateRoot } from "../../../../shared/domain";
import { ContextId } from "./ContextId";
import { ContextState, canTransition } from "./ContextState";
import type { ContextSource } from "./ContextSource";
import { ContextVersion } from "./ContextVersion";
import { ContextMetadata } from "./ContextMetadata";
import { ContextCreated } from "./events/ContextCreated";
import { ContextSourceAdded } from "./events/ContextSourceAdded";
import { ContextSourceRemoved } from "./events/ContextSourceRemoved";
import { ContextVersioned } from "./events/ContextVersioned";
import { ContextDeprecated } from "./events/ContextDeprecated";
import { ContextRolledBack } from "./events/ContextRolledBack";

/**
 * Context aggregate — the replacement for SemanticUnit.
 *
 * A Context is a hub that groups sources, declares a required projection
 * profile, and versions based on source add/remove history.
 *
 * Key differences from SemanticUnit:
 * - NO profileId/profileVersion in versions (Context doesn't manage profiles per version)
 * - NO VersionSourceSnapshot with projectionIds (projections managed by source-knowledge)
 * - NO recordProjectionForSource method
 * - Context only tracks which sourceIds are in each version
 * - requiredProfileId is a top-level field, not per-version
 */
export class Context extends AggregateRoot<ContextId> {
  private _name: string;
  private _description: string;
  private _language: string;
  private _requiredProfileId: string;
  private _state: ContextState;
  private _sources: ContextSource[];
  private _versions: ContextVersion[];
  private _currentVersionNumber: number | null;
  private _metadata: ContextMetadata;

  private constructor(
    id: ContextId,
    name: string,
    description: string,
    language: string,
    requiredProfileId: string,
    state: ContextState,
    sources: ContextSource[],
    versions: ContextVersion[],
    currentVersionNumber: number | null,
    metadata: ContextMetadata,
  ) {
    super(id);
    this._name = name;
    this._description = description;
    this._language = language;
    this._requiredProfileId = requiredProfileId;
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

  get requiredProfileId(): string {
    return this._requiredProfileId;
  }

  get state(): ContextState {
    return this._state;
  }

  get currentVersion(): ContextVersion | null {
    if (this._currentVersionNumber === null) return null;
    return this._versions.find((v) => v.version === this._currentVersionNumber) ?? null;
  }

  get versions(): ReadonlyArray<ContextVersion> {
    return [...this._versions];
  }

  get metadata(): ContextMetadata {
    return this._metadata;
  }

  /** Sources included in the current active version. */
  get activeSources(): ReadonlyArray<ContextSource> {
    const cv = this.currentVersion;
    if (!cv) return [];
    const activeSourceIds = new Set(cv.sourceIds);
    return this._sources.filter((s) => activeSourceIds.has(s.sourceId));
  }

  /** All sources ever added (including those not in the current version). */
  get allSources(): ReadonlyArray<ContextSource> {
    return [...this._sources];
  }

  static create(
    id: ContextId,
    name: string,
    description: string,
    language: string,
    requiredProfileId: string,
    metadata: ContextMetadata,
  ): Context {
    const context = new Context(
      id,
      name,
      description,
      language,
      requiredProfileId,
      ContextState.Draft,
      [],
      [],
      null,
      metadata,
    );

    context.record({
      eventId: crypto.randomUUID(),
      occurredOn: new Date(),
      eventType: ContextCreated.EVENT_TYPE,
      aggregateId: id.value,
      payload: {
        name,
        description,
        language,
        requiredProfileId,
        state: ContextState.Draft,
      },
    });

    return context;
  }

  static reconstitute(
    id: ContextId,
    name: string,
    description: string,
    language: string,
    requiredProfileId: string,
    state: ContextState,
    sources: ContextSource[],
    versions: ContextVersion[],
    currentVersionNumber: number | null,
    metadata: ContextMetadata,
  ): Context {
    return new Context(
      id,
      name,
      description,
      language,
      requiredProfileId,
      state,
      sources,
      versions,
      currentVersionNumber,
      metadata,
    );
  }

  addSource(source: ContextSource): ContextVersion {
    if (this._state === ContextState.Archived) {
      throw new Error("Cannot add source to an archived context");
    }

    const exists = this._sources.some((s) => s.sourceId === source.sourceId);
    if (exists) {
      throw new Error(
        `Source with sourceId '${source.sourceId}' already attached`,
      );
    }

    // Add source to the pool
    this._sources.push(source);

    // Build new sourceIds list: existing active + new source
    const currentSourceIds = this.currentVersion
      ? [...this.currentVersion.sourceIds]
      : [];
    currentSourceIds.push(source.sourceId);

    // Create version
    const newVersion = this._currentVersionNumber === null
      ? ContextVersion.initial(currentSourceIds)
      : ContextVersion.next(
          this._currentVersionNumber,
          currentSourceIds,
          `Source added: ${source.sourceId}`,
        );

    this._versions.push(newVersion);
    this._currentVersionNumber = newVersion.version;
    this._metadata = this._metadata.withUpdatedTimestamp();

    this.record({
      eventId: crypto.randomUUID(),
      occurredOn: new Date(),
      eventType: ContextSourceAdded.EVENT_TYPE,
      aggregateId: this.id.value,
      payload: {
        sourceId: source.sourceId,
        sourceKnowledgeId: source.sourceKnowledgeId,
      },
    });

    this.record({
      eventId: crypto.randomUUID(),
      occurredOn: new Date(),
      eventType: ContextVersioned.EVENT_TYPE,
      aggregateId: this.id.value,
      payload: {
        version: newVersion.version,
        reason: newVersion.reason,
      },
    });

    return newVersion;
  }

  removeSource(sourceId: string): ContextVersion {
    if (this._state === ContextState.Archived) {
      throw new Error("Cannot remove source from an archived context");
    }

    const sourceIndex = this._sources.findIndex((s) => s.sourceId === sourceId);
    if (sourceIndex === -1) {
      throw new Error(`Source with sourceId '${sourceId}' not found`);
    }

    const cv = this.currentVersion;
    if (!cv) {
      throw new Error("Cannot remove source when no version exists");
    }

    const remainingSourceIds = cv.sourceIds.filter((id) => id !== sourceId);
    if (remainingSourceIds.length === 0) {
      throw new Error(
        "Cannot remove the last active source — at least one source is required in a version",
      );
    }

    const newVersion = ContextVersion.next(
      this._currentVersionNumber!,
      [...remainingSourceIds],
      `Source removed: ${sourceId}`,
    );

    this._versions.push(newVersion);
    this._currentVersionNumber = newVersion.version;
    this._metadata = this._metadata.withUpdatedTimestamp();

    this.record({
      eventId: crypto.randomUUID(),
      occurredOn: new Date(),
      eventType: ContextSourceRemoved.EVENT_TYPE,
      aggregateId: this.id.value,
      payload: { sourceId },
    });

    this.record({
      eventId: crypto.randomUUID(),
      occurredOn: new Date(),
      eventType: ContextVersioned.EVENT_TYPE,
      aggregateId: this.id.value,
      payload: {
        version: newVersion.version,
        reason: newVersion.reason,
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
      eventType: ContextRolledBack.EVENT_TYPE,
      aggregateId: this.id.value,
      payload: {
        fromVersion: previousVersion,
        toVersion: targetVersion,
      },
    });
  }

  activate(): void {
    this.transitionTo(ContextState.Active);
  }

  deprecate(reason: string): void {
    this.transitionTo(ContextState.Deprecated);

    this.record({
      eventId: crypto.randomUUID(),
      occurredOn: new Date(),
      eventType: ContextDeprecated.EVENT_TYPE,
      aggregateId: this.id.value,
      payload: { reason },
    });
  }

  archive(): void {
    this.transitionTo(ContextState.Archived);
  }

  private transitionTo(newState: ContextState): void {
    if (!canTransition(this._state, newState)) {
      throw new Error(
        `Invalid state transition from ${this._state} to ${newState}`,
      );
    }
    this._state = newState;
    this._metadata = this._metadata.withUpdatedTimestamp();
  }
}
