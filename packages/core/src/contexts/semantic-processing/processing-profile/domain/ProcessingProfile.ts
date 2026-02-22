import { AggregateRoot } from "../../../../shared/domain/index";
import { ProcessingProfileId } from "./ProcessingProfileId.js";
import { ProfileStatus } from "./ProfileStatus.js";
import { ProfileCreated } from "./events/ProfileCreated.js";
import { ProfileUpdated } from "./events/ProfileUpdated.js";
import { ProfileDeprecated } from "./events/ProfileDeprecated.js";

/**
 * ProcessingProfile — Aggregate Root
 *
 * Represents a versionable, selectable, and reproducible configuration
 * for semantic processing. The user explicitly selects a profile for each
 * iteration, making the profile part of the version's identity.
 *
 * This is DOMAIN, not infrastructure:
 * - Has identity (ProcessingProfileId)
 * - Has lifecycle (ACTIVE → DEPRECATED, version increments)
 * - Protects invariants (no modifications after deprecation)
 * - Emits domain events (ProfileCreated, ProfileUpdated, ProfileDeprecated)
 * - Does NOT instantiate concrete strategies — only declares intent
 *
 * The chunkingStrategyId and embeddingStrategyId are declarative identifiers
 * (e.g., "recursive", "hash-embedding") that the composition layer materializes
 * into concrete implementations at runtime.
 */
export class ProcessingProfile extends AggregateRoot<ProcessingProfileId> {
  private _name: string;
  private _version: number;
  private _chunkingStrategyId: string;
  private _embeddingStrategyId: string;
  private _configuration: Readonly<Record<string, unknown>>;
  private _status: ProfileStatus;
  private _createdAt: Date;

  private constructor(
    id: ProcessingProfileId,
    name: string,
    version: number,
    chunkingStrategyId: string,
    embeddingStrategyId: string,
    configuration: Record<string, unknown>,
    status: ProfileStatus,
    createdAt: Date,
  ) {
    super(id);
    this._name = name;
    this._version = version;
    this._chunkingStrategyId = chunkingStrategyId;
    this._embeddingStrategyId = embeddingStrategyId;
    this._configuration = Object.freeze({ ...configuration });
    this._status = status;
    this._createdAt = createdAt;
  }

  // ─── Accessors ──────────────────────────────────────────────────────────────

  get name(): string {
    return this._name;
  }

  get version(): number {
    return this._version;
  }

  get chunkingStrategyId(): string {
    return this._chunkingStrategyId;
  }

  get embeddingStrategyId(): string {
    return this._embeddingStrategyId;
  }

  get configuration(): Readonly<Record<string, unknown>> {
    return this._configuration;
  }

  get status(): ProfileStatus {
    return this._status;
  }

  get isActive(): boolean {
    return this._status === ProfileStatus.Active;
  }

  get isDeprecated(): boolean {
    return this._status === ProfileStatus.Deprecated;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  // ─── Factory Methods ────────────────────────────────────────────────────────

  /**
   * Creates a new active processing profile.
   * Validates all required fields and emits ProfileCreated event.
   */
  static create(params: {
    id: ProcessingProfileId;
    name: string;
    chunkingStrategyId: string;
    embeddingStrategyId: string;
    configuration?: Record<string, unknown>;
  }): ProcessingProfile {
    if (!params.name || params.name.trim() === "") {
      throw new Error("ProcessingProfile name is required");
    }
    if (!params.chunkingStrategyId || params.chunkingStrategyId.trim() === "") {
      throw new Error("ProcessingProfile chunkingStrategyId is required");
    }
    if (!params.embeddingStrategyId || params.embeddingStrategyId.trim() === "") {
      throw new Error("ProcessingProfile embeddingStrategyId is required");
    }

    const profile = new ProcessingProfile(
      params.id,
      params.name.trim(),
      1,
      params.chunkingStrategyId,
      params.embeddingStrategyId,
      params.configuration ?? {},
      ProfileStatus.Active,
      new Date(),
    );

    profile.record({
      eventId: crypto.randomUUID(),
      occurredOn: new Date(),
      eventType: ProfileCreated.EVENT_TYPE,
      aggregateId: params.id.value,
      payload: {
        name: profile._name,
        chunkingStrategyId: profile._chunkingStrategyId,
        embeddingStrategyId: profile._embeddingStrategyId,
        version: profile._version,
      },
    });

    return profile;
  }

  /**
   * Reconstitutes a profile from persistence. No events, no validation.
   */
  static reconstitute(
    id: ProcessingProfileId,
    name: string,
    version: number,
    chunkingStrategyId: string,
    embeddingStrategyId: string,
    configuration: Record<string, unknown>,
    status: ProfileStatus,
    createdAt: Date,
  ): ProcessingProfile {
    return new ProcessingProfile(
      id,
      name,
      version,
      chunkingStrategyId,
      embeddingStrategyId,
      configuration,
      status,
      createdAt,
    );
  }

  // ─── Domain Behaviors ───────────────────────────────────────────────────────

  /**
   * Updates the profile's strategy configuration.
   * Increments version, protecting the previous version's reproducibility.
   *
   * @throws Error if profile is DEPRECATED
   */
  update(params: {
    name?: string;
    chunkingStrategyId?: string;
    embeddingStrategyId?: string;
    configuration?: Record<string, unknown>;
  }): void {
    if (this._status === ProfileStatus.Deprecated) {
      throw new Error(`Cannot modify deprecated profile: ${this.id.value}`);
    }

    const hasChanges =
      (params.name !== undefined && params.name !== this._name) ||
      (params.chunkingStrategyId !== undefined && params.chunkingStrategyId !== this._chunkingStrategyId) ||
      (params.embeddingStrategyId !== undefined && params.embeddingStrategyId !== this._embeddingStrategyId) ||
      params.configuration !== undefined;

    if (!hasChanges) return;

    if (params.name !== undefined) {
      if (!params.name || params.name.trim() === "") {
        throw new Error("ProcessingProfile name cannot be empty");
      }
      this._name = params.name.trim();
    }
    if (params.chunkingStrategyId !== undefined) {
      if (!params.chunkingStrategyId || params.chunkingStrategyId.trim() === "") {
        throw new Error("ProcessingProfile chunkingStrategyId cannot be empty");
      }
      this._chunkingStrategyId = params.chunkingStrategyId;
    }
    if (params.embeddingStrategyId !== undefined) {
      if (!params.embeddingStrategyId || params.embeddingStrategyId.trim() === "") {
        throw new Error("ProcessingProfile embeddingStrategyId cannot be empty");
      }
      this._embeddingStrategyId = params.embeddingStrategyId;
    }
    if (params.configuration !== undefined) {
      this._configuration = Object.freeze({ ...params.configuration });
    }

    this._version += 1;

    this.record({
      eventId: crypto.randomUUID(),
      occurredOn: new Date(),
      eventType: ProfileUpdated.EVENT_TYPE,
      aggregateId: this.id.value,
      payload: {
        name: this._name,
        chunkingStrategyId: this._chunkingStrategyId,
        embeddingStrategyId: this._embeddingStrategyId,
        version: this._version,
      },
    });
  }

  /**
   * Deprecates the profile. Irreversible transition.
   *
   * @throws Error if already DEPRECATED
   */
  deprecate(reason: string): void {
    if (this._status === ProfileStatus.Deprecated) {
      throw new Error(`Profile is already deprecated: ${this.id.value}`);
    }

    this._status = ProfileStatus.Deprecated;

    this.record({
      eventId: crypto.randomUUID(),
      occurredOn: new Date(),
      eventType: ProfileDeprecated.EVENT_TYPE,
      aggregateId: this.id.value,
      payload: {
        reason,
        version: this._version,
      },
    });
  }
}
