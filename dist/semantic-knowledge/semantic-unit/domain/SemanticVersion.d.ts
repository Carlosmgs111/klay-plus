import { ValueObject } from "../../../shared/domain/index.js";
import { Meaning } from "./Meaning.js";
interface SemanticVersionProps {
    version: number;
    meaning: Meaning;
    createdAt: Date;
    reason: string;
}
export declare class SemanticVersion extends ValueObject<SemanticVersionProps> {
    get version(): number;
    get meaning(): Meaning;
    get createdAt(): Date;
    get reason(): string;
    static initial(meaning: Meaning): SemanticVersion;
    next(meaning: Meaning, reason: string): SemanticVersion;
}
export {};
//# sourceMappingURL=SemanticVersion.d.ts.map