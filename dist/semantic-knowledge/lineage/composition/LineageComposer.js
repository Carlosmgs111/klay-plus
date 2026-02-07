export class LineageComposer {
    static async resolve(policy) {
        const { InMemoryEventPublisher } = await import("../../../shared/infrastructure/InMemoryEventPublisher.js");
        switch (policy.type) {
            case "in-memory": {
                const { InMemoryKnowledgeLineageRepository } = await import("../infrastructure/persistence/InMemoryKnowledgeLineageRepository.js");
                return {
                    repository: new InMemoryKnowledgeLineageRepository(),
                    eventPublisher: new InMemoryEventPublisher(),
                };
            }
            case "browser": {
                const { IndexedDBKnowledgeLineageRepository } = await import("../infrastructure/persistence/indexeddb/IndexedDBKnowledgeLineageRepository.js");
                const dbName = policy.dbName ?? "knowledge-platform";
                return {
                    repository: new IndexedDBKnowledgeLineageRepository(dbName),
                    eventPublisher: new InMemoryEventPublisher(),
                };
            }
            case "server": {
                const { NeDBKnowledgeLineageRepository } = await import("../infrastructure/persistence/nedb/NeDBKnowledgeLineageRepository.js");
                const filename = policy.dbPath
                    ? `${policy.dbPath}/knowledge-lineage.db`
                    : undefined;
                return {
                    repository: new NeDBKnowledgeLineageRepository(filename),
                    eventPublisher: new InMemoryEventPublisher(),
                };
            }
            default:
                throw new Error(`Unknown policy type: ${policy.type}`);
        }
    }
}
//# sourceMappingURL=LineageComposer.js.map