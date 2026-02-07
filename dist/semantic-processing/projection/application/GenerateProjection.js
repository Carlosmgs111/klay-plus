import { SemanticProjection } from "../domain/SemanticProjection.js";
import { ProjectionId } from "../domain/ProjectionId.js";
import { ProjectionResult } from "../domain/ProjectionResult.js";
export class GenerateProjection {
    repository;
    embeddingStrategy;
    chunkingStrategy;
    vectorStore;
    eventPublisher;
    constructor(repository, embeddingStrategy, chunkingStrategy, vectorStore, eventPublisher) {
        this.repository = repository;
        this.embeddingStrategy = embeddingStrategy;
        this.chunkingStrategy = chunkingStrategy;
        this.vectorStore = vectorStore;
        this.eventPublisher = eventPublisher;
    }
    async execute(command) {
        const projectionId = ProjectionId.create(command.projectionId);
        const projection = SemanticProjection.create(projectionId, command.semanticUnitId, command.semanticUnitVersion, command.type);
        projection.markProcessing();
        try {
            const chunks = this.chunkingStrategy.chunk(command.content);
            const chunkContents = chunks.map((c) => c.content);
            const embeddings = await this.embeddingStrategy.embedBatch(chunkContents);
            const vectorEntries = chunks.map((chunk, i) => ({
                id: `${command.semanticUnitId}-${command.semanticUnitVersion}-${chunk.index}`,
                semanticUnitId: command.semanticUnitId,
                vector: embeddings[i].vector,
                content: chunk.content,
                metadata: {
                    version: command.semanticUnitVersion,
                    chunkIndex: chunk.index,
                    model: embeddings[i].model,
                    ...chunk.metadata,
                },
            }));
            await this.vectorStore.deleteBySemanticUnitId(command.semanticUnitId);
            await this.vectorStore.upsert(vectorEntries);
            const result = ProjectionResult.create(command.type, {
                chunksCount: chunks.length,
                dimensions: embeddings[0]?.dimensions ?? 0,
                model: embeddings[0]?.model ?? "unknown",
            }, this.embeddingStrategy.strategyId, this.embeddingStrategy.version);
            projection.complete(result);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            projection.fail(message);
        }
        await this.repository.save(projection);
        await this.eventPublisher.publishAll(projection.clearEvents());
    }
}
//# sourceMappingURL=GenerateProjection.js.map