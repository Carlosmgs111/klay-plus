export class ChunkerFactory {
    static strategies = new Map();
    static register(strategyId, factory) {
        ChunkerFactory.strategies.set(strategyId, factory);
    }
    static create(strategyId) {
        const factory = ChunkerFactory.strategies.get(strategyId);
        if (!factory) {
            throw new Error(`Unknown chunking strategy: "${strategyId}". Available: [${[...ChunkerFactory.strategies.keys()].join(", ")}]`);
        }
        return factory();
    }
    static getAvailableStrategies() {
        return [...ChunkerFactory.strategies.keys()];
    }
    static clear() {
        ChunkerFactory.strategies.clear();
    }
}
//# sourceMappingURL=ChunkerFactory.js.map