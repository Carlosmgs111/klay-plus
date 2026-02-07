import { ValueObject } from "../../../shared/domain/index.js";
interface QueryProps {
    text: string;
    topK: number;
    filters: Readonly<Record<string, unknown>>;
    minScore: number;
}
export declare class Query extends ValueObject<QueryProps> {
    get text(): string;
    get topK(): number;
    get filters(): Readonly<Record<string, unknown>>;
    get minScore(): number;
    static create(text: string, topK?: number, filters?: Record<string, unknown>, minScore?: number): Query;
}
export {};
//# sourceMappingURL=Query.d.ts.map