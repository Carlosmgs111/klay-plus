import type { ProcessingProfileRepository } from "../../domain/ProcessingProfileRepository";
import type { ProcessingProfile } from "../../domain/ProcessingProfile";
import { ProfileStatus } from "../../domain/ProfileStatus";

export class ListProcessingProfiles {
  constructor(
    private readonly _repository: ProcessingProfileRepository,
  ) {}

  async execute(): Promise<ProcessingProfile[]> {
    const profiles = await this._repository.findAll();
    return profiles.sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === ProfileStatus.Active ? -1 : 1;
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }
}
