import type { ProcessingStrategyRepository } from "../../../domain/ProcessingStrategyRepository.js";
import type { ProcessingStrategy } from "../../../domain/ProcessingStrategy.js";
import type { StrategyId } from "../../../domain/StrategyId.js";
import type { StrategyType } from "../../../domain/StrategyType.js";
export declare class NeDBProcessingStrategyRepository implements ProcessingStrategyRepository {
    private store;
    constructor(filename?: string);
    save(entity: ProcessingStrategy): Promise<void>;
    findById(id: StrategyId): Promise<ProcessingStrategy | null>;
    delete(id: StrategyId): Promise<void>;
    findByType(type: StrategyType): Promise<ProcessingStrategy[]>;
    findActiveByType(type: StrategyType): Promise<ProcessingStrategy | null>;
}
//# sourceMappingURL=NeDBProcessingStrategyRepository.d.ts.map