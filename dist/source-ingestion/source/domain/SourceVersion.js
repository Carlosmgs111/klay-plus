import { ValueObject } from "../../../shared/domain/index.js";
/**
 * Represents a version of a source's extracted content.
 * Only stores the hash, not the content itself.
 * The actual content is stored in ExtractionJob.
 */
export class SourceVersion extends ValueObject {
    get version() {
        return this.props.version;
    }
    get contentHash() {
        return this.props.contentHash;
    }
    get extractedAt() {
        return this.props.extractedAt;
    }
    static initial(contentHash) {
        return new SourceVersion({
            version: 1,
            contentHash,
            extractedAt: new Date(),
        });
    }
    next(contentHash) {
        return new SourceVersion({
            version: this.props.version + 1,
            contentHash,
            extractedAt: new Date(),
        });
    }
    hasChanged(otherHash) {
        return this.props.contentHash !== otherHash;
    }
}
//# sourceMappingURL=SourceVersion.js.map