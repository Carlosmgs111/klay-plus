import type { Result } from "../../../shared/domain/Result";
import type { KnowledgeLifecycleError } from "../domain/KnowledgeLifecycleError";
import type {
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
} from "./dtos";

export interface KnowledgeLifecyclePort {
  removeSource(
    input: RemoveSourceInput,
  ): Promise<Result<KnowledgeLifecycleError, RemoveSourceResult>>;

  reprocessUnit(
    input: ReprocessUnitInput,
  ): Promise<Result<KnowledgeLifecycleError, ReprocessUnitResult>>;

  rollbackUnit(
    input: RollbackUnitInput,
  ): Promise<Result<KnowledgeLifecycleError, RollbackUnitResult>>;

  linkUnits(
    input: LinkUnitsInput,
  ): Promise<Result<KnowledgeLifecycleError, LinkUnitsResult>>;

  unlinkUnits(
    input: UnlinkUnitsInput,
  ): Promise<Result<KnowledgeLifecycleError, UnlinkUnitsResult>>;
}
