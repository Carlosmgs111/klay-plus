import { AggregateRoot } from "../../../shared/domain/index.js";
import { ExtractionJobId } from "./ExtractionJobId.js";
import { ExtractionStatus } from "./ExtractionStatus.js";
import { ExtractionCompleted } from "./events/ExtractionCompleted.js";
import { ExtractionFailed } from "./events/ExtractionFailed.js";

export class ExtractionJob extends AggregateRoot<ExtractionJobId> {
  private _sourceId: string;
  private _status: ExtractionStatus;
  private _startedAt: Date | null;
  private _completedAt: Date | null;
  private _error: string | null;
  private _createdAt: Date;
  private _extractedText: string | null;
  private _contentHash: string | null;
  private _metadata: Record<string, unknown> | null;

  private constructor(
    id: ExtractionJobId,
    sourceId: string,
    status: ExtractionStatus,
    createdAt: Date,
    startedAt: Date | null,
    completedAt: Date | null,
    error: string | null,
    extractedText: string | null,
    contentHash: string | null,
    metadata: Record<string, unknown> | null,
  ) {
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

  get sourceId(): string {
    return this._sourceId;
  }

  get status(): ExtractionStatus {
    return this._status;
  }

  get startedAt(): Date | null {
    return this._startedAt;
  }

  get completedAt(): Date | null {
    return this._completedAt;
  }

  get error(): string | null {
    return this._error;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get extractedText(): string | null {
    return this._extractedText;
  }

  get contentHash(): string | null {
    return this._contentHash;
  }

  get metadata(): Record<string, unknown> | null {
    return this._metadata;
  }

  static create(id: ExtractionJobId, sourceId: string): ExtractionJob {
    if (!sourceId) throw new Error("ExtractionJob sourceId is required");
    return new ExtractionJob(
      id,
      sourceId,
      ExtractionStatus.Pending,
      new Date(),
      null,
      null,
      null,
      null,
      null,
      null,
    );
  }

  static reconstitute(
    id: ExtractionJobId,
    sourceId: string,
    status: ExtractionStatus,
    createdAt: Date,
    startedAt: Date | null,
    completedAt: Date | null,
    error: string | null,
    extractedText: string | null,
    contentHash: string | null,
    metadata: Record<string, unknown> | null,
  ): ExtractionJob {
    return new ExtractionJob(
      id,
      sourceId,
      status,
      createdAt,
      startedAt,
      completedAt,
      error,
      extractedText,
      contentHash,
      metadata,
    );
  }

  start(): void {
    if (this._status !== ExtractionStatus.Pending) {
      throw new Error(`Cannot start extraction job in status ${this._status}`);
    }
    this._status = ExtractionStatus.Running;
    this._startedAt = new Date();
  }

  complete(result: {
    text: string;
    contentHash: string;
    metadata: Record<string, unknown>;
  }): void {
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

  fail(error: string): void {
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
