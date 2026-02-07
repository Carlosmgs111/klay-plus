import { ValueObject } from "../../../shared/domain/index.js";
export class UnitMetadata extends ValueObject {
    get createdAt() {
        return this.props.createdAt;
    }
    get updatedAt() {
        return this.props.updatedAt;
    }
    get createdBy() {
        return this.props.createdBy;
    }
    get tags() {
        return this.props.tags;
    }
    get attributes() {
        return this.props.attributes;
    }
    static create(createdBy, tags = [], attributes = {}) {
        if (!createdBy)
            throw new Error("UnitMetadata createdBy is required");
        const now = new Date();
        return new UnitMetadata({
            createdAt: now,
            updatedAt: now,
            createdBy,
            tags: [...tags],
            attributes: { ...attributes },
        });
    }
    withUpdatedTimestamp() {
        return new UnitMetadata({
            ...this.props,
            updatedAt: new Date(),
        });
    }
}
//# sourceMappingURL=UnitMetadata.js.map