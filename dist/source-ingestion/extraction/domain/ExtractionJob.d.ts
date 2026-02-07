import { AggregateRoot } from "../../../shared/domain/index.js";
import { ExtractionJobId } from "./ExtractionJobId.js";
import { ExtractionStatus } from "./ExtractionStatus.js";
export declare class ExtractionJob extends AggregateRoot<ExtractionJobId> {
    private _sourceId;
    private _status;
    private _startedAt;
    private _completedAt;
    private _error;
    private _createdAt;
    private _extractedText;
    private _contentHash;
    private _metadata;
    private constructor();
    get sourceId(): string;
    get status(): ExtractionStatus;
    get startedAt(): Date | null;
    get completedAt(): Date | null;
    get error(): string | null;
    get createdAt(): Date;
    get extractedText(): string | null;
    get contentHash(): string | null;
    get metadata(): Record<string, unknown> | null;
    static create(id: ExtractionJobId, sourceId: string): ExtractionJob;
    static reconstitute(id: ExtractionJobId, sourceId: string, status: ExtractionStatus, createdAt: Date, startedAt: Date | null, completedAt: Date | null, error: string | null, extractedText: string | null, contentHash: string | null, metadata: Record<string, unknown> | null): ExtractionJob;
    start(): void;
    complete(result: {
        text: string;
        contentHash: string;
        metadata: Record<string, unknown>;
    }): void;
    fail(error: string): void;
}
//# sourceMappingURL=ExtractionJob.d.ts.map