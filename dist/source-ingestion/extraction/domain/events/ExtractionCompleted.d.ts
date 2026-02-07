import type { DomainEvent } from "../../../../shared/domain/index.js";
export interface ExtractionCompletedPayload {
    sourceId: string;
    contentHash: string;
}
export declare class ExtractionCompleted {
    static readonly EVENT_TYPE = "source-ingestion.extraction.completed";
    static is(event: DomainEvent): event is DomainEvent & {
        payload: ExtractionCompletedPayload;
    };
    static getPayload(event: DomainEvent): ExtractionCompletedPayload;
}
//# sourceMappingURL=ExtractionCompleted.d.ts.map