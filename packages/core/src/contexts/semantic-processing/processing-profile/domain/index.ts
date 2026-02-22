export { ProcessingProfile } from "./ProcessingProfile.js";
export { ProcessingProfileId } from "./ProcessingProfileId.js";
export { ProfileStatus } from "./ProfileStatus.js";
export type { ProcessingProfileRepository } from "./ProcessingProfileRepository.js";

export { ProfileCreated } from "./events/ProfileCreated.js";
export { ProfileUpdated } from "./events/ProfileUpdated.js";
export { ProfileDeprecated } from "./events/ProfileDeprecated.js";

export {
  ProfileNameRequiredError,
  ProfileChunkingStrategyRequiredError,
  ProfileEmbeddingStrategyRequiredError,
  ProfileAlreadyExistsError,
  ProfileNotFoundError,
  ProfileDeprecatedError,
  ProfileAlreadyDeprecatedError,
} from "./errors/index.js";

export type { ProfileError } from "./errors/index.js";
