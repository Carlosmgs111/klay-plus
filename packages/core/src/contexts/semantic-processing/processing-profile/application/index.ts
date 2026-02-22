import type { ProcessingProfileRepository } from "../domain/ProcessingProfileRepository.js";
import type { EventPublisher } from "../../../../shared/domain/EventPublisher.js";
import { CreateProcessingProfile } from "./CreateProcessingProfile.js";
import { UpdateProcessingProfile } from "./UpdateProcessingProfile.js";
import { DeprecateProcessingProfile } from "./DeprecateProcessingProfile.js";

export { CreateProcessingProfile } from "./CreateProcessingProfile.js";
export { UpdateProcessingProfile } from "./UpdateProcessingProfile.js";
export { DeprecateProcessingProfile } from "./DeprecateProcessingProfile.js";

export type {
  CreateProcessingProfileCommand,
} from "./CreateProcessingProfile.js";
export type {
  UpdateProcessingProfileCommand,
} from "./UpdateProcessingProfile.js";
export type {
  DeprecateProcessingProfileCommand,
} from "./DeprecateProcessingProfile.js";

/**
 * Aggregated use cases for the ProcessingProfile module.
 */
export class ProcessingProfileUseCases {
  readonly createProfile: CreateProcessingProfile;
  readonly updateProfile: UpdateProcessingProfile;
  readonly deprecateProfile: DeprecateProcessingProfile;

  constructor(
    repository: ProcessingProfileRepository,
    eventPublisher: EventPublisher,
  ) {
    this.createProfile = new CreateProcessingProfile(repository, eventPublisher);
    this.updateProfile = new UpdateProcessingProfile(repository, eventPublisher);
    this.deprecateProfile = new DeprecateProcessingProfile(repository, eventPublisher);
  }
}
