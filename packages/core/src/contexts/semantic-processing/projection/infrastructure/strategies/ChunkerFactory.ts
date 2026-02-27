import type { ChunkingStrategy } from "../../domain/ports/ChunkingStrategy";

export class ChunkerFactory {
  private static strategies = new Map<string, () => ChunkingStrategy>();

  static register(strategyId: string, factory: () => ChunkingStrategy): void {
    ChunkerFactory.strategies.set(strategyId, factory);
  }

  static create(strategyId: string): ChunkingStrategy {
    const factory = ChunkerFactory.strategies.get(strategyId);
    if (!factory) {
      throw new Error(
        `Unknown chunking strategy: "${strategyId}". Available: [${[...ChunkerFactory.strategies.keys()].join(", ")}]`,
      );
    }
    return factory();
  }

  static getAvailableStrategies(): string[] {
    return [...ChunkerFactory.strategies.keys()];
  }

  static clear(): void {
    ChunkerFactory.strategies.clear();
  }
}
