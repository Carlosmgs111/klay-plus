import type { KnowledgePipelinePort } from "../knowledge-pipeline/contracts/KnowledgePipelinePort.js";
import type { KnowledgeManagementPort } from "../knowledge-management/contracts/KnowledgeManagementPort.js";
import type { KnowledgePipelinePolicy } from "../knowledge-pipeline/composition/KnowledgePipelineComposer.js";

/**
 * Combined platform that provides both pipeline (construction) and
 * management (lifecycle) orchestrators sharing the same facade instances.
 */
export interface KnowledgePlatform {
  pipeline: KnowledgePipelinePort;
  management: KnowledgeManagementPort;
}

/**
 * Factory function to create a fully configured KnowledgePlatform.
 *
 * Resolves all facades once via the pipeline composer, then shares
 * the ingestion + knowledge + processing facades with the management orchestrator.
 *
 * This is more efficient than creating pipeline + management separately,
 * as it avoids duplicate facade resolution.
 *
 * @example
 * ```typescript
 * const platform = await createKnowledgePlatform({ provider: "server", dbPath: "./data" });
 * await platform.pipeline.execute({ ... });
 * await platform.management.ingestAndAddSource({ ... });
 * ```
 */
export async function createKnowledgePlatform(
  policy: KnowledgePipelinePolicy,
): Promise<KnowledgePlatform> {
  const { KnowledgePipelineComposer } = await import(
    "../knowledge-pipeline/composition/KnowledgePipelineComposer.js"
  );
  const { KnowledgePipelineOrchestrator } = await import(
    "../knowledge-pipeline/application/KnowledgePipelineOrchestrator.js"
  );
  const { KnowledgeManagementOrchestrator } = await import(
    "../knowledge-management/application/KnowledgeManagementOrchestrator.js"
  );

  // Resolve all facades once
  const deps = await KnowledgePipelineComposer.resolve(policy);

  // Share ingestion + knowledge + processing facades with management
  const pipeline = new KnowledgePipelineOrchestrator(deps);
  const management = new KnowledgeManagementOrchestrator({
    ingestion: deps.ingestion,
    knowledge: deps.knowledge,
    processing: deps.processing,
  });

  return { pipeline, management };
}
