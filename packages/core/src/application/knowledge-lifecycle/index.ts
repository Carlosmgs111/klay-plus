export type { KnowledgeLifecyclePort } from "./contracts/KnowledgeLifecyclePort";

export type {
  RemoveSourceInput,
  RemoveSourceResult,
  ReprocessUnitInput,
  ReprocessUnitResult,
  RollbackUnitInput,
  RollbackUnitResult,
  LinkUnitsInput,
  LinkUnitsResult,
  UnlinkUnitsInput,
  UnlinkUnitsResult,
} from "./contracts/dtos";

export { KnowledgeLifecycleError } from "./domain/KnowledgeLifecycleError";
export { LifecycleStep } from "./domain/LifecycleStep";
export type { LifecycleStep as LifecycleStepType } from "./domain/LifecycleStep";

export { createKnowledgeLifecycle } from "./composition/knowledge-lifecycle.factory";

export type { KnowledgeLifecyclePolicy } from "./composition/knowledge-lifecycle.factory";
