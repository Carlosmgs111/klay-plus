import { AggregateRoot } from "../../../../shared/domain";
import { ProjectionId } from "./ProjectionId";
import { ProjectionStatus } from "./ProjectionStatus";
import type { ProjectionType } from "./ProjectionType";
import { ProjectionResult } from "./ProjectionResult";
import { ProjectionGenerated } from "./events/ProjectionGenerated";
import { ProjectionFailed } from "./events/ProjectionFailed";

export class SemanticProjection extends AggregateRoot<ProjectionId> {
  private _sourceId: string;
  private _processingProfileId: string;
  private _type: ProjectionType;
  private _status: ProjectionStatus;
  private _result: ProjectionResult | null;
  private _error: string | null;
  private _createdAt: Date;

  private constructor(
    id: ProjectionId,
    sourceId: string,
    processingProfileId: string,
    type: ProjectionType,
    status: ProjectionStatus,
    result: ProjectionResult | null,
    error: string | null,
    createdAt: Date,
  ) {
    super(id);
    this._sourceId = sourceId;
    this._processingProfileId = processingProfileId;
    this._type = type;
    this._status = status;
    this._result = result;
    this._error = error;
    this._createdAt = createdAt;
  }

  get sourceId(): string {
    return this._sourceId;
  }

  get processingProfileId(): string {
    return this._processingProfileId;
  }

  get type(): ProjectionType {
    return this._type;
  }

  get status(): ProjectionStatus {
    return this._status;
  }

  get result(): ProjectionResult | null {
    return this._result;
  }

  get error(): string | null {
    return this._error;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  static create(
    id: ProjectionId,
    sourceId: string,
    processingProfileId: string,
    type: ProjectionType,
  ): SemanticProjection {
    if (!sourceId) throw new Error("sourceId is required");
    if (!processingProfileId) throw new Error("processingProfileId is required");
    return new SemanticProjection(
      id,
      sourceId,
      processingProfileId,
      type,
      ProjectionStatus.Pending,
      null,
      null,
      new Date(),
    );
  }

  static reconstitute(
    id: ProjectionId,
    sourceId: string,
    processingProfileId: string,
    type: ProjectionType,
    status: ProjectionStatus,
    result: ProjectionResult | null,
    error: string | null,
    createdAt: Date,
  ): SemanticProjection {
    return new SemanticProjection(
      id, sourceId, processingProfileId, type, status, result, error, createdAt,
    );
  }

  markProcessing(): void {
    if (this._status !== ProjectionStatus.Pending) {
      throw new Error(`Cannot start processing projection in status ${this._status}`);
    }
    this._status = ProjectionStatus.Processing;
  }

  complete(result: ProjectionResult): void {
    if (this._status !== ProjectionStatus.Processing) {
      throw new Error(`Cannot complete projection in status ${this._status}`);
    }
    this._status = ProjectionStatus.Completed;
    this._result = result;

    this.record({
      eventId: crypto.randomUUID(),
      occurredOn: new Date(),
      eventType: ProjectionGenerated.EVENT_TYPE,
      aggregateId: this.id.value,
      payload: {
        sourceId: this._sourceId,
        processingProfileId: this._processingProfileId,
        projectionType: this._type,
        processingProfileVersion: result.processingProfileVersion,
      },
    });
  }

  fail(error: string): void {
    if (this._status !== ProjectionStatus.Processing) {
      throw new Error(`Cannot fail projection in status ${this._status}`);
    }
    this._status = ProjectionStatus.Failed;
    this._error = error;

    this.record({
      eventId: crypto.randomUUID(),
      occurredOn: new Date(),
      eventType: ProjectionFailed.EVENT_TYPE,
      aggregateId: this.id.value,
      payload: {
        sourceId: this._sourceId,
        processingProfileId: this._processingProfileId,
        error,
      },
    });
  }
}
