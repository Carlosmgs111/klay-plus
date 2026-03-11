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
  GenerateProjection,
  projectionFactory,
  // Materializer
  ProcessingProfileMaterializer,
  // Domain Errors
  ProjectionNotFoundError,
  ProjectionAlreadyExistsError,
  ProjectionSourceIdRequiredError,
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
} from "./projection";

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
} from "./projection";

// Processing Profile Module
export {
  ProcessingProfile,
  ProcessingProfileId,
  ProfileStatus,
  processingProfileFactory,
  // Domain Events
  ProfileCreated,
  ProfileUpdated,
  ProfileDeprecated,
  // Domain Errors
  ProfileNameRequiredError,
  PreparationStrategyRequiredError,
  FragmentationStrategyRequiredError,
  ProjectionStrategyRequiredError,
  ProfileAlreadyExistsError,
  ProfileNotFoundError,
  ProfileDeprecatedError,
  ProfileAlreadyDeprecatedError,
  // Value Objects
  PreparationLayer,
  FragmentationLayer,
  ProjectionLayer,
} from "./processing-profile";

export type {
  ProcessingProfileRepository,
  ProfileError,
  ProcessingProfileInfrastructurePolicy,
  ResolvedProcessingProfileInfra,
  ProcessingProfileFactoryResult,
  FragmentationConfig,
  RecursiveConfig,
  SentenceConfig,
  FixedSizeConfig,
  FragmentationStrategyId,
  ProjectionConfig,
} from "./processing-profile";

// Service (Context-Level)
export {
  SemanticProcessingService,
  createSemanticProcessingService,
} from "./service";

export type {
  SemanticProcessingServicePolicy,
  ResolvedSemanticProcessingModules,
  ProcessContentSuccess,
  CreateProfileSuccess,
  UpdateProfileSuccess,
  DeprecateProfileSuccess,
} from "./service";
