/**
 * Processing Profile Module
 *
 * This module manages processing profiles — versionable, selectable
 * configurations for semantic processing (chunking + embedding).
 *
 * A profile is part of the domain because:
 * - It has identity (ProcessingProfileId)
 * - It has lifecycle (ACTIVE → DEPRECATED)
 * - It has invariants (no modification after deprecation)
 * - It emits domain events
 * - It determines the identity of each generated version
 * - It enables reproducibility via profileId + version
 */

export {
  ProcessingProfile,
  ProcessingProfileId,
  ProfileStatus,
  ProfileCreated,
  ProfileUpdated,
  ProfileDeprecated,
  ProfileNameRequiredError,
  PreparationStrategyRequiredError,
  FragmentationStrategyRequiredError,
  ProjectionStrategyRequiredError,
  ProfileAlreadyExistsError,
  ProfileNotFoundError,
  ProfileDeprecatedError,
  ProfileAlreadyDeprecatedError,
} from "./domain";

export type {
  ProcessingProfileRepository,
  ProfileError,
} from "./domain";

export * from "./domain/value-objects";

export {
  processingProfileFactory,
} from "./composition";

export type {
  ProcessingProfileInfrastructurePolicy,
  ResolvedProcessingProfileInfra,
  ProcessingProfileFactoryResult,
} from "./composition";

// Application use cases
export { CreateProcessingProfile } from "./application/use-cases/CreateProcessingProfile";
export type { CreateProcessingProfileInput, CreateProcessingProfileSuccess } from "./application/use-cases/CreateProcessingProfile";
export { UpdateProcessingProfile } from "./application/use-cases/UpdateProcessingProfile";
export type { UpdateProcessingProfileInput, UpdateProcessingProfileSuccess } from "./application/use-cases/UpdateProcessingProfile";
export { DeprecateProcessingProfile } from "./application/use-cases/DeprecateProcessingProfile";
export type { DeprecateProcessingProfileInput, DeprecateProcessingProfileSuccess } from "./application/use-cases/DeprecateProcessingProfile";
export { ProfileQueries } from "./application/use-cases/ProfileQueries";
