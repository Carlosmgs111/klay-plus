export class SemanticUnitComposer {
    static async resolve(policy) {
        const { InMemoryEventPublisher } = await import("../../../shared/infrastructure/InMemoryEventPublisher.js");
        switch (policy.type) {
            case "in-memory": {
                const { InMemorySemanticUnitRepository } = await import("../infrastructure/persistence/InMemorySemanticUnitRepository.js");
                return {
                    repository: new InMemorySemanticUnitRepository(),
                    eventPublisher: new InMemoryEventPublisher(),
                };
            }
            case "browser": {
                const { IndexedDBSemanticUnitRepository } = await import("../infrastructure/persistence/indexeddb/IndexedDBSemanticUnitRepository.js");
                const dbName = policy.dbName ?? "knowledge-platform";
                return {
                    repository: new IndexedDBSemanticUnitRepository(dbName),
                    eventPublisher: new InMemoryEventPublisher(),
                };
            }
            case "server": {
                const { NeDBSemanticUnitRepository } = await import("../infrastructure/persistence/nedb/NeDBSemanticUnitRepository.js");
                const filename = policy.dbPath
                    ? `${policy.dbPath}/semantic-units.db`
                    : undefined;
                return {
                    repository: new NeDBSemanticUnitRepository(filename),
                    eventPublisher: new InMemoryEventPublisher(),
                };
            }
            default:
                throw new Error(`Unknown policy type: ${policy.type}`);
        }
    }
}
//# sourceMappingURL=SemanticUnitComposer.js.map