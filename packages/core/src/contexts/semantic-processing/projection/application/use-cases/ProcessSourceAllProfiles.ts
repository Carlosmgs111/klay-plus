import type { SourceIngestionPort } from "../ports/SourceIngestionPort";
import type { ProfileQueries } from "../../../processing-profile/application/use-cases/ProfileQueries";
import type { ProjectionQueries } from "./ProjectionQueries";
import type { GenerateProjection } from "./GenerateProjection";
import { Result } from "../../../../../shared/domain/Result";

export interface ProcessSourceAllProfilesInput {
  sourceId: string;
}

export interface ProcessSourceAllProfilesResult {
  sourceId: string;
  profileResults: Array<{
    profileId: string;
    processedCount: number;
    failedCount: number;
  }>;
  totalProcessed: number;
  totalFailed: number;
}
import { type StepError, stepError } from "../../../../../shared/domain/errors/stepError";

/**
 * ProcessSourceAllProfiles — Use case owned by semantic-processing bounded context.
 *
 * Processes a source against all active processing profiles.
 * Uses SourceIngestionPort to access source existence and extracted text
 * without directly depending on SourceIngestionService.
 * Updated to use ProfileQueries, ProjectionQueries, and GenerateProjection directly.
 */
export class ProcessSourceAllProfiles {
  constructor(
    private readonly _profileQueries: ProfileQueries,
    private readonly _projectionQueries: ProjectionQueries,
    private readonly _generateProjection: GenerateProjection,
    private readonly _sourceIngestion: SourceIngestionPort,
  ) {}

  async execute(
    input: ProcessSourceAllProfilesInput,
  ): Promise<Result<StepError, ProcessSourceAllProfilesResult>> {
    try {
      const sourceExists = await this._sourceIngestion.sourceExists(input.sourceId);
      if (!sourceExists) {
        return Result.fail(
          stepError(
            "process-source-all-profiles",
            { message: `Source ${input.sourceId} not found`, code: "SOURCE_NOT_FOUND" },
          ),
        );
      }

      const textResult = await this._sourceIngestion.getExtractedText(input.sourceId);
      if (textResult.isFail()) {
        return Result.fail(
          stepError(
            "process-source-all-profiles",
            { message: `No extracted text for source ${input.sourceId}`, code: "TEXT_NOT_FOUND" },
          ),
        );
      }

      const activeProfiles = await this._profileQueries.listActive();

      const profileResults: Array<{ profileId: string; processedCount: number; failedCount: number }> = [];

      for (const profile of activeProfiles) {
        const profileId = profile.id.value;
        try {
          const existing = await this._projectionQueries.findExisting(input.sourceId, profileId);
          if (existing) {
            profileResults.push({ profileId, processedCount: 1, failedCount: 0 });
            continue;
          }

          const projectionId = crypto.randomUUID();
          const result = await this._generateProjection.execute({
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
      return Result.fail(stepError("process-source-all-profiles", error));
    }
  }
}
