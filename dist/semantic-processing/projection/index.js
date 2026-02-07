// ─── Domain ────────────────────────────────────────────────────────
export { SemanticProjection, ProjectionId, ProjectionType, ProjectionStatus, ProjectionResult, ProjectionGenerated, ProjectionFailed, } from "./domain/index.js";
// ─── Application ───────────────────────────────────────────────────
export { GenerateProjection, ProjectionUseCases } from "./application/index.js";
// ─── Infrastructure (strategies & adapters) ────────────────────────
export { BaseChunker, FixedSizeChunker, SentenceChunker, RecursiveChunker, ChunkerFactory, HashEmbeddingStrategy, WebLLMEmbeddingStrategy, AISdkEmbeddingStrategy, } from "./infrastructure/strategies/index.js";
export { InMemoryVectorStore } from "./infrastructure/adapters/InMemoryVectorStore.js";
// ─── Composition ───────────────────────────────────────────────────
export { ProjectionComposer } from "./composition/ProjectionComposer.js";
export async function projectionFactory(policy) {
    const { ProjectionComposer } = await import("./composition/ProjectionComposer.js");
    const { ProjectionUseCases } = await import("./application/index.js");
    const infra = await ProjectionComposer.resolve(policy);
    return new ProjectionUseCases(infra.repository, infra.embeddingStrategy, infra.chunkingStrategy, infra.vectorStore, infra.eventPublisher);
}
//# sourceMappingURL=index.js.map