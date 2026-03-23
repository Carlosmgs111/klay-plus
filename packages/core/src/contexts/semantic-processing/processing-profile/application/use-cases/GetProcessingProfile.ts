import type { ProcessingProfileRepository } from "../../domain/ProcessingProfileRepository";
import type { ProcessingProfile } from "../../domain/ProcessingProfile";
import { ProcessingProfileId } from "../../domain/ProcessingProfileId";

export interface GetProcessingProfileInput {
  profileId: string;
}

export class GetProcessingProfile {
  constructor(
    private readonly _repository: ProcessingProfileRepository,
  ) {}

  execute(input: GetProcessingProfileInput): Promise<ProcessingProfile | null> {
    return this._repository.findById(ProcessingProfileId.create(input.profileId));
  }
}
