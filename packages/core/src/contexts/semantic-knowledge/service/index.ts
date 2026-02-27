export {
  SemanticKnowledgeService,
  SemanticUnitNotFoundError,
  SemanticUnitAlreadyExistsError,
  SemanticUnitOperationError,
  LineageNotFoundError,
  LineageOperationError,
} from "./SemanticKnowledgeService";

export type {
  CreateSemanticUnitSuccess,
  CreateSemanticUnitWithLineageSuccess,
  AddSourceSuccess,
  RemoveSourceSuccess,
  ReprocessSuccess,
  RollbackSuccess,
  DeprecateSemanticUnitWithLineageSuccess,
} from "./SemanticKnowledgeService";

export type {
  SemanticKnowledgeServicePolicy,
  ResolvedSemanticKnowledgeModules,
} from "../composition/factory";

import type { SemanticKnowledgeServicePolicy } from "../composition/factory";
import type { SemanticKnowledgeService as _Service } from "./SemanticKnowledgeService";

export async function createSemanticKnowledgeService(
  policy: SemanticKnowledgeServicePolicy
): Promise<_Service> {
  const { resolveSemanticKnowledgeModules } = await import(
    "../composition/factory"
  );
  const { SemanticKnowledgeService } = await import("./SemanticKnowledgeService");
  const modules = await resolveSemanticKnowledgeModules(policy);
  return new SemanticKnowledgeService(modules);
}
