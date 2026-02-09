import type {
  SourceInfrastructurePolicy,
  ResolvedSourceInfra,
} from "./infra-policies.js";
import type { SourceRepository } from "../domain/SourceRepository.js";
import type { EventPublisher } from "../../../shared/domain/EventPublisher.js";

/**
 * Composer for the Source Module.
 *
 * Responsible for resolving infrastructure dependencies based on policy.
 * Each aspect (repository, publisher) has its own resolver method.
 */
export class SourceComposer {
  // ─── Repository Resolution ──────────────────────────────────────────────────

  private static async resolveRepository(
    policy: SourceInfrastructurePolicy,
  ): Promise<SourceRepository> {
    switch (policy.type) {
      case "in-memory": {
        const { InMemorySourceRepository } = await import(
          "../infrastructure/persistence/InMemorySourceRepository.js"
        );
        return new InMemorySourceRepository();
      }

      case "browser": {
        const { IndexedDBSourceRepository } = await import(
          "../infrastructure/persistence/indexeddb/IndexedDBSourceRepository.js"
        );
        const dbName = policy.dbName ?? "knowledge-platform";
        return new IndexedDBSourceRepository(dbName);
      }

      case "server": {
        const { NeDBSourceRepository } = await import(
          "../infrastructure/persistence/nedb/NeDBSourceRepository.js"
        );
        const filename = policy.dbPath
          ? `${policy.dbPath}/sources.db`
          : undefined;
        return new NeDBSourceRepository(filename);
      }

      default:
        throw new Error(`Unknown policy type: ${(policy as any).type}`);
    }
  }

  // ─── Event Publisher Resolution ─────────────────────────────────────────────

  private static async resolveEventPublisher(
    _policy: SourceInfrastructurePolicy,
  ): Promise<EventPublisher> {
    // Currently all policies use InMemoryEventPublisher
    // This can be extended to support distributed publishers (Redis, Kafka, etc.)
    const { InMemoryEventPublisher } = await import(
      "../../../shared/infrastructure/InMemoryEventPublisher.js"
    );
    return new InMemoryEventPublisher();
  }

  // ─── Main Resolution ────────────────────────────────────────────────────────

  static async resolve(
    policy: SourceInfrastructurePolicy,
  ): Promise<ResolvedSourceInfra> {
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
