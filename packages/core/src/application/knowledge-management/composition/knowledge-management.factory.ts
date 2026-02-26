import type { KnowledgeManagementPort } from "../contracts/KnowledgeManagementPort.js";
import type { KnowledgeManagementPolicy } from "./KnowledgeManagementComposer.js";

/**
 * Factory function to create a fully configured KnowledgeManagement orchestrator.
 *
 * This is the main entry point for consuming the management orchestrator.
 * Returns ONLY the port — not the implementation, not the facades.
 *
 * Uses dynamic imports for tree-shaking.
 *
 * @example
 * ```typescript
 * const management = await createKnowledgeManagement({ provider: "server", dbPath: "./data" });
 * const result = await management.addSource({ ... });
 * ```
 */
export async function createKnowledgeManagement(
  policy: KnowledgeManagementPolicy,
): Promise<KnowledgeManagementPort> {
  const { KnowledgeManagementComposer } = await import(
    "./KnowledgeManagementComposer.js"
  );
  const { KnowledgeManagementOrchestrator } = await import(
    "../application/KnowledgeManagementOrchestrator.js"
  );

  const deps = await KnowledgeManagementComposer.resolve(policy);
  return new KnowledgeManagementOrchestrator(deps);
}
