// ─── Facade ─────────────────────────────────────────────────────────────────
export { SemanticProcessingFacade } from "./SemanticProcessingFacade.js";
export type {
  ProcessContentSuccess,
  CreateProfileSuccess,
  UpdateProfileSuccess,
  DeprecateProfileSuccess,
} from "./SemanticProcessingFacade.js";

// ─── Composition ────────────────────────────────────────────────────────────
export { SemanticProcessingFacadeComposer } from "./composition/SemanticProcessingFacadeComposer.js";
export type {
  SemanticProcessingFacadePolicy,
  ResolvedSemanticProcessingModules,
} from "./composition/infra-policies.js";

// ─── Facade Factory ─────────────────────────────────────────────────────────
import type { SemanticProcessingFacadePolicy } from "./composition/infra-policies.js";
import type { SemanticProcessingFacade as _Facade } from "./SemanticProcessingFacade.js";

/**
 * Factory function to create a fully configured SemanticProcessingFacade.
 * This is the main entry point for consuming the Semantic Processing context.
 */
export async function createSemanticProcessingFacade(
  policy: SemanticProcessingFacadePolicy,
): Promise<_Facade> {
  const { SemanticProcessingFacadeComposer } = await import(
    "./composition/SemanticProcessingFacadeComposer.js"
  );
  const { SemanticProcessingFacade } = await import("./SemanticProcessingFacade.js");
  const modules = await SemanticProcessingFacadeComposer.resolve(policy);
  return new SemanticProcessingFacade(modules);
}
