/**
 * Composer for the Source Module.
 *
 * Responsible for resolving infrastructure dependencies based on policy.
 * Each aspect (repository, publisher) has its own resolver method.
 */
export class SourceComposer {
    // ─── Repository Resolution ──────────────────────────────────────────────────
    static async resolveRepository(policy) {
        switch (policy.type) {
            case "in-memory": {
                const { InMemorySourceRepository } = await import("../infrastructure/persistence/InMemorySourceRepository.js");
                return new InMemorySourceRepository();
            }
            case "browser": {
                const { IndexedDBSourceRepository } = await import("../infrastructure/persistence/indexeddb/IndexedDBSourceRepository.js");
                const dbName = policy.dbName ?? "knowledge-platform";
                return new IndexedDBSourceRepository(dbName);
            }
            case "server": {
                const { NeDBSourceRepository } = await import("../infrastructure/persistence/nedb/NeDBSourceRepository.js");
                const filename = policy.dbPath
                    ? `${policy.dbPath}/sources.db`
                    : undefined;
                return new NeDBSourceRepository(filename);
            }
            default:
                throw new Error(`Unknown policy type: ${policy.type}`);
        }
    }
    // ─── Event Publisher Resolution ─────────────────────────────────────────────
    static async resolveEventPublisher(_policy) {
        // Currently all policies use InMemoryEventPublisher
        // This can be extended to support distributed publishers (Redis, Kafka, etc.)
        const { InMemoryEventPublisher } = await import("../../../shared/infrastructure/InMemoryEventPublisher.js");
        return new InMemoryEventPublisher();
    }
    // ─── Main Resolution ────────────────────────────────────────────────────────
    static async resolve(policy) {
        const [repository, eventPublisher] = await Promise.all([
            this.resolveRepository(policy),
            this.resolveEventPublisher(policy),
        ]);
        return {
            repository,
            eventPublisher,
        };
    }
}
//# sourceMappingURL=SourceComposer.js.map