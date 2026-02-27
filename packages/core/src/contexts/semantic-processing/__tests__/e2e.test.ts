/**
 * End-to-End Test for Semantic Processing Context
 *
 * Tests the complete flow:
 * 1. Create service with in-memory infrastructure
 * 2. Create a processing profile
 * 3. Process content into projections (chunk + embed + store)
 * 4. Batch processing
 * 5. Error handling (validations)
 * 6. Profile lifecycle (update, deprecate)
 *
 * Run with: npx vitest run src/backend/klay+/semantic-processing/__tests__/e2e.test.ts
 */

import { describe, it, expect } from "vitest";
import { createSemanticProcessingService } from "../service";
import { ProjectionType } from "../projection/domain/ProjectionType";

describe("Semantic Processing Context E2E", () => {
  it("should process content end-to-end with a processing profile", async () => {
    const service = await createSemanticProcessingService({
      provider: "in-memory",
      embeddingDimensions: 128,
      defaultChunkingStrategy: "recursive",
    });

    expect(service).toBeDefined();
    expect(service.projection).toBeDefined();
    expect(service.vectorStoreConfig).toBeDefined();
    expect(service.createProcessingProfile).toBeDefined();

    const profileId = crypto.randomUUID();
    const createProfileResult = await service.createProcessingProfile({
      id: profileId,
      name: "Default Test Profile",
      chunkingStrategyId: "recursive",
      embeddingStrategyId: "hash-embedding",
      configuration: { embeddingDimensions: 128 },
    });

    expect(createProfileResult.isOk()).toBe(true);
    if (createProfileResult.isOk()) {
      expect(createProfileResult.value.profileId).toBe(profileId);
      expect(createProfileResult.value.version).toBe(1);
    }

    const semanticUnitId = crypto.randomUUID();
    const testContent = `
# Introduction to Machine Learning

Machine learning is a subset of artificial intelligence that focuses on building systems
that can learn from data. These systems improve their performance on specific tasks
without being explicitly programmed.

## Types of Machine Learning

There are three main types of machine learning:

1. **Supervised Learning**: The algorithm learns from labeled training data.
2. **Unsupervised Learning**: The algorithm learns patterns from unlabeled data.
3. **Reinforcement Learning**: The algorithm learns by interacting with an environment.

## Key Concepts

- **Features**: Input variables used to make predictions
- **Labels**: Output variables that the model tries to predict
- **Training**: The process of teaching the model using data
- **Inference**: Using the trained model to make predictions on new data
    `.trim();

    const processResult = await service.processContent({
      projectionId: crypto.randomUUID(),
      semanticUnitId,
      semanticUnitVersion: 1,
      content: testContent,
      type: ProjectionType.Embedding,
      processingProfileId: profileId,
    });

    expect(processResult.isOk()).toBe(true);
    if (processResult.isOk()) {
      expect(processResult.value.chunksCount).toBeGreaterThan(0);
      expect(processResult.value.dimensions).toBe(128);
      expect(processResult.value.model).toBe("hash-local");
    }

    const batchItems = [
      {
        projectionId: crypto.randomUUID(),
        semanticUnitId: crypto.randomUUID(),
        semanticUnitVersion: 1,
        content: "Python is a popular programming language for data science.",
        type: ProjectionType.Embedding,
        processingProfileId: profileId,
      },
      {
        projectionId: crypto.randomUUID(),
        semanticUnitId: crypto.randomUUID(),
        semanticUnitVersion: 1,
        content: "JavaScript is widely used for web development.",
        type: ProjectionType.Embedding,
        processingProfileId: profileId,
      },
    ];

    const batchResults = await service.batchProcess(batchItems);
    expect(batchResults).toHaveLength(2);
    expect(batchResults.every((r) => r.success)).toBe(true);

    // Empty content should fail
    const emptyContentResult = await service.processContent({
      projectionId: crypto.randomUUID(),
      semanticUnitId: crypto.randomUUID(),
      semanticUnitVersion: 1,
      content: "",
      type: ProjectionType.Embedding,
      processingProfileId: profileId,
    });
    expect(emptyContentResult.isFail()).toBe(true);

    // Empty semantic unit ID should fail
    const emptyIdResult = await service.processContent({
      projectionId: crypto.randomUUID(),
      semanticUnitId: "",
      semanticUnitVersion: 1,
      content: "Some content",
      type: ProjectionType.Embedding,
      processingProfileId: profileId,
    });
    expect(emptyIdResult.isFail()).toBe(true);

    // Non-existent profile should fail
    const badProfileResult = await service.processContent({
      projectionId: crypto.randomUUID(),
      semanticUnitId: crypto.randomUUID(),
      semanticUnitVersion: 1,
      content: "Some content",
      type: ProjectionType.Embedding,
      processingProfileId: "non-existent-profile",
    });
    expect(badProfileResult.isFail()).toBe(true);
  });

  it("should manage processing profile lifecycle", async () => {
    const service = await createSemanticProcessingService({
      provider: "in-memory",
      embeddingDimensions: 128,
    });

    // Create profile
    const profileId = crypto.randomUUID();
    const createResult = await service.createProcessingProfile({
      id: profileId,
      name: "Lifecycle Test Profile",
      chunkingStrategyId: "sentence",
      embeddingStrategyId: "hash-embedding",
    });
    expect(createResult.isOk()).toBe(true);

    // Update profile
    const updateResult = await service.updateProcessingProfile({
      id: profileId,
      name: "Updated Lifecycle Profile",
      chunkingStrategyId: "fixed-size",
    });
    expect(updateResult.isOk()).toBe(true);
    if (updateResult.isOk()) {
      expect(updateResult.value.version).toBe(2);
    }

    // Deprecate profile
    const deprecateResult = await service.deprecateProcessingProfile({
      id: profileId,
      reason: "No longer needed",
    });
    expect(deprecateResult.isOk()).toBe(true);

    // Processing with deprecated profile should fail
    const processResult = await service.processContent({
      projectionId: crypto.randomUUID(),
      semanticUnitId: crypto.randomUUID(),
      semanticUnitVersion: 1,
      content: "Some content to process",
      type: ProjectionType.Embedding,
      processingProfileId: profileId,
    });
    expect(processResult.isFail()).toBe(true);

    // Duplicate profile ID should fail
    const duplicateResult = await service.createProcessingProfile({
      id: profileId,
      name: "Duplicate Profile",
      chunkingStrategyId: "recursive",
      embeddingStrategyId: "hash-embedding",
    });
    expect(duplicateResult.isFail()).toBe(true);
  });
});
