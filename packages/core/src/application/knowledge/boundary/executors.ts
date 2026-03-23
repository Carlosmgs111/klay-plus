import { Result } from "../../../shared/domain/Result";
import { KnowledgeError } from "../domain/KnowledgeError";
import { OperationStep } from "../domain/OperationStep";
import {
  mapTransitionInput,
  mapTransitionResult,
  mapRemoveSourceResult,
  mapLinkResult,
  mapUnlinkResult,
  mapLineageResult,
  mapSourcesToDTO,
  mapSourceToDetailDTO,
  mapProfilesToDTO,
  mapCreateProfileResult,
  mapUpdateProfileResult,
  mapDeprecateProfileResult,
} from "./mappers";
import type {
  CreateProcessingProfileSuccess,
  ListProfilesResult,
  UpdateProfileResult,
  DeprecateProfileResult,
  ListSourcesResult,
  GetSourceResult,
  RemoveSourceResult,
  LinkContextsResult,
  UnlinkContextsResult,
  GetContextLineageResult,
  TransitionContextStateInput,
  TransitionContextStateResult,
} from "../dtos";
import type { SourceQueries } from "../../../contexts/source-ingestion/source/application/use-cases/SourceQueries";
import type { CreateProcessingProfile } from "../../../contexts/semantic-processing/processing-profile/application/use-cases/CreateProcessingProfile";
import type { UpdateProcessingProfile } from "../../../contexts/semantic-processing/processing-profile/application/use-cases/UpdateProcessingProfile";
import type { DeprecateProcessingProfile } from "../../../contexts/semantic-processing/processing-profile/application/use-cases/DeprecateProcessingProfile";
import type { ProfileQueries } from "../../../contexts/semantic-processing/processing-profile/application/use-cases/ProfileQueries";
import type { RemoveSourceFromContext } from "../../../contexts/context-management/context/application/use-cases/RemoveSourceFromContext";
import type { TransitionContextState } from "../../../contexts/context-management/context/application/use-cases/TransitionContextState";
import type { LinkContexts } from "../../../contexts/context-management/lineage/application/use-cases/LinkContexts";
import type { UnlinkContexts } from "../../../contexts/context-management/lineage/application/use-cases/UnlinkContexts";
import type { LineageQueries } from "../../../contexts/context-management/lineage/application/use-cases/LineageQueries";

// ── Context boundary functions ───────────────────────────────────────

export async function executeTransitionContextState(
  transitionContextState: TransitionContextState,
  input: TransitionContextStateInput,
): Promise<Result<KnowledgeError, TransitionContextStateResult>> {
  try {
    const result = await transitionContextState.execute(mapTransitionInput(input));
    if (result.isFail()) return Result.fail(KnowledgeError.fromStep(OperationStep.TransitionState, result.error, []));
    return Result.ok(mapTransitionResult(result.value));
  } catch (error) {
    return Result.fail(KnowledgeError.fromStep(OperationStep.TransitionState, error, []));
  }
}

export async function executeRemoveSource(
  removeSourceFromContext: RemoveSourceFromContext,
  input: { contextId: string; sourceId: string },
): Promise<Result<KnowledgeError, RemoveSourceResult>> {
  try {
    const result = await removeSourceFromContext.execute(input);
    if (result.isFail()) return Result.fail(KnowledgeError.fromStep(OperationStep.RemoveSource, result.error, []));
    return Result.ok(mapRemoveSourceResult(result.value));
  } catch (error) {
    return Result.fail(KnowledgeError.fromStep(OperationStep.RemoveSource, error, []));
  }
}

// ── Lineage boundary functions ───────────────────────────────────────

export async function executeLinkContexts(
  linkContexts: LinkContexts,
  input: { sourceContextId: string; targetContextId: string; relationshipType: string },
): Promise<Result<KnowledgeError, LinkContextsResult>> {
  try {
    const result = await linkContexts.execute({
      fromContextId: input.sourceContextId,
      toContextId: input.targetContextId,
      relationship: input.relationshipType,
    });
    if (result.isFail()) return Result.fail(KnowledgeError.fromStep(OperationStep.Link, result.error, []));
    return Result.ok(mapLinkResult(result.value));
  } catch (error) {
    return Result.fail(KnowledgeError.fromStep(OperationStep.Link, error, []));
  }
}

export async function executeUnlinkContexts(
  unlinkContexts: UnlinkContexts,
  input: { sourceContextId: string; targetContextId: string },
): Promise<Result<KnowledgeError, UnlinkContextsResult>> {
  try {
    const result = await unlinkContexts.execute({
      fromContextId: input.sourceContextId,
      toContextId: input.targetContextId,
    });
    if (result.isFail()) return Result.fail(KnowledgeError.fromStep(OperationStep.Unlink, result.error, []));
    return Result.ok(mapUnlinkResult(result.value));
  } catch (error) {
    return Result.fail(KnowledgeError.fromStep(OperationStep.Unlink, error, []));
  }
}

export async function executeGetContextLineage(
  lineageQueries: LineageQueries,
  contextId: string,
): Promise<Result<KnowledgeError, GetContextLineageResult>> {
  try {
    const result = await lineageQueries.getLineage(contextId);
    if (result.isFail()) return Result.fail(KnowledgeError.fromStep(OperationStep.Link, result.error, []));
    return Result.ok(mapLineageResult(result.value));
  } catch (error) {
    return Result.fail(KnowledgeError.fromStep(OperationStep.Link, error, []));
  }
}

// ── Source boundary functions ────────────────────────────────────────

export async function executeListSources(
  sourceQueries: SourceQueries,
): Promise<Result<KnowledgeError, ListSourcesResult>> {
  try {
    const sources = await sourceQueries.listAll();
    return Result.ok(mapSourcesToDTO(sources));
  } catch (error) {
    return Result.fail(KnowledgeError.fromStep(OperationStep.Ingestion, error, []));
  }
}

export async function executeGetSource(
  sourceQueries: SourceQueries,
  sourceId: string,
): Promise<Result<KnowledgeError, GetSourceResult>> {
  try {
    const source = await sourceQueries.getById(sourceId);
    if (!source) {
      throw { message: `Source ${sourceId} not found`, code: "SOURCE_NOT_FOUND" };
    }
    return Result.ok(await mapSourceToDetailDTO(source, sourceQueries));
  } catch (error) {
    return Result.fail(KnowledgeError.fromStep(OperationStep.Ingestion, error, []));
  }
}

// ── Profile boundary functions ───────────────────────────────────────

export async function executeCreateProfile(
  createProcessingProfile: CreateProcessingProfile,
  input: { id: string; name: string; preparation: any; fragmentation: any; projection: any },
): Promise<Result<KnowledgeError, CreateProcessingProfileSuccess>> {
  try {
    const result = await createProcessingProfile.execute(input);
    if (result.isFail()) return Result.fail(KnowledgeError.fromStep(OperationStep.Processing, result.error, []));
    return Result.ok(mapCreateProfileResult(result.value));
  } catch (error) {
    return Result.fail(KnowledgeError.fromStep(OperationStep.Processing, error, []));
  }
}

export async function executeListProfiles(
  profileQueries: ProfileQueries,
): Promise<Result<KnowledgeError, ListProfilesResult>> {
  try {
    const profiles = await profileQueries.listAll();
    return Result.ok(mapProfilesToDTO(profiles));
  } catch (error) {
    return Result.fail(KnowledgeError.fromStep(OperationStep.Processing, error, []));
  }
}

export async function executeUpdateProfile(
  updateProcessingProfile: UpdateProcessingProfile,
  input: { id: string; name?: string; preparation?: any; fragmentation?: any; projection?: any },
): Promise<Result<KnowledgeError, UpdateProfileResult>> {
  try {
    const result = await updateProcessingProfile.execute(input);
    if (result.isFail()) return Result.fail(KnowledgeError.fromStep(OperationStep.Processing, result.error, []));
    return Result.ok(mapUpdateProfileResult(result.value));
  } catch (error) {
    return Result.fail(KnowledgeError.fromStep(OperationStep.Processing, error, []));
  }
}

export async function executeDeprecateProfile(
  deprecateProcessingProfile: DeprecateProcessingProfile,
  input: { id: string; reason: string },
): Promise<Result<KnowledgeError, DeprecateProfileResult>> {
  try {
    const result = await deprecateProcessingProfile.execute(input);
    if (result.isFail()) return Result.fail(KnowledgeError.fromStep(OperationStep.Processing, result.error, []));
    return Result.ok(mapDeprecateProfileResult(result.value));
  } catch (error) {
    return Result.fail(KnowledgeError.fromStep(OperationStep.Processing, error, []));
  }
}
