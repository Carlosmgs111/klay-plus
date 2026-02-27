import type { KnowledgePipelinePort } from "../knowledge-pipeline/contracts/KnowledgePipelinePort";
import type { KnowledgeManagementPort } from "../knowledge-management/contracts/KnowledgeManagementPort";
import type { KnowledgePipelinePolicy } from "../knowledge-pipeline/composition/knowledge-pipeline.factory";

export interface KnowledgePlatform {
  pipeline: KnowledgePipelinePort;
  management: KnowledgeManagementPort;
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

  const deps = await resolvePipelineDependencies(policy);

  const pipeline = new KnowledgePipelineOrchestrator(deps);
  const management = new KnowledgeManagementOrchestrator({
    ingestion: deps.ingestion,
    knowledge: deps.knowledge,
    processing: deps.processing,
  });

  return { pipeline, management };
}
