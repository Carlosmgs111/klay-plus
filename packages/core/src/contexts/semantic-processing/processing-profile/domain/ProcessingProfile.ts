import { AggregateRoot } from "../../../../shared/domain";
import { ProcessingProfileId } from "./ProcessingProfileId";
import { ProfileStatus } from "./ProfileStatus";
import { ProfileCreated } from "./events/ProfileCreated";
import { ProfileUpdated } from "./events/ProfileUpdated";
import { ProfileDeprecated } from "./events/ProfileDeprecated";
import { PreparationLayer, FragmentationLayer, ProjectionLayer } from "./value-objects";
import {
  ProfileNameRequiredError,
  PreparationStrategyRequiredError,
  FragmentationStrategyRequiredError,
  ProjectionStrategyRequiredError,
  ProfileDeprecatedError,
  ProfileAlreadyDeprecatedError,
} from "./errors";

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
 * The three layers (Preparation, Fragmentation, Projection) are Value Objects
 * that declare which strategies and configuration to use. The composition layer
 * materializes them into concrete implementations at runtime.
 */
export class ProcessingProfile extends AggregateRoot<ProcessingProfileId> {
  private _name: string;
  private _version: number;
  private _preparation: PreparationLayer;
  private _fragmentation: FragmentationLayer;
  private _projection: ProjectionLayer;
  private _status: ProfileStatus;
  private _createdAt: Date;

  private constructor(
    id: ProcessingProfileId,
    name: string,
    version: number,
    preparation: PreparationLayer,
    fragmentation: FragmentationLayer,
    projection: ProjectionLayer,
    status: ProfileStatus,
    createdAt: Date,
  ) {
    super(id);
    this._name = name;
    this._version = version;
    this._preparation = preparation;
    this._fragmentation = fragmentation;
    this._projection = projection;
    this._status = status;
    this._createdAt = createdAt;
  }

  get name(): string {
    return this._name;
  }

  get version(): number {
    return this._version;
  }

  get preparation(): PreparationLayer {
    return this._preparation;
  }

  get fragmentation(): FragmentationLayer {
    return this._fragmentation;
  }

  get projection(): ProjectionLayer {
    return this._projection;
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

  /**
   * Creates a new active processing profile.
   * Validates all required fields and emits ProfileCreated event.
   */
  static create(params: {
    id: ProcessingProfileId;
    name: string;
    preparation: PreparationLayer;
    fragmentation: FragmentationLayer;
    projection: ProjectionLayer;
  }): ProcessingProfile {
    if (!params.name || params.name.trim() === "") {
      throw new ProfileNameRequiredError();
    }
    if (!params.preparation) {
      throw new PreparationStrategyRequiredError();
    }
    if (!params.fragmentation) {
      throw new FragmentationStrategyRequiredError();
    }
    if (!params.projection) {
      throw new ProjectionStrategyRequiredError();
    }

    const profile = new ProcessingProfile(
      params.id,
      params.name.trim(),
      1,
      params.preparation,
      params.fragmentation,
      params.projection,
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
        preparation: profile._preparation.toDTO(),
        fragmentation: profile._fragmentation.toDTO(),
        projection: profile._projection.toDTO(),
        version: profile._version,
      },
    });

    return profile;
  }

  /**
   * Reconstitutes a profile from persistence. No events, no validation.
   */
  static reconstitute(params: {
    id: ProcessingProfileId;
    name: string;
    version: number;
    preparation: PreparationLayer;
    fragmentation: FragmentationLayer;
    projection: ProjectionLayer;
    status: ProfileStatus;
    createdAt: Date;
  }): ProcessingProfile {
    return new ProcessingProfile(
      params.id,
      params.name,
      params.version,
      params.preparation,
      params.fragmentation,
      params.projection,
      params.status,
      params.createdAt,
    );
  }

  /**
   * Updates the profile's strategy configuration.
   * Increments version, protecting the previous version's reproducibility.
   *
   * @throws ProfileDeprecatedError if profile is DEPRECATED
   */
  update(params: {
    name?: string;
    preparation?: PreparationLayer;
    fragmentation?: FragmentationLayer;
    projection?: ProjectionLayer;
  }): void {
    if (this._status === ProfileStatus.Deprecated) {
      throw new ProfileDeprecatedError(this.id.value);
    }

    const hasChanges =
      (params.name !== undefined && params.name !== this._name) ||
      params.preparation !== undefined ||
      params.fragmentation !== undefined ||
      params.projection !== undefined;

    if (!hasChanges) return;

    if (params.name !== undefined) {
      if (!params.name || params.name.trim() === "") {
        throw new ProfileNameRequiredError();
      }
      this._name = params.name.trim();
    }
    if (params.preparation !== undefined) {
      this._preparation = params.preparation;
    }
    if (params.fragmentation !== undefined) {
      this._fragmentation = params.fragmentation;
    }
    if (params.projection !== undefined) {
      this._projection = params.projection;
    }

    this._version += 1;

    this.record({
      eventId: crypto.randomUUID(),
      occurredOn: new Date(),
      eventType: ProfileUpdated.EVENT_TYPE,
      aggregateId: this.id.value,
      payload: {
        name: this._name,
        preparation: this._preparation.toDTO(),
        fragmentation: this._fragmentation.toDTO(),
        projection: this._projection.toDTO(),
        version: this._version,
      },
    });
  }

  /**
   * Deprecates the profile. Irreversible transition.
   *
   * @throws ProfileAlreadyDeprecatedError if already DEPRECATED
   */
  deprecate(reason: string): void {
    if (this._status === ProfileStatus.Deprecated) {
      throw new ProfileAlreadyDeprecatedError(this.id.value);
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
