import type { ProcessingProfileInfrastructurePolicy } from "./factory";
import type { ProcessingProfileRepository } from "../domain/ProcessingProfileRepository";
import type { CreateProcessingProfile as CreateProcessingProfileType } from "../application/use-cases/CreateProcessingProfile";
import type { UpdateProcessingProfile as UpdateProcessingProfileType } from "../application/use-cases/UpdateProcessingProfile";
import type { DeprecateProcessingProfile as DeprecateProcessingProfileType } from "../application/use-cases/DeprecateProcessingProfile";
import type { ProfileQueries as ProfileQueriesType } from "../application/use-cases/ProfileQueries";

export interface ProcessingProfileWiringResult {
  createProcessingProfile: CreateProcessingProfileType;
  updateProcessingProfile: UpdateProcessingProfileType;
  deprecateProcessingProfile: DeprecateProcessingProfileType;
  profileQueries: ProfileQueriesType;
  /** Exposed for intra-context use by projection module */
  profileRepository: ProcessingProfileRepository;
}

export async function processingProfileWiring(
  policy: ProcessingProfileInfrastructurePolicy,
): Promise<ProcessingProfileWiringResult> {
  const { processingProfileFactory } = await import("./factory");
  const { repository, eventPublisher } = await processingProfileFactory(policy);

  const [
    { CreateProcessingProfile },
    { UpdateProcessingProfile },
    { DeprecateProcessingProfile },
    { ProfileQueries },
  ] = await Promise.all([
    import("../application/use-cases/CreateProcessingProfile"),
    import("../application/use-cases/UpdateProcessingProfile"),
    import("../application/use-cases/DeprecateProcessingProfile"),
    import("../application/use-cases/ProfileQueries"),
  ]);

  return {
    createProcessingProfile: new CreateProcessingProfile(repository, eventPublisher),
    updateProcessingProfile: new UpdateProcessingProfile(repository, eventPublisher),
    deprecateProcessingProfile: new DeprecateProcessingProfile(repository, eventPublisher),
    profileQueries: new ProfileQueries(repository),
    profileRepository: repository,
  };
}
