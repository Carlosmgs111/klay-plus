import type { KnowledgePipelinePort } from "../knowledge-pipeline/contracts/KnowledgePipelinePort";
import type { KnowledgeLifecyclePort } from "../knowledge-lifecycle/contracts/KnowledgeLifecyclePort";
import type { OrchestratorPolicy } from "./OrchestratorPolicy";

export interface KnowledgePlatform {
  pipeline: KnowledgePipelinePort;
  /** @deprecated Use pipeline.ingestAndAddSource() instead */
  management: KnowledgePipelinePort;
  lifecycle: KnowledgeLifecyclePort;
}

export async function createKnowledgePlatform(
  policy: OrchestratorPolicy,
): Promise<KnowledgePlatform> {
  // Resolve shared services once — both orchestrators share the same instances
  const { resolvePipelineDependencies } = await import(
    "../knowledge-pipeline/composition/knowledge-pipeline.factory"
  );
  const [
    { KnowledgePipelineOrchestrator },
    { KnowledgeLifecycleOrchestrator },
  ] = await Promise.all([
    import("../knowledge-pipeline/application/KnowledgePipelineOrchestrator"),
    import("../knowledge-lifecycle/application/KnowledgeLifecycleOrchestrator"),
  ]);

  const deps = await resolvePipelineDependencies(policy);

  const pipeline = new KnowledgePipelineOrchestrator(deps);

  const lifecycle = new KnowledgeLifecycleOrchestrator({
    contextManagement: deps.contextManagement,
    processing: deps.processing,
    ingestion: deps.ingestion,
  });

  return { pipeline, management: pipeline, lifecycle };
}
