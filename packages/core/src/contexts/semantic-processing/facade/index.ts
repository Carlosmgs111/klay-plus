export { SemanticProcessingFacade } from "./SemanticProcessingFacade";
export type {
  ProcessContentSuccess,
  CreateProfileSuccess,
  UpdateProfileSuccess,
  DeprecateProfileSuccess,
} from "./SemanticProcessingFacade";

export type {
  SemanticProcessingFacadePolicy,
  ResolvedSemanticProcessingModules,
} from "./composition/factory";

import type { SemanticProcessingFacadePolicy } from "./composition/factory";
import type { SemanticProcessingFacade as _Facade } from "./SemanticProcessingFacade";

export async function createSemanticProcessingFacade(
  policy: SemanticProcessingFacadePolicy,
): Promise<_Facade> {
  const { resolveSemanticProcessingModules } = await import(
    "./composition/factory"
  );
  const { SemanticProcessingFacade } = await import("./SemanticProcessingFacade");
  const modules = await resolveSemanticProcessingModules(policy);
  return new SemanticProcessingFacade(modules);
}
