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
  ProfileChunkingStrategyRequiredError,
  ProfileEmbeddingStrategyRequiredError,
  ProfileAlreadyExistsError,
  ProfileNotFoundError,
  ProfileDeprecatedError,
  ProfileAlreadyDeprecatedError,
} from "./processing-profile";

export type {
  ProcessingProfileRepository,
  ProfileError,
  ProcessingProfileInfrastructurePolicy,
  ResolvedProcessingProfileInfra,
  ProcessingProfileFactoryResult,
} from "./processing-profile";

// Facade (Context-Level)
export {
  SemanticProcessingFacade,
  createSemanticProcessingFacade,
} from "./facade";

export type {
  SemanticProcessingFacadePolicy,
  ResolvedSemanticProcessingModules,
  ProcessContentSuccess,
  CreateProfileSuccess,
  UpdateProfileSuccess,
  DeprecateProfileSuccess,
} from "./facade";
