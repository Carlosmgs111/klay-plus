import type { EventPublisher } from "../../../../shared/domain/index.js";
import { Result } from "../../../../shared/domain/Result.js";
import { ProcessingProfile } from "../domain/ProcessingProfile.js";
import { ProcessingProfileId } from "../domain/ProcessingProfileId.js";
import type { ProcessingProfileRepository } from "../domain/ProcessingProfileRepository.js";
import {
  ProfileAlreadyExistsError,
  ProfileNameRequiredError,
  ProfileChunkingStrategyRequiredError,
  ProfileEmbeddingStrategyRequiredError,
  type ProfileError,
} from "../domain/errors/index.js";

export interface CreateProcessingProfileCommand {
  id: string;
  name: string;
  chunkingStrategyId: string;
  embeddingStrategyId: string;
  configuration?: Record<string, unknown>;
}

export class CreateProcessingProfile {
  constructor(
    private readonly repository: ProcessingProfileRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(
    command: CreateProcessingProfileCommand,
  ): Promise<Result<ProfileError, ProcessingProfile>> {
    // ─── Validations ──────────────────────────────────────────────────────
    if (!command.name || command.name.trim() === "") {
      return Result.fail(new ProfileNameRequiredError());
    }
    if (!command.chunkingStrategyId || command.chunkingStrategyId.trim() === "") {
      return Result.fail(new ProfileChunkingStrategyRequiredError());
    }
    if (!command.embeddingStrategyId || command.embeddingStrategyId.trim() === "") {
      return Result.fail(new ProfileEmbeddingStrategyRequiredError());
    }

    // ─── Check Existence ──────────────────────────────────────────────────
    const profileId = ProcessingProfileId.create(command.id);
    const existing = await this.repository.findById(profileId);
    if (existing) {
      return Result.fail(new ProfileAlreadyExistsError(command.id));
    }

    // ─── Create Profile ───────────────────────────────────────────────────
    const profile = ProcessingProfile.create({
      id: profileId,
      name: command.name,
      chunkingStrategyId: command.chunkingStrategyId,
      embeddingStrategyId: command.embeddingStrategyId,
      configuration: command.configuration,
    });

    // ─── Persist and Publish ──────────────────────────────────────────────
    await this.repository.save(profile);
    await this.eventPublisher.publishAll(profile.clearEvents());

    return Result.ok(profile);
  }
}
