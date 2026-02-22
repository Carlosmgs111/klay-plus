import type {
  SemanticQueryInfrastructurePolicy,
  ResolvedSemanticQueryInfra,
} from "./infra-policies.js";
import type { QueryEmbedder } from "../domain/ports/QueryEmbedder.js";
import type { VectorReadStore } from "../domain/ports/VectorReadStore.js";
import type { ProviderRegistry } from "../../../../shared/domain/ProviderRegistry.js";

/**
 * Composer for the Semantic Query Module.
 *
 * Resolves infrastructure dependencies via provider registries.
 * The registries are built externally (in the factory) and injected here.
 */
export class SemanticQueryComposer {
  /**
   * Resolves semantic query infrastructure.
   *
   * @param policy - Infrastructure policy
   * @param embedderProvider - Resolved embedder provider name (determined by factory)
   * @param registries - Provider registries for vectorReadStore and queryEmbedder
   */
  static async resolve(
    policy: SemanticQueryInfrastructurePolicy,
    embedderProvider: string,
    registries: {
      vectorReadStore: ProviderRegistry<VectorReadStore>;
      queryEmbedder: ProviderRegistry<QueryEmbedder>;
    },
  ): Promise<ResolvedSemanticQueryInfra> {
    const { PassthroughRankingStrategy } = await import(
      "../infrastructure/adapters/PassthroughRankingStrategy.js"
    );

    const [queryEmbedder, vectorSearch] = await Promise.all([
      registries.queryEmbedder.resolve(embedderProvider).create(policy),
      registries.vectorReadStore.resolve(policy.provider).create(policy),
    ]);

    return {
      queryEmbedder,
      vectorSearch,
      rankingStrategy: new PassthroughRankingStrategy(),
    };
  }
}
