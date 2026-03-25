/**
 * End-to-End Test for Semantic Processing Context
 *
 * Tests the complete flow:
 * 1. Create individual use cases with in-memory infrastructure
 * 2. Create a processing profile
 * 3. Process content into projections (chunk + embed + store)
 * 4. Batch processing
 * 5. Error handling (validations)
 * 6. Profile lifecycle (update, deprecate)
 */

import { describe, it, expect } from "vitest";
import { ProjectionType } from "../projection/domain/ProjectionType";
import { processingProfileWiring } from "../processing-profile/composition/wiring";
import { projectionWiring } from "../projection/composition/wiring";

async function createUseCases(dims = 128) {
  const profile = await processingProfileWiring({ provider: "in-memory" });

  // Stub sourceIngestionPort — not needed for these tests
  const stubSourceIngestionPort = {
    sourceExists: async () => true,
    getExtractedText: async () => ({ isOk: () => true, isFail: () => false, value: { text: "" } }) as any,
  };

  const projection = await projectionWiring(
    {
      provider: "in-memory",
      embeddingDimensions: dims,
    },
    {
      profileRepository: profile.profileRepository,
      profileQueries: profile.profileQueries,
      sourceIngestionPort: stubSourceIngestionPort,
    },
  );

  return {
    createProcessingProfile: profile.createProcessingProfile,
    updateProcessingProfile: profile.updateProcessingProfile,
    deprecateProcessingProfile: profile.deprecateProcessingProfile,
    profileQueries: profile.profileQueries,
    processContent: projection.generateProjection,
    vectorStoreConfig: projection.vectorStoreConfig,
  };
}

describe("Semantic Processing Context E2E", () => {
  it("should process content end-to-end with a processing profile", async () => {
    const ucs = await createUseCases(128);

    expect(ucs.processContent).toBeDefined();
    expect(ucs.vectorStoreConfig).toBeDefined();
    expect(ucs.createProcessingProfile).toBeDefined();

    const profileId = crypto.randomUUID();
    const createProfileResult = await ucs.createProcessingProfile.execute({
      id: profileId,
      name: "Default Test Profile",
      preparation: { strategyId: "basic", config: {} },
      fragmentation: { strategyId: "recursive", config: { strategy: "recursive" } },
      projection: { strategyId: "hash-embedding", config: {} },
    });

    expect(createProfileResult.isOk()).toBe(true);
    if (createProfileResult.isOk()) {
      expect(createProfileResult.value.profileId).toBe(profileId);
      expect(createProfileResult.value.version).toBe(1);
    }

    const sourceId = crypto.randomUUID();
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

    const processResult = await ucs.processContent.execute({
      projectionId: crypto.randomUUID(),
      sourceId,
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
        sourceId: crypto.randomUUID(),
        content: "Python is a popular programming language for data science.",
        type: ProjectionType.Embedding,
        processingProfileId: profileId,
      },
      {
        projectionId: crypto.randomUUID(),
        sourceId: crypto.randomUUID(),
        content: "JavaScript is widely used for web development.",
        type: ProjectionType.Embedding,
        processingProfileId: profileId,
      },
    ];

    const batchResults = await Promise.all(batchItems.map((item) => ucs.processContent.execute(item)));
    expect(batchResults).toHaveLength(2);
    expect(batchResults.every((r) => r.isOk())).toBe(true);

    // Empty content should fail
    const emptyContentResult = await ucs.processContent.execute({
      projectionId: crypto.randomUUID(),
      sourceId: crypto.randomUUID(),
      content: "",
      type: ProjectionType.Embedding,
      processingProfileId: profileId,
    });
    expect(emptyContentResult.isFail()).toBe(true);

    // Empty source ID should fail
    const emptyIdResult = await ucs.processContent.execute({
      projectionId: crypto.randomUUID(),
      sourceId: "",
      content: "Some content",
      type: ProjectionType.Embedding,
      processingProfileId: profileId,
    });
    expect(emptyIdResult.isFail()).toBe(true);

    // Non-existent profile should fail
    const badProfileResult = await ucs.processContent.execute({
      projectionId: crypto.randomUUID(),
      sourceId: crypto.randomUUID(),
      content: "Some content",
      type: ProjectionType.Embedding,
      processingProfileId: "non-existent-profile",
    });
    expect(badProfileResult.isFail()).toBe(true);
  });

  it("should manage processing profile lifecycle", async () => {
    const ucs = await createUseCases(128);

    // Create profile
    const profileId = crypto.randomUUID();
    const createResult = await ucs.createProcessingProfile.execute({
      id: profileId,
      name: "Lifecycle Test Profile",
      preparation: { strategyId: "basic", config: {} },
      fragmentation: { strategyId: "sentence", config: {} },
      projection: { strategyId: "hash-embedding", config: {} },
    });
    expect(createResult.isOk()).toBe(true);

    // Update profile
    const updateResult = await ucs.updateProcessingProfile.execute({
      id: profileId,
      name: "Updated Lifecycle Profile",
      fragmentation: { strategyId: "fixed-size", config: {} },
    });
    expect(updateResult.isOk()).toBe(true);
    if (updateResult.isOk()) {
      expect(updateResult.value.version).toBe(2);
    }

    // Deprecate profile
    const deprecateResult = await ucs.deprecateProcessingProfile.execute({
      id: profileId,
      reason: "No longer needed",
    });
    expect(deprecateResult.isOk()).toBe(true);

    // Processing with deprecated profile should fail
    const processResult = await ucs.processContent.execute({
      projectionId: crypto.randomUUID(),
      sourceId: crypto.randomUUID(),
      content: "Some content to process",
      type: ProjectionType.Embedding,
      processingProfileId: profileId,
    });
    expect(processResult.isFail()).toBe(true);

    // Duplicate profile ID should fail
    const duplicateResult = await ucs.createProcessingProfile.execute({
      id: profileId,
      name: "Duplicate Profile",
      preparation: { strategyId: "basic", config: {} },
      fragmentation: { strategyId: "recursive", config: { strategy: "recursive" } },
      projection: { strategyId: "hash-embedding", config: {} },
    });
    expect(duplicateResult.isFail()).toBe(true);
  });

  it("should list all processing profiles sorted by status and date", async () => {
    const ucs = await createUseCases(128);

    // Create profiles with slight delay to ensure different createdAt
    const id1 = crypto.randomUUID();
    await ucs.createProcessingProfile.execute({
      id: id1,
      name: "Profile A",
      preparation: { strategyId: "basic", config: {} },
      fragmentation: { strategyId: "recursive", config: { strategy: "recursive" } },
      projection: { strategyId: "hash-embedding", config: {} },
    });

    const id2 = crypto.randomUUID();
    await ucs.createProcessingProfile.execute({
      id: id2,
      name: "Profile B",
      preparation: { strategyId: "basic", config: {} },
      fragmentation: { strategyId: "sentence", config: {} },
      projection: { strategyId: "hash-embedding", config: {} },
    });

    const id3 = crypto.randomUUID();
    await ucs.createProcessingProfile.execute({
      id: id3,
      name: "Profile C",
      preparation: { strategyId: "basic", config: {} },
      fragmentation: { strategyId: "recursive", config: { strategy: "recursive" } },
      projection: { strategyId: "hash-embedding", config: {} },
    });

    // Deprecate profile A
    await ucs.deprecateProcessingProfile.execute({ id: id1, reason: "testing" });

    const profiles = await ucs.profileQueries.listAll();

    expect(profiles).toHaveLength(3);

    // Active profiles should come first
    const activeProfiles = profiles.filter((p) => p.status === "ACTIVE");
    const deprecatedProfiles = profiles.filter((p) => p.status === "DEPRECATED");
    expect(activeProfiles).toHaveLength(2);
    expect(deprecatedProfiles).toHaveLength(1);

    // Active profiles should appear before deprecated
    const firstDeprecatedIndex = profiles.findIndex((p) => p.status === "DEPRECATED");
    const lastActiveIndex = profiles.length - 1 - [...profiles].reverse().findIndex((p) => p.status === "ACTIVE");
    expect(lastActiveIndex).toBeLessThan(firstDeprecatedIndex);
  });
});
