# Processing Profile Layers — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign ProcessingProfile from flat strategy IDs to a 3-layer pipeline model (Preparation, Fragmentation, Projection) with typed config per layer.

**Architecture:** Three Value Objects (PreparationLayer, FragmentationLayer, ProjectionLayer) replace the flat `chunkingStrategyId`, `embeddingStrategyId`, and `configuration` fields on ProcessingProfile. A new PreparationStrategy async port is added. The materializer constructs chunkers with config from layers instead of using the factory. On-read migration handles legacy DTOs.

**Tech Stack:** TypeScript, Vitest, DDD (aggregates, value objects, ports/adapters), Astro + React (UI)

**Spec:** `docs/plans/2026-03-11-processing-profile-layers-design.md`

**Test command:** `pnpm --filter @klay/core test`

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `packages/core/src/contexts/semantic-processing/processing-profile/domain/value-objects/PreparationLayer.ts` | Preparation layer VO with strategy + config validation |
| `packages/core/src/contexts/semantic-processing/processing-profile/domain/value-objects/FragmentationLayer.ts` | Fragmentation layer VO with discriminated union config |
| `packages/core/src/contexts/semantic-processing/processing-profile/domain/value-objects/ProjectionLayer.ts` | Projection layer VO with dimensions + batchSize |
| `packages/core/src/contexts/semantic-processing/processing-profile/domain/value-objects/index.ts` | Barrel export |
| `packages/core/src/contexts/semantic-processing/projection/domain/ports/PreparationStrategy.ts` | Async port interface |
| `packages/core/src/contexts/semantic-processing/projection/infrastructure/strategies/NoOpPreparationStrategy.ts` | Pass-through implementation |
| `packages/core/src/contexts/semantic-processing/projection/infrastructure/strategies/BasicPreparationStrategy.ts` | Whitespace + encoding + trim |
| `packages/core/src/contexts/semantic-processing/processing-profile/__tests__/value-objects.test.ts` | Tests for 3 VOs |
| `packages/core/src/contexts/semantic-processing/projection/__tests__/preparation-strategies.test.ts` | Tests for prep strategies |

### Modified Files
| File | Change Summary |
|------|---------------|
| `packages/core/src/contexts/semantic-processing/processing-profile/domain/ProcessingProfile.ts` | Replace flat fields with 3 layer VOs |
| `packages/core/src/contexts/semantic-processing/processing-profile/domain/errors/ProfileErrors.ts` | Add layer validation errors |
| `packages/core/src/contexts/semantic-processing/processing-profile/infrastructure/persistence/indexeddb/ProfileDTO.ts` | Update DTO + fromDTO legacy migration (shared by both NeDB and IndexedDB repos) |
| `packages/core/src/contexts/semantic-processing/projection/infrastructure/strategies/RecursiveChunker.ts` | Rename strategyId + constructor param |
| `packages/core/src/contexts/semantic-processing/projection/infrastructure/strategies/SentenceChunker.ts` | Rename strategyId |
| `packages/core/src/contexts/semantic-processing/projection/infrastructure/strategies/FixedSizeChunker.ts` | Rename strategyId |
| `packages/core/src/contexts/semantic-processing/projection/composition/ProcessingProfileMaterializer.ts` | Materialize 3 layers |
| `packages/core/src/contexts/semantic-processing/projection/application/GenerateProjection.ts` | Add preparation step |
| `packages/core/src/contexts/semantic-processing/service/SemanticProcessingService.ts` | Update CRUD signatures |
| `packages/core/src/contexts/semantic-processing/composition/factory.ts` | Wire new strategies |
| `packages/core/src/application/knowledge-pipeline/contracts/dtos.ts` | Update profile DTOs |
| `packages/core/src/application/knowledge-pipeline/application/KnowledgePipelineOrchestrator.ts` | Pass 3-layer DTOs |
| `packages/core/src/application/knowledge-pipeline/contracts/KnowledgePipelinePort.ts` | Update port types |
| `packages/core/src/adapters/rest/KnowledgePipelineRESTAdapter.ts` | Update payload handling |
| `apps/web/src/constants/processingStrategies.ts` | Restructure by layer |
| `apps/web/src/components/features/profiles/CreateProfileForm.tsx` | 3-section layout |
| `apps/web/src/components/features/profiles/ProfileEditForm.tsx` | 3-section layout |
| `apps/web/src/components/features/profiles/ProfileList.tsx` | Update columns |
| `apps/web/src/services/pipeline-service.ts` | Update interface types |
| `apps/web/src/services/server-pipeline-service.ts` | Update payload mapping |
| `apps/web/src/server/pipeline-singleton.ts` | Update default profile |

---

## Chunk 1: Domain Value Objects + Aggregate Refactor

### Task 1: PreparationLayer Value Object

**Files:**
- Create: `packages/core/src/contexts/semantic-processing/processing-profile/domain/value-objects/PreparationLayer.ts`
- Test: `packages/core/src/contexts/semantic-processing/processing-profile/__tests__/value-objects.test.ts`

- [ ] **Step 1: Write failing tests for PreparationLayer**

Create test file:

```typescript
// packages/core/src/contexts/semantic-processing/processing-profile/__tests__/value-objects.test.ts
import { describe, it, expect } from "vitest";
import { PreparationLayer } from "../domain/value-objects/PreparationLayer";

describe("PreparationLayer", () => {
  it("creates with 'basic' strategy and full config", () => {
    const layer = PreparationLayer.create("basic", {
      normalizeWhitespace: true,
      normalizeEncoding: true,
      trimContent: false,
    });
    expect(layer.strategyId).toBe("basic");
    expect(layer.config).toEqual({
      normalizeWhitespace: true,
      normalizeEncoding: true,
      trimContent: false,
    });
  });

  it("creates with 'none' strategy and empty config", () => {
    const layer = PreparationLayer.create("none", {});
    expect(layer.strategyId).toBe("none");
    expect(layer.config).toEqual({});
  });

  it("applies defaults for 'basic' when config fields are missing", () => {
    const layer = PreparationLayer.create("basic", {});
    expect(layer.config).toEqual({
      normalizeWhitespace: true,
      normalizeEncoding: true,
      trimContent: true,
    });
  });

  it("throws for unknown strategyId", () => {
    expect(() => PreparationLayer.create("unknown" as any, {})).toThrow();
  });

  it("config is immutable", () => {
    const layer = PreparationLayer.create("basic", {});
    expect(() => {
      (layer.config as any).normalizeWhitespace = false;
    }).toThrow();
  });

  it("reconstitutes from DTO", () => {
    const layer = PreparationLayer.fromDTO({
      strategyId: "basic",
      config: { normalizeWhitespace: false, normalizeEncoding: true, trimContent: true },
    });
    expect(layer.strategyId).toBe("basic");
    expect(layer.config.normalizeWhitespace).toBe(false);
  });

  it("serializes to DTO", () => {
    const layer = PreparationLayer.create("basic", {});
    const dto = layer.toDTO();
    expect(dto).toEqual({
      strategyId: "basic",
      config: { normalizeWhitespace: true, normalizeEncoding: true, trimContent: true },
    });
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL (module not found)**

Run: `pnpm --filter @klay/core test -- --run src/contexts/semantic-processing/processing-profile/__tests__/value-objects.test.ts`
Expected: FAIL — Cannot find module

- [ ] **Step 3: Implement PreparationLayer**

```typescript
// packages/core/src/contexts/semantic-processing/processing-profile/domain/value-objects/PreparationLayer.ts
const VALID_STRATEGY_IDS = ["none", "basic"] as const;
type PreparationStrategyId = (typeof VALID_STRATEGY_IDS)[number];

interface BasicPreparationConfig {
  normalizeWhitespace: boolean;
  normalizeEncoding: boolean;
  trimContent: boolean;
}

type PreparationConfig = BasicPreparationConfig | Record<string, never>;

interface PreparationLayerDTO {
  strategyId: string;
  config: Record<string, unknown>;
}

const BASIC_DEFAULTS: BasicPreparationConfig = {
  normalizeWhitespace: true,
  normalizeEncoding: true,
  trimContent: true,
};

export class PreparationLayer {
  private constructor(
    private readonly _strategyId: PreparationStrategyId,
    private readonly _config: Readonly<PreparationConfig>,
  ) {}

  get strategyId(): PreparationStrategyId {
    return this._strategyId;
  }

  get config(): Readonly<PreparationConfig> {
    return this._config;
  }

  static create(strategyId: string, config: Record<string, unknown>): PreparationLayer {
    if (!VALID_STRATEGY_IDS.includes(strategyId as PreparationStrategyId)) {
      throw new Error(`Unknown preparation strategy: ${strategyId}`);
    }

    const resolvedConfig =
      strategyId === "none"
        ? Object.freeze({} as Record<string, never>)
        : Object.freeze({
            normalizeWhitespace: (config.normalizeWhitespace as boolean) ?? BASIC_DEFAULTS.normalizeWhitespace,
            normalizeEncoding: (config.normalizeEncoding as boolean) ?? BASIC_DEFAULTS.normalizeEncoding,
            trimContent: (config.trimContent as boolean) ?? BASIC_DEFAULTS.trimContent,
          });

    return new PreparationLayer(strategyId as PreparationStrategyId, resolvedConfig);
  }

  static fromDTO(dto: PreparationLayerDTO): PreparationLayer {
    return PreparationLayer.create(dto.strategyId, dto.config);
  }

  toDTO(): PreparationLayerDTO {
    return {
      strategyId: this._strategyId,
      config: { ...this._config },
    };
  }
}
```

- [ ] **Step 4: Run tests — expect PASS**

Run: `pnpm --filter @klay/core test -- --run src/contexts/semantic-processing/processing-profile/__tests__/value-objects.test.ts`
Expected: All 7 tests PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/contexts/semantic-processing/processing-profile/domain/value-objects/PreparationLayer.ts packages/core/src/contexts/semantic-processing/processing-profile/__tests__/value-objects.test.ts
git commit -m "feat(core): add PreparationLayer value object with tests"
```

---

### Task 2: FragmentationLayer Value Object

**Files:**
- Create: `packages/core/src/contexts/semantic-processing/processing-profile/domain/value-objects/FragmentationLayer.ts`
- Modify: `packages/core/src/contexts/semantic-processing/processing-profile/__tests__/value-objects.test.ts`

- [ ] **Step 1: Write failing tests for FragmentationLayer**

Append to the existing test file:

```typescript
import { FragmentationLayer } from "../domain/value-objects/FragmentationLayer";

describe("FragmentationLayer", () => {
  describe("recursive strategy", () => {
    it("creates with valid config", () => {
      const layer = FragmentationLayer.create("recursive", {
        strategy: "recursive",
        chunkSize: 800,
        overlap: 50,
      });
      expect(layer.strategyId).toBe("recursive");
      expect(layer.config).toEqual({ strategy: "recursive", chunkSize: 800, overlap: 50 });
    });

    it("applies defaults when config fields missing", () => {
      const layer = FragmentationLayer.create("recursive", { strategy: "recursive" });
      expect(layer.config).toEqual({ strategy: "recursive", chunkSize: 1000, overlap: 100 });
    });

    it("throws when overlap >= chunkSize", () => {
      expect(() =>
        FragmentationLayer.create("recursive", { strategy: "recursive", chunkSize: 100, overlap: 100 }),
      ).toThrow();
    });

    it("throws when chunkSize <= 0", () => {
      expect(() =>
        FragmentationLayer.create("recursive", { strategy: "recursive", chunkSize: 0, overlap: 0 }),
      ).toThrow();
    });
  });

  describe("sentence strategy", () => {
    it("creates with valid config", () => {
      const layer = FragmentationLayer.create("sentence", {
        strategy: "sentence",
        maxChunkSize: 2000,
        minChunkSize: 200,
      });
      expect(layer.config).toEqual({ strategy: "sentence", maxChunkSize: 2000, minChunkSize: 200 });
    });

    it("applies defaults", () => {
      const layer = FragmentationLayer.create("sentence", { strategy: "sentence" });
      expect(layer.config).toEqual({ strategy: "sentence", maxChunkSize: 1000, minChunkSize: 100 });
    });

    it("throws when minChunkSize >= maxChunkSize", () => {
      expect(() =>
        FragmentationLayer.create("sentence", { strategy: "sentence", maxChunkSize: 100, minChunkSize: 100 }),
      ).toThrow();
    });

    it("throws when minChunkSize <= 0", () => {
      expect(() =>
        FragmentationLayer.create("sentence", { strategy: "sentence", maxChunkSize: 1000, minChunkSize: 0 }),
      ).toThrow();
    });
  });

  describe("fixed-size strategy", () => {
    it("creates with valid config", () => {
      const layer = FragmentationLayer.create("fixed-size", {
        strategy: "fixed-size",
        chunkSize: 300,
        overlap: 30,
      });
      expect(layer.config).toEqual({ strategy: "fixed-size", chunkSize: 300, overlap: 30 });
    });

    it("applies defaults", () => {
      const layer = FragmentationLayer.create("fixed-size", { strategy: "fixed-size" });
      expect(layer.config).toEqual({ strategy: "fixed-size", chunkSize: 500, overlap: 50 });
    });
  });

  it("throws for unknown strategyId", () => {
    expect(() => FragmentationLayer.create("unknown" as any, {} as any)).toThrow();
  });

  it("config is immutable", () => {
    const layer = FragmentationLayer.create("recursive", { strategy: "recursive" });
    expect(() => {
      (layer.config as any).chunkSize = 999;
    }).toThrow();
  });

  it("round-trips through DTO", () => {
    const original = FragmentationLayer.create("sentence", {
      strategy: "sentence",
      maxChunkSize: 500,
      minChunkSize: 50,
    });
    const restored = FragmentationLayer.fromDTO(original.toDTO());
    expect(restored.strategyId).toBe(original.strategyId);
    expect(restored.config).toEqual(original.config);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `pnpm --filter @klay/core test -- --run src/contexts/semantic-processing/processing-profile/__tests__/value-objects.test.ts`
Expected: FAIL — Cannot find module FragmentationLayer

- [ ] **Step 3: Implement FragmentationLayer**

```typescript
// packages/core/src/contexts/semantic-processing/processing-profile/domain/value-objects/FragmentationLayer.ts
const VALID_STRATEGY_IDS = ["recursive", "sentence", "fixed-size"] as const;
type FragmentationStrategyId = (typeof VALID_STRATEGY_IDS)[number];

interface RecursiveConfig {
  strategy: "recursive";
  chunkSize: number;
  overlap: number;
}

interface SentenceConfig {
  strategy: "sentence";
  maxChunkSize: number;
  minChunkSize: number;
}

interface FixedSizeConfig {
  strategy: "fixed-size";
  chunkSize: number;
  overlap: number;
}

type FragmentationConfig = RecursiveConfig | SentenceConfig | FixedSizeConfig;

interface FragmentationLayerDTO {
  strategyId: string;
  config: Record<string, unknown>;
}

const DEFAULTS: Record<FragmentationStrategyId, FragmentationConfig> = {
  recursive: { strategy: "recursive", chunkSize: 1000, overlap: 100 },
  sentence: { strategy: "sentence", maxChunkSize: 1000, minChunkSize: 100 },
  "fixed-size": { strategy: "fixed-size", chunkSize: 500, overlap: 50 },
};

export class FragmentationLayer {
  private constructor(
    private readonly _strategyId: FragmentationStrategyId,
    private readonly _config: Readonly<FragmentationConfig>,
  ) {}

  get strategyId(): FragmentationStrategyId {
    return this._strategyId;
  }

  get config(): Readonly<FragmentationConfig> {
    return this._config;
  }

  static create(strategyId: string, config: Record<string, unknown>): FragmentationLayer {
    if (!VALID_STRATEGY_IDS.includes(strategyId as FragmentationStrategyId)) {
      throw new Error(`Unknown fragmentation strategy: ${strategyId}`);
    }
    const id = strategyId as FragmentationStrategyId;
    const defaults = DEFAULTS[id];
    const resolved = FragmentationLayer._resolveConfig(id, config, defaults);
    FragmentationLayer._validate(resolved);
    return new FragmentationLayer(id, Object.freeze(resolved));
  }

  private static _resolveConfig(
    id: FragmentationStrategyId,
    raw: Record<string, unknown>,
    defaults: FragmentationConfig,
  ): FragmentationConfig {
    switch (id) {
      case "recursive":
        return {
          strategy: "recursive",
          chunkSize: (raw.chunkSize as number) ?? (defaults as RecursiveConfig).chunkSize,
          overlap: (raw.overlap as number) ?? (defaults as RecursiveConfig).overlap,
        };
      case "sentence":
        return {
          strategy: "sentence",
          maxChunkSize: (raw.maxChunkSize as number) ?? (defaults as SentenceConfig).maxChunkSize,
          minChunkSize: (raw.minChunkSize as number) ?? (defaults as SentenceConfig).minChunkSize,
        };
      case "fixed-size":
        return {
          strategy: "fixed-size",
          chunkSize: (raw.chunkSize as number) ?? (defaults as FixedSizeConfig).chunkSize,
          overlap: (raw.overlap as number) ?? (defaults as FixedSizeConfig).overlap,
        };
    }
  }

  private static _validate(config: FragmentationConfig): void {
    switch (config.strategy) {
      case "recursive":
      case "fixed-size": {
        if (config.chunkSize <= 0) throw new Error("chunkSize must be > 0");
        if (config.overlap < 0) throw new Error("overlap must be >= 0");
        if (config.overlap >= config.chunkSize) throw new Error("overlap must be < chunkSize");
        break;
      }
      case "sentence": {
        if (config.maxChunkSize <= 0) throw new Error("maxChunkSize must be > 0");
        if (config.minChunkSize <= 0) throw new Error("minChunkSize must be > 0");
        if (config.minChunkSize >= config.maxChunkSize) throw new Error("minChunkSize must be < maxChunkSize");
        break;
      }
    }
  }

  static fromDTO(dto: FragmentationLayerDTO): FragmentationLayer {
    return FragmentationLayer.create(dto.strategyId, dto.config);
  }

  toDTO(): FragmentationLayerDTO {
    return {
      strategyId: this._strategyId,
      config: { ...this._config },
    };
  }
}

export type { FragmentationConfig, RecursiveConfig, SentenceConfig, FixedSizeConfig, FragmentationStrategyId };
```

- [ ] **Step 4: Run tests — expect PASS**

Run: `pnpm --filter @klay/core test -- --run src/contexts/semantic-processing/processing-profile/__tests__/value-objects.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/contexts/semantic-processing/processing-profile/domain/value-objects/FragmentationLayer.ts packages/core/src/contexts/semantic-processing/processing-profile/__tests__/value-objects.test.ts
git commit -m "feat(core): add FragmentationLayer value object with discriminated union config"
```

---

### Task 3: ProjectionLayer Value Object

**Files:**
- Create: `packages/core/src/contexts/semantic-processing/processing-profile/domain/value-objects/ProjectionLayer.ts`
- Create: `packages/core/src/contexts/semantic-processing/processing-profile/domain/value-objects/index.ts`
- Modify: `packages/core/src/contexts/semantic-processing/processing-profile/__tests__/value-objects.test.ts`

- [ ] **Step 1: Write failing tests for ProjectionLayer**

Append to test file:

```typescript
import { ProjectionLayer } from "../domain/value-objects/ProjectionLayer";

describe("ProjectionLayer", () => {
  it("creates with valid config", () => {
    const layer = ProjectionLayer.create("openai-text-embedding-3-small", {
      dimensions: 1536,
      batchSize: 50,
    });
    expect(layer.strategyId).toBe("openai-text-embedding-3-small");
    expect(layer.config).toEqual({ dimensions: 1536, batchSize: 50 });
  });

  it("applies defaults for missing fields", () => {
    const layer = ProjectionLayer.create("hash-embedding", {});
    expect(layer.config).toEqual({ dimensions: 128, batchSize: 100 });
  });

  it("throws when dimensions <= 0", () => {
    expect(() => ProjectionLayer.create("hash-embedding", { dimensions: 0 })).toThrow();
  });

  it("throws when batchSize <= 0", () => {
    expect(() => ProjectionLayer.create("hash-embedding", { batchSize: -1 })).toThrow();
  });

  it("accepts any strategyId (free string for embedding models)", () => {
    const layer = ProjectionLayer.create("cohere-embed-multilingual-v3.0", { dimensions: 1024 });
    expect(layer.strategyId).toBe("cohere-embed-multilingual-v3.0");
  });

  it("throws for empty strategyId", () => {
    expect(() => ProjectionLayer.create("", {})).toThrow();
  });

  it("config is immutable", () => {
    const layer = ProjectionLayer.create("hash-embedding", {});
    expect(() => {
      (layer.config as any).dimensions = 999;
    }).toThrow();
  });

  it("round-trips through DTO", () => {
    const original = ProjectionLayer.create("openai-text-embedding-3-small", {
      dimensions: 1536,
      batchSize: 25,
    });
    const restored = ProjectionLayer.fromDTO(original.toDTO());
    expect(restored.strategyId).toBe(original.strategyId);
    expect(restored.config).toEqual(original.config);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

- [ ] **Step 3: Implement ProjectionLayer**

```typescript
// packages/core/src/contexts/semantic-processing/processing-profile/domain/value-objects/ProjectionLayer.ts
interface ProjectionConfig {
  dimensions: number;
  batchSize: number;
}

interface ProjectionLayerDTO {
  strategyId: string;
  config: Record<string, unknown>;
}

const DEFAULTS: ProjectionConfig = { dimensions: 128, batchSize: 100 };

export class ProjectionLayer {
  private constructor(
    private readonly _strategyId: string,
    private readonly _config: Readonly<ProjectionConfig>,
  ) {}

  get strategyId(): string {
    return this._strategyId;
  }

  get config(): Readonly<ProjectionConfig> {
    return this._config;
  }

  static create(strategyId: string, config: Record<string, unknown>): ProjectionLayer {
    if (!strategyId || strategyId.trim() === "") {
      throw new Error("Projection strategyId is required");
    }

    const resolved: ProjectionConfig = Object.freeze({
      dimensions: (config.dimensions as number) ?? DEFAULTS.dimensions,
      batchSize: (config.batchSize as number) ?? DEFAULTS.batchSize,
    });

    if (resolved.dimensions <= 0) throw new Error("dimensions must be > 0");
    if (resolved.batchSize <= 0) throw new Error("batchSize must be > 0");

    return new ProjectionLayer(strategyId, resolved);
  }

  static fromDTO(dto: ProjectionLayerDTO): ProjectionLayer {
    return ProjectionLayer.create(dto.strategyId, dto.config);
  }

  toDTO(): ProjectionLayerDTO {
    return {
      strategyId: this._strategyId,
      config: { ...this._config },
    };
  }
}

export type { ProjectionConfig };
```

- [ ] **Step 4: Create barrel export**

```typescript
// packages/core/src/contexts/semantic-processing/processing-profile/domain/value-objects/index.ts
export { PreparationLayer } from "./PreparationLayer";
export { FragmentationLayer } from "./FragmentationLayer";
export type { FragmentationConfig, RecursiveConfig, SentenceConfig, FixedSizeConfig, FragmentationStrategyId } from "./FragmentationLayer";
export { ProjectionLayer } from "./ProjectionLayer";
export type { ProjectionConfig } from "./ProjectionLayer";
```

- [ ] **Step 5: Run tests — expect PASS**

Run: `pnpm --filter @klay/core test -- --run src/contexts/semantic-processing/processing-profile/__tests__/value-objects.test.ts`
Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/contexts/semantic-processing/processing-profile/domain/value-objects/
git add packages/core/src/contexts/semantic-processing/processing-profile/__tests__/value-objects.test.ts
git commit -m "feat(core): add ProjectionLayer value object and barrel exports"
```

---

### Task 4: Refactor ProcessingProfile Aggregate

**Files:**
- Modify: `packages/core/src/contexts/semantic-processing/processing-profile/domain/ProcessingProfile.ts`
- Modify: `packages/core/src/contexts/semantic-processing/processing-profile/domain/errors/ProfileErrors.ts`

- [ ] **Step 1: Read current ProcessingProfile.ts**

Read: `packages/core/src/contexts/semantic-processing/processing-profile/domain/ProcessingProfile.ts`

Understand the exact structure: private constructor params, `create()` factory, `reconstitute()`, `update()`, `deprecate()`, event emissions, and all getters.

- [ ] **Step 2: Update ProfileErrors — add layer-specific errors**

Add to `ProfileErrors.ts`:

```typescript
export class PreparationStrategyRequiredError extends ValidationError {
  constructor() {
    super("Preparation layer is required");
  }
}

export class FragmentationStrategyRequiredError extends ValidationError {
  constructor() {
    super("Fragmentation layer is required");
  }
}

export class ProjectionStrategyRequiredError extends ValidationError {
  constructor() {
    super("Projection layer is required");
  }
}
```

These replace `ProfileChunkingStrategyRequiredError` and `ProfileEmbeddingStrategyRequiredError`. Also update:
1. The `ProfileError` type union in the same file — replace old error names with new ones
2. `errors/index.ts` barrel — export new errors, remove old
3. `processing-profile/index.ts` — update re-exports (lines re-exporting `ProfileChunkingStrategyRequiredError` and `ProfileEmbeddingStrategyRequiredError`)
4. `semantic-processing/index.ts` — update re-exports of the old error names
5. `SemanticProcessingService.ts` — update imports and validation checks that use the old errors

- [ ] **Step 3: Refactor ProcessingProfile aggregate**

Replace `chunkingStrategyId`, `embeddingStrategyId`, and `configuration` with 3 layer Value Objects. Key changes:

1. **Constructor params**: Replace `chunkingStrategyId: string, embeddingStrategyId: string, configuration: Record<string, unknown>` with `preparation: PreparationLayer, fragmentation: FragmentationLayer, projection: ProjectionLayer`
2. **Getters**: Replace `get chunkingStrategyId()`, `get embeddingStrategyId()`, `get configuration()` with `get preparation()`, `get fragmentation()`, `get projection()`
3. **`create()` factory**: Accept layer objects, validate they exist, emit ProfileCreated with layer data
4. **`reconstitute()`**: Change from positional arguments to a params object:
```typescript
// OLD (positional):
static reconstitute(id, name, version, chunkingStrategyId, embeddingStrategyId, configuration, status, createdAt)

// NEW (params object):
static reconstitute(params: {
  id: string;
  name: string;
  version: number;
  preparation: PreparationLayer;
  fragmentation: FragmentationLayer;
  projection: ProjectionLayer;
  status: ProfileStatus;
  createdAt: Date;
}): ProcessingProfile
```
5. **`update()`**: Accept optional layer objects, merge with existing, increment version
6. **Event payloads**: Change from `{ chunkingStrategyId, embeddingStrategyId }` to `{ preparation: layer.toDTO(), fragmentation: layer.toDTO(), projection: layer.toDTO() }`
7. **Remove**: `configuration` field and its freezing logic

- [ ] **Step 4: Run full test suite — identify what breaks**

Run: `pnpm --filter @klay/core test -- --run`
Expected: Failures in existing tests that reference old fields. Note which tests fail.

- [ ] **Step 5: Commit (aggregate refactor, tests may be broken)**

```bash
git add packages/core/src/contexts/semantic-processing/processing-profile/domain/
git commit -m "refactor(core): replace flat strategy fields with layer VOs on ProcessingProfile"
```

---

### Task 5: Update ProfileDTO + Legacy Migration

**Files:**
- Modify: `packages/core/src/contexts/semantic-processing/processing-profile/infrastructure/persistence/indexeddb/ProfileDTO.ts` (shared by both NeDB and IndexedDB repos — NeDB imports from this file)
- Create: `packages/core/src/contexts/semantic-processing/processing-profile/__tests__/profile-dto.test.ts`

- [ ] **Step 1: Read current ProfileDTO file**

Read: `packages/core/src/contexts/semantic-processing/processing-profile/infrastructure/persistence/indexeddb/ProfileDTO.ts`
Verify that the NeDB repo imports from this same file (no separate nedb/ProfileDTO.ts exists).

- [ ] **Step 2: Update ProfileDTO interface**

Replace flat fields with layer objects:

```typescript
interface ProfileDTO {
  id: string;
  name: string;
  version: number;
  status: string;
  preparation: { strategyId: string; config: Record<string, unknown> };
  fragmentation: { strategyId: string; config: Record<string, unknown> };
  projection: { strategyId: string; config: Record<string, unknown> };
  createdAt: string;
  // Legacy fields (for migration detection):
  chunkingStrategyId?: string;
  embeddingStrategyId?: string;
  configuration?: Record<string, unknown>;
}
```

- [ ] **Step 3: Update `toDTO()`**

```typescript
function toDTO(profile: ProcessingProfile): ProfileDTO {
  return {
    id: profile.id.value,
    name: profile.name,
    version: profile.version,
    status: profile.status,
    preparation: profile.preparation.toDTO(),
    fragmentation: profile.fragmentation.toDTO(),
    projection: profile.projection.toDTO(),
    createdAt: profile.createdAt.toISOString(),
  };
}
```

- [ ] **Step 4: Update `fromDTO()` with legacy migration**

```typescript
function fromDTO(dto: ProfileDTO): ProcessingProfile {
  // Legacy format detection
  if ("chunkingStrategyId" in dto && dto.chunkingStrategyId) {
    const strategyId = dto.chunkingStrategyId;
    const fragmentationConfig =
      strategyId === "sentence"
        ? { strategy: "sentence", maxChunkSize: 1000, minChunkSize: 100 }
        : strategyId === "fixed-size"
          ? { strategy: "fixed-size", chunkSize: 500, overlap: 50 }
          : { strategy: "recursive", chunkSize: 1000, overlap: 100 };

    return ProcessingProfile.reconstitute({
      id: dto.id,
      name: dto.name,
      version: dto.version,
      status: dto.status as ProfileStatus,
      preparation: PreparationLayer.create("basic", {
        normalizeWhitespace: true,
        normalizeEncoding: true,
        trimContent: true,
      }),
      fragmentation: FragmentationLayer.create(strategyId, fragmentationConfig),
      projection: ProjectionLayer.create(dto.embeddingStrategyId!, {
        dimensions: 128,
        batchSize: 100,
      }),
      createdAt: new Date(dto.createdAt),
    });
  }

  // New format
  return ProcessingProfile.reconstitute({
    id: dto.id,
    name: dto.name,
    version: dto.version,
    status: dto.status as ProfileStatus,
    preparation: PreparationLayer.fromDTO(dto.preparation),
    fragmentation: FragmentationLayer.fromDTO(dto.fragmentation),
    projection: ProjectionLayer.fromDTO(dto.projection),
    createdAt: new Date(dto.createdAt),
  });
}
```

- [ ] **Step 5: Write tests for legacy migration and DTO round-trip**

Create a dedicated test file for DTO concerns:

```typescript
// packages/core/src/contexts/semantic-processing/processing-profile/__tests__/profile-dto.test.ts
import { describe, it, expect } from "vitest";
import { fromDTO, toDTO } from "../infrastructure/persistence/indexeddb/ProfileDTO";
import { ProcessingProfile } from "../domain/ProcessingProfile";
import { PreparationLayer } from "../domain/value-objects/PreparationLayer";
import { FragmentationLayer } from "../domain/value-objects/FragmentationLayer";
import { ProjectionLayer } from "../domain/value-objects/ProjectionLayer";

describe("ProfileDTO", () => {
  describe("legacy migration (fromDTO)", () => {
    it("migrates legacy DTO with chunkingStrategyId to new format", () => {
      const legacyDTO = {
        id: "test-id",
        name: "Legacy Profile",
        version: 1,
        status: "ACTIVE",
        chunkingStrategyId: "recursive",
        embeddingStrategyId: "hash-embedding",
        configuration: {},
        createdAt: "2026-01-01T00:00:00.000Z",
      };
      const profile = fromDTO(legacyDTO as any);
      expect(profile.preparation.strategyId).toBe("basic");
      expect(profile.fragmentation.strategyId).toBe("recursive");
      expect(profile.fragmentation.config).toEqual({ strategy: "recursive", chunkSize: 1000, overlap: 100 });
      expect(profile.projection.strategyId).toBe("hash-embedding");
    });

    it("migrates legacy sentence strategy with correct defaults", () => {
      const legacyDTO = {
        id: "test-id-2",
        name: "Sentence Profile",
        version: 1,
        status: "ACTIVE",
        chunkingStrategyId: "sentence",
        embeddingStrategyId: "hash-embedding",
        configuration: {},
        createdAt: "2026-01-01T00:00:00.000Z",
      };
      const profile = fromDTO(legacyDTO as any);
      expect(profile.fragmentation.config).toEqual({ strategy: "sentence", maxChunkSize: 1000, minChunkSize: 100 });
    });
  });

  describe("new format round-trip", () => {
    it("round-trips a profile through toDTO/fromDTO", () => {
      const profile = ProcessingProfile.create({
        name: "Round Trip",
        preparation: PreparationLayer.create("basic", {}),
        fragmentation: FragmentationLayer.create("fixed-size", { strategy: "fixed-size", chunkSize: 300, overlap: 30 }),
        projection: ProjectionLayer.create("hash-embedding", { dimensions: 64 }),
      });
      const dto = toDTO(profile);
      const restored = fromDTO(dto);
      expect(restored.name).toBe("Round Trip");
      expect(restored.preparation.strategyId).toBe("basic");
      expect(restored.fragmentation.strategyId).toBe("fixed-size");
      expect(restored.fragmentation.config).toEqual({ strategy: "fixed-size", chunkSize: 300, overlap: 30 });
      expect(restored.projection.config.dimensions).toBe(64);
    });
  });
});
```

Note: The `InMemoryProcessingProfileRepository` stores domain objects directly (no DTO round-trip), so the `fromDTO()` legacy migration code path is only exercised through NeDB/IndexedDB repos. This unit test directly exercises `fromDTO()` which is the shared function used by both persistence implementations.

- [ ] **Step 6: Run DTO tests**

Run: `pnpm --filter @klay/core test -- --run src/contexts/semantic-processing/processing-profile/__tests__/profile-dto.test.ts`
Expected: Legacy migration tests and round-trip test PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/contexts/semantic-processing/processing-profile/infrastructure/persistence/
git add packages/core/src/contexts/semantic-processing/processing-profile/__tests__/profile-dto.test.ts
git commit -m "feat(core): update ProfileDTO with layer format + legacy on-read migration"
```

---

### Task 6: Update barrel exports and fix remaining Phase 1 tests

**Files:**
- Modify: `packages/core/src/contexts/semantic-processing/processing-profile/index.ts`
- Modify: `packages/core/src/contexts/semantic-processing/index.ts`
- Modify: Any existing tests that reference old fields

- [ ] **Step 1: Update barrel exports**

Add to `processing-profile/index.ts`:
```typescript
export * from "./domain/value-objects";
```

Ensure `semantic-processing/index.ts` re-exports the value objects.

- [ ] **Step 2: Fix existing tests that reference old fields**

Read: `packages/core/src/contexts/semantic-processing/__tests__/e2e.test.ts` and any other test files.

Update `createProcessingProfile()` calls from:
```typescript
{ id: "p1", name: "Test", chunkingStrategyId: "recursive", embeddingStrategyId: "hash-embedding" }
```
to:
```typescript
{
  id: "p1",
  name: "Test",
  preparation: { strategyId: "basic", config: {} },
  fragmentation: { strategyId: "recursive", config: { strategy: "recursive" } },
  projection: { strategyId: "hash-embedding", config: {} },
}
```

Note: The service layer isn't updated yet (Task 9), so this step may need to be deferred. If the e2e tests go through the service, leave them broken for now — they'll be fixed in Phase 3.

- [ ] **Step 3: Run full core test suite**

Run: `pnpm --filter @klay/core test -- --run`
Expected: Value object tests PASS. Some e2e tests may still fail (will be fixed in Phases 2-3). Document which tests still fail.

- [ ] **Step 4: Commit**

```bash
git add packages/core/src/contexts/semantic-processing/
git commit -m "feat(core): update barrel exports for layer value objects"
```

---

## Chunk 2: PreparationStrategy + Pipeline

### Task 7: PreparationStrategy Port + Implementations

**Files:**
- Create: `packages/core/src/contexts/semantic-processing/projection/domain/ports/PreparationStrategy.ts`
- Create: `packages/core/src/contexts/semantic-processing/projection/infrastructure/strategies/NoOpPreparationStrategy.ts`
- Create: `packages/core/src/contexts/semantic-processing/projection/infrastructure/strategies/BasicPreparationStrategy.ts`
- Create: `packages/core/src/contexts/semantic-processing/projection/__tests__/preparation-strategies.test.ts`

- [ ] **Step 1: Write failing tests for preparation strategies**

```typescript
// packages/core/src/contexts/semantic-processing/projection/__tests__/preparation-strategies.test.ts
import { describe, it, expect } from "vitest";
import { NoOpPreparationStrategy } from "../infrastructure/strategies/NoOpPreparationStrategy";
import { BasicPreparationStrategy } from "../infrastructure/strategies/BasicPreparationStrategy";

describe("NoOpPreparationStrategy", () => {
  it("returns content unchanged", async () => {
    const strategy = new NoOpPreparationStrategy();
    const result = await strategy.prepare("  hello   world  \n\n");
    expect(result).toBe("  hello   world  \n\n");
  });

  it("has strategyId 'none'", () => {
    expect(new NoOpPreparationStrategy().strategyId).toBe("none");
  });
});

describe("BasicPreparationStrategy", () => {
  it("normalizes whitespace when enabled", async () => {
    const strategy = new BasicPreparationStrategy({
      normalizeWhitespace: true,
      normalizeEncoding: false,
      trimContent: false,
    });
    const result = await strategy.prepare("hello   world\n\n\nparagraph");
    expect(result).toBe("hello world\n\nparagraph");
  });

  it("trims content when enabled", async () => {
    const strategy = new BasicPreparationStrategy({
      normalizeWhitespace: false,
      normalizeEncoding: false,
      trimContent: true,
    });
    const result = await strategy.prepare("  hello  ");
    expect(result).toBe("hello");
  });

  it("applies all transforms together", async () => {
    const strategy = new BasicPreparationStrategy({
      normalizeWhitespace: true,
      normalizeEncoding: true,
      trimContent: true,
    });
    const result = await strategy.prepare("  hello   world  \n\n\n  foo  ");
    expect(result).toBe("hello world\n\nfoo");
  });

  it("does nothing when all options disabled", async () => {
    const strategy = new BasicPreparationStrategy({
      normalizeWhitespace: false,
      normalizeEncoding: false,
      trimContent: false,
    });
    const input = "  hello   world  ";
    expect(await strategy.prepare(input)).toBe(input);
  });

  it("has strategyId 'basic'", () => {
    expect(new BasicPreparationStrategy({
      normalizeWhitespace: true,
      normalizeEncoding: true,
      trimContent: true,
    }).strategyId).toBe("basic");
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

- [ ] **Step 3: Create PreparationStrategy port**

```typescript
// packages/core/src/contexts/semantic-processing/projection/domain/ports/PreparationStrategy.ts
export interface PreparationStrategy {
  readonly strategyId: string;
  readonly version: number;
  prepare(content: string): Promise<string>;
}
```

Consistent with `ChunkingStrategy` and `EmbeddingStrategy` which both have `readonly version: number`.

- [ ] **Step 4: Implement NoOpPreparationStrategy**

```typescript
// packages/core/src/contexts/semantic-processing/projection/infrastructure/strategies/NoOpPreparationStrategy.ts
import type { PreparationStrategy } from "../../domain/ports/PreparationStrategy";

export class NoOpPreparationStrategy implements PreparationStrategy {
  readonly strategyId = "none";

  async prepare(content: string): Promise<string> {
    return content;
  }
}
```

- [ ] **Step 5: Implement BasicPreparationStrategy**

```typescript
// packages/core/src/contexts/semantic-processing/projection/infrastructure/strategies/BasicPreparationStrategy.ts
import type { PreparationStrategy } from "../../domain/ports/PreparationStrategy";

interface BasicPreparationConfig {
  normalizeWhitespace: boolean;
  normalizeEncoding: boolean;
  trimContent: boolean;
}

export class BasicPreparationStrategy implements PreparationStrategy {
  readonly strategyId = "basic";

  constructor(private readonly _config: BasicPreparationConfig) {}

  async prepare(content: string): Promise<string> {
    let result = content;

    if (this._config.normalizeEncoding) {
      // Normalize Unicode to NFC form
      result = result.normalize("NFC");
      // Replace common problematic characters
      result = result.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    }

    if (this._config.normalizeWhitespace) {
      // Collapse multiple spaces/tabs to single space (within lines)
      result = result.replace(/[^\S\n]+/g, " ");
      // Collapse 3+ newlines to double newline (paragraph break)
      result = result.replace(/\n{3,}/g, "\n\n");
      // Trim trailing whitespace per line
      result = result.replace(/ +\n/g, "\n");
    }

    if (this._config.trimContent) {
      result = result.trim();
    }

    return result;
  }
}
```

- [ ] **Step 6: Run tests — expect PASS**

Run: `pnpm --filter @klay/core test -- --run src/contexts/semantic-processing/projection/__tests__/preparation-strategies.test.ts`

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/contexts/semantic-processing/projection/domain/ports/PreparationStrategy.ts
git add packages/core/src/contexts/semantic-processing/projection/infrastructure/strategies/NoOpPreparationStrategy.ts
git add packages/core/src/contexts/semantic-processing/projection/infrastructure/strategies/BasicPreparationStrategy.ts
git add packages/core/src/contexts/semantic-processing/projection/__tests__/preparation-strategies.test.ts
git commit -m "feat(core): add PreparationStrategy port with NoOp and Basic implementations"
```

---

### Task 8: Normalize Chunker Strategy IDs

**Files:**
- Modify: `packages/core/src/contexts/semantic-processing/projection/infrastructure/strategies/RecursiveChunker.ts`
- Modify: `packages/core/src/contexts/semantic-processing/projection/infrastructure/strategies/SentenceChunker.ts`
- Modify: `packages/core/src/contexts/semantic-processing/projection/infrastructure/strategies/FixedSizeChunker.ts`

- [ ] **Step 1: Read current chunker files**

Read all 3 chunker files to see exact `strategyId` values and constructor params.

- [ ] **Step 2: Update RecursiveChunker — strategyId + rename `maxChunkSize` to `chunkSize`**

In `RecursiveChunker.ts`:
1. Change `strategyId = "recursive-chunker"` to `strategyId = "recursive"`
2. Rename constructor param `maxChunkSize` to `chunkSize`
3. Update ALL internal references: the `recursiveSplit` method uses `this.maxChunkSize` in multiple places — rename all to `this.chunkSize`

```typescript
// RecursiveChunker.ts — key changes:
readonly strategyId = "recursive";  // was "recursive-chunker"

constructor(
    private readonly chunkSize: number = 1000,  // was maxChunkSize
    private readonly overlap: number = 100,
)

// In recursiveSplit(): replace every this.maxChunkSize with this.chunkSize
// In splitContent(): replace every this.maxChunkSize with this.chunkSize
```

Search for all occurrences of `maxChunkSize` in the file and replace with `chunkSize`.

- [ ] **Step 3: Update SentenceChunker — strategyId only**

In `SentenceChunker.ts`: change `strategyId = "sentence-chunker"` to `strategyId = "sentence"`.

- [ ] **Step 4: Update FixedSizeChunker — strategyId only**

In `FixedSizeChunker.ts`: change `strategyId = "fixed-size-chunker"` to `strategyId = "fixed-size"`.

- [ ] **Step 5: Run existing chunker tests**

Run: `pnpm --filter @klay/core test -- --run`
Check that chunking tests still pass. The factory uses string keys "recursive", "sentence", "fixed-size" which now match the class strategyId props.

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/contexts/semantic-processing/projection/infrastructure/strategies/
git commit -m "fix(core): normalize chunker strategyId props to match factory keys"
```

---

### Task 9: Update ProcessingProfileMaterializer

**Files:**
- Modify: `packages/core/src/contexts/semantic-processing/projection/composition/ProcessingProfileMaterializer.ts`

- [ ] **Step 1: Read current materializer**

Read: `packages/core/src/contexts/semantic-processing/projection/composition/ProcessingProfileMaterializer.ts`

- [ ] **Step 2: Update MaterializedStrategies interface**

Add `preparationStrategy` to the return type:

```typescript
export interface MaterializedStrategies {
  preparationStrategy: PreparationStrategy;
  embeddingStrategy: EmbeddingStrategy;
  chunkingStrategy: ChunkingStrategy;
}
```

- [ ] **Step 3: Update materialize() method**

Change signature to accept `ProcessingProfile` and resolve all 3 layers:

```typescript
async materialize(profile: ProcessingProfile): Promise<MaterializedStrategies> {
  const preparationStrategy = this.resolvePreparationStrategy(profile.preparation);
  const embeddingStrategy = await this.resolveEmbeddingStrategy(profile.projection);
  const chunkingStrategy = this.resolveChunkingStrategy(profile.fragmentation);
  return { preparationStrategy, embeddingStrategy, chunkingStrategy };
}
```

- [ ] **Step 4: Add resolvePreparationStrategy()**

```typescript
private resolvePreparationStrategy(layer: PreparationLayer): PreparationStrategy {
  if (layer.strategyId === "none") {
    return new NoOpPreparationStrategy();
  }
  return new BasicPreparationStrategy(layer.config as BasicPreparationConfig);
}
```

- [ ] **Step 5: Update resolveChunkingStrategy()**

Replace factory-based resolution with direct construction from config:

```typescript
private resolveChunkingStrategy(layer: FragmentationLayer): ChunkingStrategy {
  const config = layer.config;
  switch (config.strategy) {
    case "recursive":
      return new RecursiveChunker(config.chunkSize, config.overlap);
    case "sentence":
      return new SentenceChunker(config.maxChunkSize, config.minChunkSize);
    case "fixed-size":
      return new FixedSizeChunker(config.chunkSize, config.overlap);
    default:
      throw new Error(`Unknown fragmentation strategy: ${(config as any).strategy}`);
  }
}
```

- [ ] **Step 6: Update resolveEmbeddingStrategy()**

Change to use `ProjectionLayer` instead of flat strategyId:

```typescript
private async resolveEmbeddingStrategy(layer: ProjectionLayer): Promise<EmbeddingStrategy> {
  const strategyId = layer.strategyId;
  const config = layer.config;
  // Mapping from old to new:
  //   profile.embeddingStrategyId → layer.strategyId
  //   profile.configuration?.embeddingDimensions → layer.config.dimensions
  //   profile.configuration?.webLLMModelId → falls back to this._policy.webLLMModelId (existing fallback)
  //
  // Note: webLLMModelId is NOT in ProjectionConfig — the materializer already
  // falls back to this._policy.webLLMModelId which is set via the platform config.
  // This is intentional: model selection for WebLLM is a platform-level concern.
  //
  // Keep existing AI SDK provider/WebLLM/hash resolution logic,
  // replacing profile.embeddingStrategyId with strategyId
  // and profile.configuration references with config.dimensions
}
```

- [ ] **Step 7: Run tests**

Run: `pnpm --filter @klay/core test -- --run`

- [ ] **Step 8: Commit**

```bash
git add packages/core/src/contexts/semantic-processing/projection/composition/ProcessingProfileMaterializer.ts
git commit -m "feat(core): update materializer to resolve 3 layers from ProcessingProfile"
```

---

### Task 10: Update GenerateProjection Use Case

**Files:**
- Modify: `packages/core/src/contexts/semantic-processing/projection/application/GenerateProjection.ts`

- [ ] **Step 1: Read current GenerateProjection.ts**

- [ ] **Step 2: Add preparation step to execute()**

After materializing strategies, add:
```typescript
// Step 3: Prepare content
const prepared = await strategies.preparationStrategy.prepare(command.content);
```

Then pass `prepared` (not `command.content`) to the chunking step.

- [ ] **Step 3: Update determineErrorPhase() and ProjectionProcessingError**

1. Update `determineErrorPhase()` return type from `"chunking" | "embedding" | "storage"` to `"preparation" | "chunking" | "embedding" | "storage"`. Preparation errors occur before chunking, so they should be the first phase checked.
2. Update `ProjectionProcessingError` class (or its `phase` type) to accept `"preparation"` as a valid phase value — check where this type is defined (likely in the projection domain errors) and add the new variant.

- [ ] **Step 4: Update materializer call**

Change from passing `profile.chunkingStrategyId` and `profile.embeddingStrategyId` to passing the whole `profile`:

```typescript
const strategies = await this._materializer.materialize(profile);
```

- [ ] **Step 5: Add 3-phase pipeline integration test**

Add to the projection test file (or create if needed):

```typescript
describe("GenerateProjection with preparation", () => {
  it("preparation transforms content before chunking", async () => {
    // Create a profile with basic preparation (whitespace normalization)
    // Feed in content with excessive whitespace: "  hello   world  \n\n\n  foo  "
    // Verify the resulting chunks reflect normalized content ("hello world\n\nfoo")
    // This confirms the preparation step actually runs before chunking
  });
});
```

This validates the end-to-end flow: preparation → fragmentation → projection.

- [ ] **Step 6: Run tests**

Run: `pnpm --filter @klay/core test -- --run`

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/contexts/semantic-processing/projection/application/GenerateProjection.ts
git add packages/core/src/contexts/semantic-processing/projection/__tests__/
git commit -m "feat(core): add preparation step to GenerateProjection pipeline"
```

---

## Chunk 3: Service + REST API

### Task 11: Update Application DTOs

**Files:**
- Modify: `packages/core/src/application/knowledge-pipeline/contracts/dtos.ts`

- [ ] **Step 1: Read current dtos.ts**

- [ ] **Step 2: Update CreateProcessingProfileInput**

Replace:
```typescript
chunkingStrategyId: string;
embeddingStrategyId: string;
configuration?: Record<string, unknown>;
```
With:
```typescript
preparation: { strategyId: string; config: Record<string, unknown> };
fragmentation: { strategyId: string; config: Record<string, unknown> };
projection: { strategyId: string; config: Record<string, unknown> };
```

- [ ] **Step 3: Update UpdateProfileInput**

Same pattern but all optional:
```typescript
preparation?: { strategyId: string; config: Record<string, unknown> };
fragmentation?: { strategyId: string; config: Record<string, unknown> };
projection?: { strategyId: string; config: Record<string, unknown> };
```

- [ ] **Step 4: Update ListProfilesResult**

Replace flat strategy fields in the profile items with layer objects.

- [ ] **Step 5: Update CreateProcessingProfileSuccess**

If it echoes back strategy info, update to use layer format.

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/application/knowledge-pipeline/contracts/dtos.ts
git commit -m "refactor(core): update pipeline DTOs for 3-layer profile format"
```

---

### Task 12: Update SemanticProcessingService

**Files:**
- Modify: `packages/core/src/contexts/semantic-processing/service/SemanticProcessingService.ts`

- [ ] **Step 1: Read current service**

- [ ] **Step 2: Update createProcessingProfile()**

Change params from flat `chunkingStrategyId`/`embeddingStrategyId` to 3 layer objects. Construct VOs from inputs:

```typescript
const preparation = PreparationLayer.create(params.preparation.strategyId, params.preparation.config);
const fragmentation = FragmentationLayer.create(params.fragmentation.strategyId, params.fragmentation.config);
const projection = ProjectionLayer.create(params.projection.strategyId, params.projection.config);
```

Then pass them to `ProcessingProfile.create()`.

- [ ] **Step 3: Update updateProcessingProfile()**

For each optional layer, create VO if provided, otherwise use existing from loaded profile.

- [ ] **Step 4: Update listProcessingProfiles() return mapping**

Ensure the profiles returned include the 3 layers (they should automatically via the updated aggregate).

- [ ] **Step 5: Run tests**

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/contexts/semantic-processing/service/SemanticProcessingService.ts
git commit -m "feat(core): update SemanticProcessingService for 3-layer profiles"
```

---

### Task 13: Update KnowledgePipelineOrchestrator + Port + REST Adapter

**Files:**
- Modify: `packages/core/src/application/knowledge-pipeline/application/KnowledgePipelineOrchestrator.ts`
- Modify: `packages/core/src/application/knowledge-pipeline/contracts/KnowledgePipelinePort.ts`
- Modify: `packages/core/src/adapters/rest/KnowledgePipelineRESTAdapter.ts`

- [ ] **Step 1: Read all 3 files**

- [ ] **Step 2: Update KnowledgePipelinePort interface**

Update type signatures for `createProcessingProfile()`, `updateProfile()`, `listProfiles()` to use the new DTO types.

- [ ] **Step 3: Update KnowledgePipelineOrchestrator**

The orchestrator passes DTOs through to `SemanticProcessingService`. Update the mapping in `createProcessingProfile()`, `updateProfile()`, and `listProfiles()` methods.

- [ ] **Step 4: Update KnowledgePipelineRESTAdapter**

The adapter extracts fields from `req.body` and passes them to the orchestrator. Update to extract `preparation`, `fragmentation`, `projection` objects instead of flat fields.

- [ ] **Step 5: Run tests**

Run: `pnpm --filter @klay/core test -- --run`

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/application/knowledge-pipeline/
git add packages/core/src/adapters/rest/KnowledgePipelineRESTAdapter.ts
git commit -m "feat(core): update orchestrator + REST adapter for 3-layer profiles"
```

---

### Task 14: Update Composition Factory + Pipeline Singleton

**Files:**
- Modify: `packages/core/src/contexts/semantic-processing/composition/factory.ts`
- Modify: `apps/web/src/server/pipeline-singleton.ts`

- [ ] **Step 1: Update composition factory**

Read and update `resolveSemanticProcessingModules()` if it references strategy IDs directly. Wire the new preparation strategies into the projection factory.

- [ ] **Step 2: Update pipeline-singleton.ts**

Change the default profile creation from:
```typescript
await platform.pipeline.createProcessingProfile({
  id: "default",
  name: "Default",
  chunkingStrategyId: "recursive",
  embeddingStrategyId: "hash-embedding",
});
```
To:
```typescript
await platform.pipeline.createProcessingProfile({
  id: "default",
  name: "Default",
  preparation: { strategyId: "basic", config: {} },
  fragmentation: { strategyId: "recursive", config: { strategy: "recursive" } },
  projection: { strategyId: "hash-embedding", config: {} },
});
```

- [ ] **Step 3: Fix remaining e2e tests**

Update all `createProcessingProfile()` calls in test files to use the new format.

- [ ] **Step 4: Run full test suite — expect ALL PASS**

Run: `pnpm --filter @klay/core test -- --run`
Expected: All 169+ tests PASS. This is the Phase 1-3 checkpoint.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/contexts/semantic-processing/composition/factory.ts
git add apps/web/src/server/pipeline-singleton.ts
git add packages/core/src/contexts/semantic-processing/__tests__/
git commit -m "feat(core): wire 3-layer profiles through composition + pipeline singleton"
```

---

## Chunk 4: UI

### Task 15: Restructure processingStrategies.ts

**Files:**
- Modify: `apps/web/src/constants/processingStrategies.ts`

- [ ] **Step 1: Read current file**

Read: `apps/web/src/constants/processingStrategies.ts`

- [ ] **Step 2: Add preparation strategies constant**

```typescript
export const PREPARATION_STRATEGIES = [
  {
    value: "none",
    label: "Ninguna — sin preprocesamiento",
    defaultConfig: {},
  },
  {
    value: "basic",
    label: "Básica — normalización de texto",
    defaultConfig: {
      normalizeWhitespace: true,
      normalizeEncoding: true,
      trimContent: true,
    },
  },
] as const;
```

- [ ] **Step 3: Update fragmentation strategies with defaultConfig**

Replace `CHUNKING_STRATEGIES` with `FRAGMENTATION_STRATEGIES`:

```typescript
export const FRAGMENTATION_STRATEGIES = [
  {
    value: "recursive",
    label: "Recursive — párrafos, luego oraciones",
    defaultConfig: { strategy: "recursive" as const, chunkSize: 1000, overlap: 100 },
  },
  {
    value: "sentence",
    label: "Sentence — límites de oración",
    defaultConfig: { strategy: "sentence" as const, maxChunkSize: 1000, minChunkSize: 100 },
  },
  {
    value: "fixed-size",
    label: "Fixed Size — tamaño fijo de caracteres",
    defaultConfig: { strategy: "fixed-size" as const, chunkSize: 500, overlap: 50 },
  },
] as const;
```

- [ ] **Step 4: Update embedding strategy options to include defaultConfig**

Update `getEmbeddingStrategyOptions()` to include `defaultConfig: { dimensions, batchSize: 100 }` for each model option.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/constants/processingStrategies.ts
git commit -m "feat(web): restructure processing strategy constants by layer"
```

---

### Task 16: Update PipelineService Interface + Server Implementation

**Files:**
- Modify: `apps/web/src/services/pipeline-service.ts`
- Modify: `apps/web/src/services/server-pipeline-service.ts`

- [ ] **Step 1: Read both files**

- [ ] **Step 2: Update PipelineService interface types**

Change `CreateProcessingProfileInput` and `UpdateProfileInput` types to use 3-layer format:

```typescript
interface CreateProcessingProfileInput {
  name: string;
  preparation: { strategyId: string; config: Record<string, unknown> };
  fragmentation: { strategyId: string; config: Record<string, unknown> };
  projection: { strategyId: string; config: Record<string, unknown> };
}
```

- [ ] **Step 3: Update ServerPipelineService**

Update the fetch body serialization to pass the 3 layers instead of flat fields.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/services/pipeline-service.ts apps/web/src/services/server-pipeline-service.ts
git commit -m "feat(web): update pipeline service types for 3-layer profiles"
```

---

### Task 17: Redesign CreateProfileForm

**Files:**
- Modify: `apps/web/src/components/features/profiles/CreateProfileForm.tsx`

- [ ] **Step 1: Read current CreateProfileForm**

Read: `apps/web/src/components/features/profiles/CreateProfileForm.tsx`

- [ ] **Step 2: Add form state for 3 layers**

Replace flat `chunkingStrategy`/`embeddingStrategy` state with:

```typescript
const [preparationStrategy, setPreparationStrategy] = useState("basic");
const [preparationConfig, setPreparationConfig] = useState(PREPARATION_STRATEGIES[1].defaultConfig);

const [fragmentationStrategy, setFragmentationStrategy] = useState("recursive");
const [fragmentationConfig, setFragmentationConfig] = useState(FRAGMENTATION_STRATEGIES[0].defaultConfig);

const [projectionStrategy, setProjectionStrategy] = useState(/* current embedding default */);
const [projectionConfig, setProjectionConfig] = useState({ dimensions: 128, batchSize: 100 });
```

- [ ] **Step 3: Build 3-section form layout**

Structure the form into 3 collapsible sections:

1. **Preparation section**: Strategy dropdown + config checkboxes (shown when strategy="basic")
2. **Fragmentation section**: Strategy dropdown + dynamic config fields (chunkSize/overlap for recursive/fixed-size, maxChunkSize/minChunkSize for sentence)
3. **Projection section**: Strategy dropdown (existing runtime-aware) + dimensions + batchSize + API key warnings

- [ ] **Step 4: Update submit handler**

Change from:
```typescript
service.createProcessingProfile({ name, chunkingStrategyId, embeddingStrategyId })
```
To:
```typescript
service.createProcessingProfile({
  name,
  preparation: { strategyId: preparationStrategy, config: preparationConfig },
  fragmentation: { strategyId: fragmentationStrategy, config: fragmentationConfig },
  projection: { strategyId: projectionStrategy, config: projectionConfig },
})
```

- [ ] **Step 5: Handle dynamic config updates on strategy change**

When user changes fragmentation strategy, reset config to that strategy's defaults:
```typescript
const handleFragmentationStrategyChange = (value: string) => {
  setFragmentationStrategy(value);
  const selected = FRAGMENTATION_STRATEGIES.find(s => s.value === value);
  if (selected) setFragmentationConfig({ ...selected.defaultConfig });
};
```

- [ ] **Step 6: Build and verify**

Run: `pnpm --filter @klay/web build`
Expected: Build succeeds without type errors.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/components/features/profiles/CreateProfileForm.tsx
git commit -m "feat(web): redesign CreateProfileForm with 3-layer sections"
```

---

### Task 18: Redesign ProfileEditForm

**Files:**
- Modify: `apps/web/src/components/features/profiles/ProfileEditForm.tsx`

- [ ] **Step 1: Read current ProfileEditForm**

- [ ] **Step 2: Mirror CreateProfileForm structure**

Same 3-section layout but pre-filled with existing profile values:
```typescript
const [preparationStrategy, setPreparationStrategy] = useState(profile.preparation.strategyId);
const [preparationConfig, setPreparationConfig] = useState(profile.preparation.config);
// ... same for fragmentation and projection
```

- [ ] **Step 3: Update submit handler**

Send only changed layers to `service.updateProfile()`.

- [ ] **Step 4: Build and verify**

Run: `pnpm --filter @klay/web build`

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/features/profiles/ProfileEditForm.tsx
git commit -m "feat(web): redesign ProfileEditForm with 3-layer sections"
```

---

### Task 19: Update ProfileList

**Files:**
- Modify: `apps/web/src/components/features/profiles/ProfileList.tsx`

- [ ] **Step 1: Read current ProfileList**

- [ ] **Step 2: Update columns**

Replace `chunkingStrategyId` and `embeddingStrategyId` columns with `preparation`, `fragmentation`, and `projection` columns showing strategy badges:

```tsx
<td><Badge>{profile.preparation.strategyId}</Badge></td>
<td><Badge>{profile.fragmentation.strategyId}</Badge></td>
<td><Badge>{profile.projection.strategyId}</Badge></td>
```

- [ ] **Step 3: Build and verify**

Run: `pnpm --filter @klay/web build`

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/features/profiles/ProfileList.tsx
git commit -m "feat(web): update ProfileList columns for 3-layer profiles"
```

---

## Final Verification

### Task 20: Full Build + Test Verification

- [ ] **Step 1: Run full core test suite**

Run: `pnpm --filter @klay/core test -- --run`
Expected: ALL tests PASS

- [ ] **Step 2: Run web build**

Run: `pnpm --filter @klay/web build`
Expected: Build succeeds

- [ ] **Step 3: Run dev server and manually verify**

Run: `pnpm --filter @klay/web dev`
Verify:
- Profiles page loads
- Create profile form shows 3 sections
- Can create a profile with custom config per layer
- Profile list shows 3 strategy columns
- Edit form pre-fills correctly
- Default profile still works for document processing

- [ ] **Step 4: Final commit (if any remaining uncommitted changes)**

Stage only changed files by name — do not use `git add -A`. Verify with `git status` first.
