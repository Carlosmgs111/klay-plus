export {
  SemanticKnowledgeFacade,
  SemanticUnitNotFoundError,
  SemanticUnitAlreadyExistsError,
  SemanticUnitOperationError,
  LineageNotFoundError,
  LineageOperationError,
} from "./SemanticKnowledgeFacade";

export type {
  CreateSemanticUnitSuccess,
  CreateSemanticUnitWithLineageSuccess,
  AddSourceSuccess,
  RemoveSourceSuccess,
  ReprocessSuccess,
  RollbackSuccess,
  DeprecateSemanticUnitWithLineageSuccess,
} from "./SemanticKnowledgeFacade";

export type {
  SemanticKnowledgeFacadePolicy,
  ResolvedSemanticKnowledgeModules,
} from "./composition/factory";

import type { SemanticKnowledgeFacadePolicy } from "./composition/factory";
import type { SemanticKnowledgeFacade as _Facade } from "./SemanticKnowledgeFacade";

export async function createSemanticKnowledgeFacade(
  policy: SemanticKnowledgeFacadePolicy
): Promise<_Facade> {
  const { resolveSemanticKnowledgeModules } = await import(
    "./composition/factory"
  );
  const { SemanticKnowledgeFacade } = await import("./SemanticKnowledgeFacade");
  const modules = await resolveSemanticKnowledgeModules(policy);
  return new SemanticKnowledgeFacade(modules);
}
