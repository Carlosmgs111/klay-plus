import { AggregateRoot } from "../../../../shared/domain/index.js";
import { ProjectionId } from "./ProjectionId.js";
import { ProjectionStatus } from "./ProjectionStatus.js";
import type { ProjectionType } from "./ProjectionType.js";
import { ProjectionResult } from "./ProjectionResult.js";
import { ProjectionGenerated } from "./events/ProjectionGenerated.js";
import { ProjectionFailed } from "./events/ProjectionFailed.js";

export class SemanticProjection extends AggregateRoot<ProjectionId> {
  private _semanticUnitId: string;
  private _semanticUnitVersion: number;
  private _type: ProjectionType;
  private _status: ProjectionStatus;
  private _result: ProjectionResult | null;
  private _error: string | null;
  private _createdAt: Date;

  private constructor(
    id: ProjectionId,
    semanticUnitId: string,
    semanticUnitVersion: number,
    type: ProjectionType,
    status: ProjectionStatus,
    result: ProjectionResult | null,
    error: string | null,
    createdAt: Date,
  ) {
    super(id);
    this._semanticUnitId = semanticUnitId;
    this._semanticUnitVersion = semanticUnitVersion;
    this._type = type;
    this._status = status;
    this._result = result;
    this._error = error;
    this._createdAt = createdAt;
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

  static create(
    id: ProjectionId,
    semanticUnitId: string,
    semanticUnitVersion: number,
    type: ProjectionType,
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
  ): SemanticProjection {
    return new SemanticProjection(
      id, semanticUnitId, semanticUnitVersion, type, status, result, error, createdAt,
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
