export { SemanticProcessingService } from "./SemanticProcessingService";
export type {
  ProcessContentSuccess,
  CreateProfileSuccess,
  UpdateProfileSuccess,
  DeprecateProfileSuccess,
} from "./SemanticProcessingService";

export type {
  SemanticProcessingServicePolicy,
  ResolvedSemanticProcessingModules,
} from "../composition/factory";

import type { SemanticProcessingServicePolicy } from "../composition/factory";
import type { SemanticProcessingService as _Service } from "./SemanticProcessingService";

export async function createSemanticProcessingService(
  policy: SemanticProcessingServicePolicy,
): Promise<_Service> {
  const { resolveSemanticProcessingModules } = await import(
    "../composition/factory"
  );
  const { SemanticProcessingService } = await import("./SemanticProcessingService");
  const modules = await resolveSemanticProcessingModules(policy);
  return new SemanticProcessingService(modules);
}
