// ─── Facade ──────────────────────────────────────────────────────────────────
export { KnowledgeRetrievalFacade } from "./KnowledgeRetrievalFacade.js";

// ─── Composition ─────────────────────────────────────────────────────────────
export { KnowledgeRetrievalFacadeComposer } from "./composition/KnowledgeRetrievalFacadeComposer.js";
export type {
  KnowledgeRetrievalFacadePolicy,
  ResolvedKnowledgeRetrievalModules,
} from "./composition/infra-policies.js";

// ─── Facade Factory ──────────────────────────────────────────────────────────
import type { KnowledgeRetrievalFacadePolicy } from "./composition/infra-policies.js";
import type { KnowledgeRetrievalFacade as _Facade } from "./KnowledgeRetrievalFacade.js";

/**
 * Factory function to create a fully configured KnowledgeRetrievalFacade.
 * This is the main entry point for consuming the Knowledge Retrieval context.
 */
export async function createKnowledgeRetrievalFacade(
  policy: KnowledgeRetrievalFacadePolicy,
): Promise<_Facade> {
  const { KnowledgeRetrievalFacadeComposer } = await import(
    "./composition/KnowledgeRetrievalFacadeComposer.js"
  );
  const { KnowledgeRetrievalFacade } = await import("./KnowledgeRetrievalFacade.js");
  const modules = await KnowledgeRetrievalFacadeComposer.resolve(policy);
  return new KnowledgeRetrievalFacade(modules);
}
