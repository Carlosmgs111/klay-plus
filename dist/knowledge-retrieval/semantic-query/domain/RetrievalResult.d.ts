import { ValueObject } from "../../../shared/domain/index.js";
interface RetrievalItemProps {
    semanticUnitId: string;
    content: string;
    score: number;
    version: number;
    metadata: Readonly<Record<string, unknown>>;
}
export declare class RetrievalItem extends ValueObject<RetrievalItemProps> {
    get semanticUnitId(): string;
    get content(): string;
    get score(): number;
    get version(): number;
    get metadata(): Readonly<Record<string, unknown>>;
    static create(semanticUnitId: string, content: string, score: number, version: number, metadata?: Record<string, unknown>): RetrievalItem;
}
interface RetrievalResultProps {
    queryText: string;
    items: ReadonlyArray<RetrievalItem>;
    totalFound: number;
    executedAt: Date;
}
export declare class RetrievalResult extends ValueObject<RetrievalResultProps> {
    get queryText(): string;
    get items(): ReadonlyArray<RetrievalItem>;
    get totalFound(): number;
    get executedAt(): Date;
    static create(queryText: string, items: RetrievalItem[], totalFound: number): RetrievalResult;
    isEmpty(): boolean;
}
export {};
//# sourceMappingURL=RetrievalResult.d.ts.map