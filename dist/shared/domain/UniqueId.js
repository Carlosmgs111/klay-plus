import { ValueObject } from "./ValueObject.js";
export class UniqueId extends ValueObject {
    get value() {
        return this.props.value;
    }
    static create(value) {
        if (!value || value.trim().length === 0) {
            throw new Error("UniqueId cannot be empty");
        }
        return new UniqueId({ value });
    }
    toString() {
        return this.props.value;
    }
}
//# sourceMappingURL=UniqueId.js.map