import type { KnowledgePipelinePort } from "../knowledge-pipeline/contracts/KnowledgePipelinePort";
import type { KnowledgeManagementPort } from "../knowledge-management/contracts/KnowledgeManagementPort";
import type { KnowledgeLifecyclePort } from "../knowledge-lifecycle/contracts/KnowledgeLifecyclePort";
import type { KnowledgePipelinePolicy } from "../knowledge-pipeline/composition/knowledge-pipeline.factory";

export interface KnowledgePlatform {
  pipeline: KnowledgePipelinePort;
  management: KnowledgeManagementPort;
  lifecycle: KnowledgeLifecyclePort;
}

export async function createKnowledgePlatform(
  policy: KnowledgePipelinePolicy,
): Promise<KnowledgePlatform> {
  const { resolvePipelineDependencies } = await import(
    "../knowledge-pipeline/composition/knowledge-pipeline.factory"
  );
  const { KnowledgePipelineOrchestrator } = await import(
    "../knowledge-pipeline/application/KnowledgePipelineOrchestrator"
  );
  const { KnowledgeManagementOrchestrator } = await import(
    "../knowledge-management/application/KnowledgeManagementOrchestrator"
  );
  const { KnowledgeLifecycleOrchestrator } = await import(
    "../knowledge-lifecycle/application/KnowledgeLifecycleOrchestrator"
  );

  const deps = await resolvePipelineDependencies(policy);

  const pipeline = new KnowledgePipelineOrchestrator(deps);

  // ── Management uses new services from pipeline deps ──
  const management = new KnowledgeManagementOrchestrator({
    ingestion: deps.ingestion,
    sourceKnowledge: deps.sourceKnowledge,
    processing: deps.processing,
    contextManagement: deps.contextManagement,
  });

  // ── Lifecycle uses ContextManagementService (same instance as pipeline/management) ──
  const lifecycle = new KnowledgeLifecycleOrchestrator({
    contextManagement: deps.contextManagement,
    processing: deps.processing,
  });

  return { pipeline, management, lifecycle };
}
