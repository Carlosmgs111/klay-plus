import { ValueObject } from "../../../shared/domain/index.js";
interface MeaningProps {
    content: string;
    summary: string | null;
    language: string;
    topics: ReadonlyArray<string>;
}
export declare class Meaning extends ValueObject<MeaningProps> {
    get content(): string;
    get summary(): string | null;
    get language(): string;
    get topics(): ReadonlyArray<string>;
    static create(content: string, language: string, topics?: string[], summary?: string | null): Meaning;
}
export {};
//# sourceMappingURL=Meaning.d.ts.map