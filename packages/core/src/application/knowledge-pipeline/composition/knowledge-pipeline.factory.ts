import type { KnowledgePipelinePort } from "../contracts/KnowledgePipelinePort.js";
import type { KnowledgePipelinePolicy } from "./KnowledgePipelineComposer.js";

/**
 * Factory function to create a fully configured KnowledgePipeline.
 *
 * This is the main entry point for consuming the orchestrator.
 * Returns ONLY the port — not the implementation, not the facades.
 *
 * Uses dynamic imports for tree-shaking.
 *
 * @example
 * ```typescript
 * const pipeline = await createKnowledgePipeline({ provider: "server", dbPath: "./data" });
 * const result = await pipeline.execute({ ... });
 * ```
 */
export async function createKnowledgePipeline(
  policy: KnowledgePipelinePolicy,
): Promise<KnowledgePipelinePort> {
  const { KnowledgePipelineComposer } = await import(
    "./KnowledgePipelineComposer.js"
  );
  const { KnowledgePipelineOrchestrator } = await import(
    "../application/KnowledgePipelineOrchestrator.js"
  );

  const deps = await KnowledgePipelineComposer.resolve(policy);
  return new KnowledgePipelineOrchestrator(deps);
}
