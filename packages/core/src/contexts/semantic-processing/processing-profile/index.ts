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

// ─── Domain ──────────────────────────────────────────────────────────────────
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
} from "./domain/index.js";

export type {
  ProcessingProfileRepository,
  ProfileError,
} from "./domain/index.js";

// ─── Application ─────────────────────────────────────────────────────────────
export {
  ProcessingProfileUseCases,
  CreateProcessingProfile,
  UpdateProcessingProfile,
  DeprecateProcessingProfile,
} from "./application/index.js";

export type {
  CreateProcessingProfileCommand,
  UpdateProcessingProfileCommand,
  DeprecateProcessingProfileCommand,
} from "./application/index.js";

// ─── Composition ─────────────────────────────────────────────────────────────
export {
  ProcessingProfileComposer,
  processingProfileFactory,
} from "./composition/index.js";

export type {
  ProcessingProfileInfrastructurePolicy,
  ResolvedProcessingProfileInfra,
  ProcessingProfileFactoryResult,
} from "./composition/index.js";
