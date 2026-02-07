import { ValueObject } from "../../../shared/domain/index.js";
interface SourceVersionProps {
    version: number;
    contentHash: string;
    extractedAt: Date;
}
/**
 * Represents a version of a source's extracted content.
 * Only stores the hash, not the content itself.
 * The actual content is stored in ExtractionJob.
 */
export declare class SourceVersion extends ValueObject<SourceVersionProps> {
    get version(): number;
    get contentHash(): string;
    get extractedAt(): Date;
    static initial(contentHash: string): SourceVersion;
    next(contentHash: string): SourceVersion;
    hasChanged(otherHash: string): boolean;
}
export {};
//# sourceMappingURL=SourceVersion.d.ts.map