import type { Repository } from "../../../shared/domain/index.js";
import type { ProcessingStrategy } from "./ProcessingStrategy.js";
import type { StrategyId } from "./StrategyId.js";
import type { StrategyType } from "./StrategyType.js";
export interface ProcessingStrategyRepository extends Repository<ProcessingStrategy, StrategyId> {
    findByType(type: StrategyType): Promise<ProcessingStrategy[]>;
    findActiveByType(type: StrategyType): Promise<ProcessingStrategy | null>;
}
//# sourceMappingURL=ProcessingStrategyRepository.d.ts.map