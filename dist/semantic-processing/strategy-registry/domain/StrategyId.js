import { UniqueId } from "../../../shared/domain/index.js";
export class StrategyId extends UniqueId {
    static create(value) {
        if (!value || value.trim().length === 0) {
            throw new Error("StrategyId cannot be empty");
        }
        return new StrategyId({ value });
    }
}
//# sourceMappingURL=StrategyId.js.map