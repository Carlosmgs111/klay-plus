/**
 * Semantic Processing Bounded Context
 *
 * Responsible for processing extracted content into semantic projections:
 * - Chunking content into meaningful segments
 * - Generating embeddings for semantic search
 * - Storing vectors for retrieval
 * - Managing processing profiles (versionable, selectable configurations)
 */

// Projection Module
export {
  SemanticProjection,
  ProjectionId,
  ProjectionType,
  ProjectionStatus,
  ProjectionResult,
  ProjectionGenerated,
  ProjectionFailed,
  ProjectionUseCases,
  ProjectionComposer,
  GenerateProjection,
  projectionFactory,
  // Materializer
  ProcessingProfileMaterializer,
  // Domain Errors
  ProjectionNotFoundError,
  ProjectionAlreadyExistsError,
  ProjectionSemanticUnitIdRequiredError,
  ProjectionContentRequiredError,
  ProjectionInvalidTypeError,
  ProjectionInvalidStateError,
  ProjectionCannotProcessError,
  ProjectionCannotCompleteError,
  ProjectionCannotFailError,
  ChunkingFailedError,
  EmbeddingFailedError,
  VectorStoreFailedError,
  ProjectionProcessingError,
  // Infrastructure
  BaseChunker,
  FixedSizeChunker,
  SentenceChunker,
  RecursiveChunker,
  ChunkerFactory,
  HashEmbeddingStrategy,
  WebLLMEmbeddingStrategy,
  AISdkEmbeddingStrategy,
  InMemoryVectorWriteStore,
} from "./projection/index.js";

export type {
  SemanticProjectionRepository,
  EmbeddingStrategy,
  EmbeddingResult,
  ChunkingStrategy,
  Chunk,
  VectorWriteStore,
  VectorEntry,
  ProjectionInfrastructurePolicy,
  ResolvedProjectionInfra,
  ProjectionFactoryResult,
  GenerateProjectionCommand,
  GenerateProjectionResult,
  ProjectionError,
  MaterializedStrategies,
} from "./projection/index.js";

// Processing Profile Module
export {
  ProcessingProfile,
  ProcessingProfileId,
  ProfileStatus,
  ProcessingProfileUseCases,
  ProcessingProfileComposer,
  CreateProcessingProfile,
  UpdateProcessingProfile,
  DeprecateProcessingProfile,
  processingProfileFactory,
  // Domain Events
  ProfileCreated,
  ProfileUpdated,
  ProfileDeprecated,
  // Domain Errors
  ProfileNameRequiredError,
  ProfileChunkingStrategyRequiredError,
  ProfileEmbeddingStrategyRequiredError,
  ProfileAlreadyExistsError,
  ProfileNotFoundError,
  ProfileDeprecatedError,
  ProfileAlreadyDeprecatedError,
} from "./processing-profile/index.js";

export type {
  ProcessingProfileRepository,
  ProfileError,
  ProcessingProfileInfrastructurePolicy,
  ResolvedProcessingProfileInfra,
  ProcessingProfileFactoryResult,
} from "./processing-profile/index.js";

// Facade (Context-Level)
export {
  SemanticProcessingFacade,
  SemanticProcessingFacadeComposer,
  createSemanticProcessingFacade,
} from "./facade/index.js";

export type {
  SemanticProcessingFacadePolicy,
  ResolvedSemanticProcessingModules,
  ProcessContentSuccess,
  CreateProfileSuccess,
  UpdateProfileSuccess,
  DeprecateProfileSuccess,
} from "./facade/index.js";
