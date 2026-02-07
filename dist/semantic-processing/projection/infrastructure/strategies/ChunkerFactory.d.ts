import type { ChunkingStrategy } from "../../domain/ports/ChunkingStrategy.js";
export declare class ChunkerFactory {
    private static strategies;
    static register(strategyId: string, factory: () => ChunkingStrategy): void;
    static create(strategyId: string): ChunkingStrategy;
    static getAvailableStrategies(): string[];
    static clear(): void;
}
//# sourceMappingURL=ChunkerFactory.d.ts.map