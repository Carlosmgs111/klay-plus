import { AggregateRoot } from "../../../../shared/domain";
import { ProjectionId } from "./ProjectionId";
import { ProjectionStatus } from "./ProjectionStatus";
import type { ProjectionType } from "./ProjectionType";
import { ProjectionResult } from "./ProjectionResult";
import { ProjectionGenerated } from "./events/ProjectionGenerated";
import { ProjectionFailed } from "./events/ProjectionFailed";

export class SemanticProjection extends AggregateRoot<ProjectionId> {
  private _semanticUnitId: string;
  private _semanticUnitVersion: number;
  private _type: ProjectionType;
  private _status: ProjectionStatus;
  private _result: ProjectionResult | null;
  private _error: string | null;
  private _createdAt: Date;
  private _sourceId: string | null;

  private constructor(
    id: ProjectionId,
    semanticUnitId: string,
    semanticUnitVersion: number,
    type: ProjectionType,
    status: ProjectionStatus,
    result: ProjectionResult | null,
    error: string | null,
    createdAt: Date,
    sourceId: string | null = null,
  ) {
    super(id);
    this._semanticUnitId = semanticUnitId;
    this._semanticUnitVersion = semanticUnitVersion;
    this._type = type;
    this._status = status;
    this._result = result;
    this._error = error;
    this._createdAt = createdAt;
    this._sourceId = sourceId;
  }

  get semanticUnitId(): string {
    return this._semanticUnitId;
  }

  get semanticUnitVersion(): number {
    return this._semanticUnitVersion;
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

  get sourceId(): string | null {
    return this._sourceId;
  }

  static create(
    id: ProjectionId,
    semanticUnitId: string,
    semanticUnitVersion: number,
    type: ProjectionType,
    sourceId?: string,
  ): SemanticProjection {
    if (!semanticUnitId) throw new Error("semanticUnitId is required");
    return new SemanticProjection(
      id,
      semanticUnitId,
      semanticUnitVersion,
      type,
      ProjectionStatus.Pending,
      null,
      null,
      new Date(),
      sourceId ?? null,
    );
  }

  static reconstitute(
    id: ProjectionId,
    semanticUnitId: string,
    semanticUnitVersion: number,
    type: ProjectionType,
    status: ProjectionStatus,
    result: ProjectionResult | null,
    error: string | null,
    createdAt: Date,
    sourceId?: string | null,
  ): SemanticProjection {
    return new SemanticProjection(
      id, semanticUnitId, semanticUnitVersion, type, status, result, error, createdAt, sourceId ?? null,
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
        semanticUnitId: this._semanticUnitId,
        semanticUnitVersion: this._semanticUnitVersion,
        projectionType: this._type,
        processingProfileId: result.processingProfileId,
        processingProfileVersion: result.processingProfileVersion,
        sourceId: this._sourceId,
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
        semanticUnitId: this._semanticUnitId,
        error,
      },
    });
  }
}
