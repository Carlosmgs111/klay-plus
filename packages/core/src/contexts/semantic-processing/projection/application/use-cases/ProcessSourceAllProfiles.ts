import type { SourceIngestionPort } from "../ports/SourceIngestionPort";
import type { ListProcessingProfiles } from "../../../processing-profile/application/use-cases/ListProcessingProfiles";
import type { FindExistingProjection } from "./FindExistingProjection";
import type { ProcessContent } from "./ProcessContent";
import type { ProcessSourceAllProfilesInput, ProcessSourceAllProfilesResult } from "../../../../../application/knowledge/dtos";
import { Result } from "../../../../../shared/domain/Result";
import { KnowledgeError } from "../../../../../application/knowledge/domain/KnowledgeError";
import { OperationStep } from "../../../../../application/knowledge/domain/OperationStep";

/**
 * ProcessSourceAllProfiles — Use case owned by semantic-processing bounded context.
 *
 * Processes a source against all active processing profiles.
 * Uses SourceIngestionPort to access source existence and extracted text
 * without directly depending on SourceIngestionService.
 */
export class ProcessSourceAllProfiles {
  constructor(
    private readonly _listProfiles: ListProcessingProfiles,
    private readonly _findExistingProjection: FindExistingProjection,
    private readonly _processContent: ProcessContent,
    private readonly _sourceIngestion: SourceIngestionPort,
  ) {}

  async execute(
    input: ProcessSourceAllProfilesInput,
  ): Promise<Result<KnowledgeError, ProcessSourceAllProfilesResult>> {
    try {
      const sourceExists = await this._sourceIngestion.sourceExists(input.sourceId);
      if (!sourceExists) {
        return Result.fail(
          KnowledgeError.fromStep(
            OperationStep.ProcessSourceAllProfiles,
            { message: `Source ${input.sourceId} not found`, code: "SOURCE_NOT_FOUND" },
            [],
          ),
        );
      }

      const textResult = await this._sourceIngestion.getExtractedText(input.sourceId);
      if (textResult.isFail()) {
        return Result.fail(
          KnowledgeError.fromStep(
            OperationStep.ProcessSourceAllProfiles,
            { message: `No extracted text for source ${input.sourceId}`, code: "TEXT_NOT_FOUND" },
            [],
          ),
        );
      }

      const allProfiles = await this._listProfiles.execute();
      const activeProfiles = allProfiles.filter((p) => p.status === "ACTIVE");

      const profileResults: Array<{ profileId: string; processedCount: number; failedCount: number }> = [];

      for (const profile of activeProfiles) {
        const profileId = profile.id.value;
        try {
          const existing = await this._findExistingProjection.execute(input.sourceId, profileId);
          if (existing) {
            profileResults.push({ profileId, processedCount: 1, failedCount: 0 });
            continue;
          }

          const projectionId = crypto.randomUUID();
          const result = await this._processContent.execute({
            projectionId,
            sourceId: input.sourceId,
            content: textResult.value.text,
            type: "EMBEDDING" as any,
            processingProfileId: profileId,
          });

          profileResults.push(
            result.isOk()
              ? { profileId, processedCount: 1, failedCount: 0 }
              : { profileId, processedCount: 0, failedCount: 1 },
          );
        } catch {
          profileResults.push({ profileId, processedCount: 0, failedCount: 1 });
        }
      }

      return Result.ok({
        sourceId: input.sourceId,
        profileResults,
        totalProcessed: profileResults.reduce((s, r) => s + r.processedCount, 0),
        totalFailed: profileResults.reduce((s, r) => s + r.failedCount, 0),
      });
    } catch (error) {
      return Result.fail(KnowledgeError.fromStep(OperationStep.ProcessSourceAllProfiles, error, []));
    }
  }
}
