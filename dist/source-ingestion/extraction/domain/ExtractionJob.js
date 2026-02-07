import { AggregateRoot } from "../../../shared/domain/index.js";
import { ExtractionStatus } from "./ExtractionStatus.js";
import { ExtractionCompleted } from "./events/ExtractionCompleted.js";
import { ExtractionFailed } from "./events/ExtractionFailed.js";
export class ExtractionJob extends AggregateRoot {
    _sourceId;
    _status;
    _startedAt;
    _completedAt;
    _error;
    _createdAt;
    _extractedText;
    _contentHash;
    _metadata;
    constructor(id, sourceId, status, createdAt, startedAt, completedAt, error, extractedText, contentHash, metadata) {
        super(id);
        this._sourceId = sourceId;
        this._status = status;
        this._createdAt = createdAt;
        this._startedAt = startedAt;
        this._completedAt = completedAt;
        this._error = error;
        this._extractedText = extractedText;
        this._contentHash = contentHash;
        this._metadata = metadata;
    }
    get sourceId() {
        return this._sourceId;
    }
    get status() {
        return this._status;
    }
    get startedAt() {
        return this._startedAt;
    }
    get completedAt() {
        return this._completedAt;
    }
    get error() {
        return this._error;
    }
    get createdAt() {
        return this._createdAt;
    }
    get extractedText() {
        return this._extractedText;
    }
    get contentHash() {
        return this._contentHash;
    }
    get metadata() {
        return this._metadata;
    }
    static create(id, sourceId) {
        if (!sourceId)
            throw new Error("ExtractionJob sourceId is required");
        return new ExtractionJob(id, sourceId, ExtractionStatus.Pending, new Date(), null, null, null, null, null, null);
    }
    static reconstitute(id, sourceId, status, createdAt, startedAt, completedAt, error, extractedText, contentHash, metadata) {
        return new ExtractionJob(id, sourceId, status, createdAt, startedAt, completedAt, error, extractedText, contentHash, metadata);
    }
    start() {
        if (this._status !== ExtractionStatus.Pending) {
            throw new Error(`Cannot start extraction job in status ${this._status}`);
        }
        this._status = ExtractionStatus.Running;
        this._startedAt = new Date();
    }
    complete(result) {
        if (this._status !== ExtractionStatus.Running) {
            throw new Error(`Cannot complete extraction job in status ${this._status}`);
        }
        this._status = ExtractionStatus.Completed;
        this._completedAt = new Date();
        this._extractedText = result.text;
        this._contentHash = result.contentHash;
        this._metadata = result.metadata;
        this.record({
            eventId: crypto.randomUUID(),
            occurredOn: new Date(),
            eventType: ExtractionCompleted.EVENT_TYPE,
            aggregateId: this.id.value,
            payload: {
                sourceId: this._sourceId,
                contentHash: result.contentHash,
            },
        });
    }
    fail(error) {
        if (this._status !== ExtractionStatus.Running) {
            throw new Error(`Cannot fail extraction job in status ${this._status}`);
        }
        this._status = ExtractionStatus.Failed;
        this._completedAt = new Date();
        this._error = error;
        this.record({
            eventId: crypto.randomUUID(),
            occurredOn: new Date(),
            eventType: ExtractionFailed.EVENT_TYPE,
            aggregateId: this.id.value,
            payload: {
                sourceId: this._sourceId,
                error,
            },
        });
    }
}
//# sourceMappingURL=ExtractionJob.js.map