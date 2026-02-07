import { AggregateRoot } from "../../../shared/domain/index.js";
import { ProjectionStatus } from "./ProjectionStatus.js";
import { ProjectionGenerated } from "./events/ProjectionGenerated.js";
import { ProjectionFailed } from "./events/ProjectionFailed.js";
export class SemanticProjection extends AggregateRoot {
    _semanticUnitId;
    _semanticUnitVersion;
    _type;
    _status;
    _result;
    _error;
    _createdAt;
    constructor(id, semanticUnitId, semanticUnitVersion, type, status, result, error, createdAt) {
        super(id);
        this._semanticUnitId = semanticUnitId;
        this._semanticUnitVersion = semanticUnitVersion;
        this._type = type;
        this._status = status;
        this._result = result;
        this._error = error;
        this._createdAt = createdAt;
    }
    get semanticUnitId() {
        return this._semanticUnitId;
    }
    get semanticUnitVersion() {
        return this._semanticUnitVersion;
    }
    get type() {
        return this._type;
    }
    get status() {
        return this._status;
    }
    get result() {
        return this._result;
    }
    get error() {
        return this._error;
    }
    get createdAt() {
        return this._createdAt;
    }
    static create(id, semanticUnitId, semanticUnitVersion, type) {
        if (!semanticUnitId)
            throw new Error("semanticUnitId is required");
        return new SemanticProjection(id, semanticUnitId, semanticUnitVersion, type, ProjectionStatus.Pending, null, null, new Date());
    }
    static reconstitute(id, semanticUnitId, semanticUnitVersion, type, status, result, error, createdAt) {
        return new SemanticProjection(id, semanticUnitId, semanticUnitVersion, type, status, result, error, createdAt);
    }
    markProcessing() {
        if (this._status !== ProjectionStatus.Pending) {
            throw new Error(`Cannot start processing projection in status ${this._status}`);
        }
        this._status = ProjectionStatus.Processing;
    }
    complete(result) {
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
                strategyId: result.strategyId,
            },
        });
    }
    fail(error) {
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
//# sourceMappingURL=SemanticProjection.js.map