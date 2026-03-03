import { AggregateRoot } from "../../../../shared/domain";
import { SourceKnowledgeId } from "./SourceKnowledgeId";
import { ProjectionHub } from "./ProjectionHub";
import type { ProjectionEntry } from "./ProjectionHub";
import { SourceKnowledgeCreated } from "./events/SourceKnowledgeCreated";
import { ProjectionRegistered } from "./events/ProjectionRegistered";

/**
 * SourceKnowledge aggregate — represents the knowledge projection state
 * for a single source. Each source has exactly one SourceKnowledge (1:1),
 * created automatically when a source is registered.
 *
 * Contains a ProjectionHub sub-entity that tracks which processing profiles
 * have been applied and their completion status.
 */
export class SourceKnowledge extends AggregateRoot<SourceKnowledgeId> {
  private _sourceId: string;
  private _contentHash: string;
  private _defaultProfileId: string;
  private _hub: ProjectionHub;
  private _createdAt: Date;

  private constructor(
    id: SourceKnowledgeId,
    sourceId: string,
    contentHash: string,
    defaultProfileId: string,
    hub: ProjectionHub,
    createdAt: Date,
  ) {
    super(id);
    this._sourceId = sourceId;
    this._contentHash = contentHash;
    this._defaultProfileId = defaultProfileId;
    this._hub = hub;
    this._createdAt = createdAt;
  }

  get sourceId(): string {
    return this._sourceId;
  }

  get contentHash(): string {
    return this._contentHash;
  }

  get defaultProfileId(): string {
    return this._defaultProfileId;
  }

  get hub(): ProjectionHub {
    return this._hub;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  /**
   * Returns true only if the hub has a COMPLETED projection for the given profile.
   */
  satisfiesProfile(profileId: string): boolean {
    const entry = this._hub.getProjectionForProfile(profileId);
    return entry !== undefined && entry.status === "COMPLETED";
  }

  /**
   * Registers (or updates) a projection in the hub for a given profile.
   * Emits a ProjectionRegistered domain event.
   */
  registerProjection(params: {
    projectionId: string;
    profileId: string;
    status: ProjectionEntry["status"];
  }): void {
    const entry: ProjectionEntry = {
      projectionId: params.projectionId,
      profileId: params.profileId,
      status: params.status,
      generatedAt: new Date(),
    };

    this._hub = this._hub.withProjection(entry);

    this.record({
      eventId: crypto.randomUUID(),
      occurredOn: new Date(),
      eventType: ProjectionRegistered.EVENT_TYPE,
      aggregateId: this.id.value,
      payload: {
        projectionId: params.projectionId,
        profileId: params.profileId,
        status: params.status,
      },
    });
  }

  /**
   * Creates a new SourceKnowledge with an empty hub.
   * Emits SourceKnowledgeCreated event.
   */
  static create(params: {
    id: SourceKnowledgeId;
    sourceId: string;
    contentHash: string;
    defaultProfileId: string;
  }): SourceKnowledge {
    const sk = new SourceKnowledge(
      params.id,
      params.sourceId,
      params.contentHash,
      params.defaultProfileId,
      ProjectionHub.create(),
      new Date(),
    );

    sk.record({
      eventId: crypto.randomUUID(),
      occurredOn: new Date(),
      eventType: SourceKnowledgeCreated.EVENT_TYPE,
      aggregateId: params.id.value,
      payload: {
        sourceId: params.sourceId,
        contentHash: params.contentHash,
        defaultProfileId: params.defaultProfileId,
      },
    });

    return sk;
  }

  /**
   * Hydrates from persistence. No events emitted.
   */
  static reconstitute(params: {
    id: SourceKnowledgeId;
    sourceId: string;
    contentHash: string;
    defaultProfileId: string;
    hub: ProjectionEntry[];
    createdAt: Date;
  }): SourceKnowledge {
    return new SourceKnowledge(
      params.id,
      params.sourceId,
      params.contentHash,
      params.defaultProfileId,
      ProjectionHub.reconstitute(params.hub),
      params.createdAt,
    );
  }
}
