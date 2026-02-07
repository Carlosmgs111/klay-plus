export class SourceComposer {
    static async resolve(policy) {
        const { InMemoryEventPublisher } = await import("../../../shared/infrastructure/InMemoryEventPublisher.js");
        switch (policy.type) {
            case "in-memory": {
                const { InMemorySourceRepository } = await import("../infrastructure/persistence/InMemorySourceRepository.js");
                return {
                    repository: new InMemorySourceRepository(),
                    eventPublisher: new InMemoryEventPublisher(),
                };
            }
            case "browser": {
                const { IndexedDBSourceRepository } = await import("../infrastructure/persistence/indexeddb/IndexedDBSourceRepository.js");
                const dbName = policy.dbName ?? "knowledge-platform";
                return {
                    repository: new IndexedDBSourceRepository(dbName),
                    eventPublisher: new InMemoryEventPublisher(),
                };
            }
            case "server": {
                const { NeDBSourceRepository } = await import("../infrastructure/persistence/nedb/NeDBSourceRepository.js");
                const filename = policy.dbPath
                    ? `${policy.dbPath}/sources.db`
                    : undefined;
                return {
                    repository: new NeDBSourceRepository(filename),
                    eventPublisher: new InMemoryEventPublisher(),
                };
            }
            default:
                throw new Error(`Unknown policy type: ${policy.type}`);
        }
    }
}
//# sourceMappingURL=SourceComposer.js.map