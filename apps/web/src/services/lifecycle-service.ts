import type { ServiceResult } from "./types";
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
} from "@klay/core/lifecycle";
import type {
  IngestAndAddSourceInput,
  IngestAndAddSourceSuccess,
} from "@klay/core/management";

/**
 * LifecycleService — runtime-agnostic interface for lifecycle operations.
 *
 * Implemented by:
 * - ServerLifecycleService (fetches /api/lifecycle/* routes)
 * - BrowserLifecycleService (calls KnowledgeLifecycleUIAdapter + KnowledgeManagementUIAdapter directly)
 */
export interface LifecycleService {
  removeSource(
    input: RemoveSourceInput,
  ): Promise<ServiceResult<RemoveSourceResult>>;

  reprocessUnit(
    input: ReprocessUnitInput,
  ): Promise<ServiceResult<ReprocessUnitResult>>;

  rollbackUnit(
    input: RollbackUnitInput,
  ): Promise<ServiceResult<RollbackUnitResult>>;

  linkUnits(
    input: LinkUnitsInput,
  ): Promise<ServiceResult<LinkUnitsResult>>;

  unlinkUnits(
    input: UnlinkUnitsInput,
  ): Promise<ServiceResult<UnlinkUnitsResult>>;

  ingestAndAddSource(
    input: IngestAndAddSourceInput,
  ): Promise<ServiceResult<IngestAndAddSourceSuccess>>;
}
