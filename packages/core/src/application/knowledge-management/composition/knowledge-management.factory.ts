import type { KnowledgeManagementPort } from "../contracts/KnowledgeManagementPort";
import type { OrchestratorPolicy } from "../../composition/OrchestratorPolicy";

/** @deprecated Use `OrchestratorPolicy` from `../../composition/OrchestratorPolicy`. */
export type KnowledgeManagementPolicy = OrchestratorPolicy;

export async function createKnowledgeManagement(
  policy: KnowledgeManagementPolicy,
): Promise<KnowledgeManagementPort> {
  const { resolvePlatformDependencies } = await import(
    "../../composition/resolvePlatformDependencies"
  );
  const { KnowledgeManagementOrchestrator } = await import(
    "../application/KnowledgeManagementOrchestrator"
  );

  const platform = await resolvePlatformDependencies(policy);

  return new KnowledgeManagementOrchestrator({
    ingestion: platform.ingestion,
    sourceKnowledge: platform.sourceKnowledge,
    processing: platform.processing,
    contextManagement: platform.contextManagement,
  });
}
