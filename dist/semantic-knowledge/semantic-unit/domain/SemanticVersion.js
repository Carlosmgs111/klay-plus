import { ValueObject } from "../../../shared/domain/index.js";
export class SemanticVersion extends ValueObject {
    get version() {
        return this.props.version;
    }
    get meaning() {
        return this.props.meaning;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    get reason() {
        return this.props.reason;
    }
    static initial(meaning) {
        return new SemanticVersion({
            version: 1,
            meaning,
            createdAt: new Date(),
            reason: "Initial version",
        });
    }
    next(meaning, reason) {
        if (!reason || reason.trim().length === 0) {
            throw new Error("Version reason is required");
        }
        return new SemanticVersion({
            version: this.props.version + 1,
            meaning,
            createdAt: new Date(),
            reason,
        });
    }
}
//# sourceMappingURL=SemanticVersion.js.map