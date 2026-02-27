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
  ProfileChunkingStrategyRequiredError,
  ProfileEmbeddingStrategyRequiredError,
  ProfileAlreadyExistsError,
  ProfileNotFoundError,
  ProfileDeprecatedError,
  ProfileAlreadyDeprecatedError,
} from "./domain";

export type {
  ProcessingProfileRepository,
  ProfileError,
} from "./domain";

export {
  processingProfileFactory,
} from "./composition";

export type {
  ProcessingProfileInfrastructurePolicy,
  ResolvedProcessingProfileInfra,
  ProcessingProfileFactoryResult,
} from "./composition";
