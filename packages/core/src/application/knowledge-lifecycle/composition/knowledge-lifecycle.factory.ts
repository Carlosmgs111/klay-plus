import type { KnowledgeLifecyclePort } from "../contracts/KnowledgeLifecyclePort";
import type { OrchestratorPolicy } from "../../composition/OrchestratorPolicy";

/** @deprecated Use `OrchestratorPolicy` from `../../composition/OrchestratorPolicy`. */
export type KnowledgeLifecyclePolicy = OrchestratorPolicy;

export async function createKnowledgeLifecycle(
  policy: KnowledgeLifecyclePolicy,
): Promise<KnowledgeLifecyclePort> {
  const { resolvePlatformDependencies } = await import(
    "../../composition/resolvePlatformDependencies"
  );
  const { KnowledgeLifecycleOrchestrator } = await import(
    "../application/KnowledgeLifecycleOrchestrator"
  );

  const platform = await resolvePlatformDependencies(policy);

  return new KnowledgeLifecycleOrchestrator({
    contextManagement: platform.contextManagement,
    processing: platform.processing,
    ingestion: platform.ingestion,
    sourceKnowledge: platform.sourceKnowledge,
  });
}
