// ─── Facade ──────────────────────────────────────────────────────────────────
export {
  SemanticKnowledgeFacade,
  SemanticUnitNotFoundError,
  SemanticUnitAlreadyExistsError,
  SemanticUnitOperationError,
  LineageNotFoundError,
  LineageOperationError,
} from "./SemanticKnowledgeFacade.js";

export type {
  CreateSemanticUnitWithLineageSuccess,
  VersionSemanticUnitWithLineageSuccess,
  DeprecateSemanticUnitWithLineageSuccess,
} from "./SemanticKnowledgeFacade.js";

// ─── Composition ─────────────────────────────────────────────────────────────
export { SemanticKnowledgeFacadeComposer } from "./composition/SemanticKnowledgeFacadeComposer.js";
export type {
  SemanticKnowledgeFacadePolicy,
  ResolvedSemanticKnowledgeModules,
} from "./composition/infra-policies.js";

// ─── Facade Factory ──────────────────────────────────────────────────────────
import type { SemanticKnowledgeFacadePolicy } from "./composition/infra-policies.js";
import type { SemanticKnowledgeFacade as _Facade } from "./SemanticKnowledgeFacade.js";

/**
 * Factory function to create a fully configured SemanticKnowledgeFacade.
 * This is the main entry point for consuming the Semantic Knowledge context.
 */
export async function createSemanticKnowledgeFacade(
  policy: SemanticKnowledgeFacadePolicy
): Promise<_Facade> {
  const { SemanticKnowledgeFacadeComposer } = await import(
    "./composition/SemanticKnowledgeFacadeComposer.js"
  );
  const { SemanticKnowledgeFacade } = await import("./SemanticKnowledgeFacade.js");
  const modules = await SemanticKnowledgeFacadeComposer.resolve(policy);
  return new SemanticKnowledgeFacade(modules);
}
