import { UniqueId } from "../../../shared/domain/index.js";

export class StrategyId extends UniqueId {
  static override create(value: string): StrategyId {
    if (!value || value.trim().length === 0) {
      throw new Error("StrategyId cannot be empty");
    }
    return new StrategyId({ value });
  }
}
