import type { KnowledgePipelinePort } from "../knowledge-pipeline/contracts/KnowledgePipelinePort";
import type { KnowledgeManagementPort } from "../knowledge-management/contracts/KnowledgeManagementPort";
import type { KnowledgeLifecyclePort } from "../knowledge-lifecycle/contracts/KnowledgeLifecyclePort";
import type { OrchestratorPolicy } from "./OrchestratorPolicy";

export interface KnowledgePlatform {
  pipeline: KnowledgePipelinePort;
  management: KnowledgeManagementPort;
  lifecycle: KnowledgeLifecyclePort;
}

export async function createKnowledgePlatform(
  policy: OrchestratorPolicy,
): Promise<KnowledgePlatform> {
  // Resolve shared services once — all 3 orchestrators share the same instances
  const { resolvePipelineDependencies } = await import(
    "../knowledge-pipeline/composition/knowledge-pipeline.factory"
  );
  const [
    { KnowledgePipelineOrchestrator },
    { KnowledgeManagementOrchestrator },
    { KnowledgeLifecycleOrchestrator },
  ] = await Promise.all([
    import("../knowledge-pipeline/application/KnowledgePipelineOrchestrator"),
    import("../knowledge-management/application/KnowledgeManagementOrchestrator"),
    import("../knowledge-lifecycle/application/KnowledgeLifecycleOrchestrator"),
  ]);

  const deps = await resolvePipelineDependencies(policy);

  const pipeline = new KnowledgePipelineOrchestrator(deps);

  const management = new KnowledgeManagementOrchestrator({
    ingestion: deps.ingestion,
    sourceKnowledge: deps.sourceKnowledge,
    processing: deps.processing,
    contextManagement: deps.contextManagement,
    manifestRepository: deps.manifestRepository,
  });

  const lifecycle = new KnowledgeLifecycleOrchestrator({
    contextManagement: deps.contextManagement,
    processing: deps.processing,
    ingestion: deps.ingestion,
    sourceKnowledge: deps.sourceKnowledge,
  });

  return { pipeline, management, lifecycle };
}
