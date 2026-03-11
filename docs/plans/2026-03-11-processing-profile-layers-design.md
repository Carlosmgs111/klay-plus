# Processing Profile Layers — Design Document

**Date**: 2026-03-11
**Status**: Approved
**Scope**: `@klay/core` (semantic-processing context) + `@klay/web` (profile UI)

## Goal

Redesign ProcessingProfile from two flat strategy IDs to a **3-layer pipeline model** with typed configuration per layer, making the processing pipeline modular, configurable, and extensible.

## Current State

ProcessingProfile stores:
- `chunkingStrategyId: string` — one of "recursive", "sentence", "fixed-size"
- `embeddingStrategyId: string` — one of "hash-embedding", "openai-{model}", "cohere-{model}", "huggingface-{model}", "web-llm-embedding"
- `configuration: Record<string, unknown>` — generic bag, **not exposed in UI**

The UI only allows choosing strategy type — no parameters (chunk size, overlap, dimensions, etc.).

### Strategy ID Reconciliation

The codebase has an existing ID mismatch: ChunkerFactory registers strategies as `"recursive"`, `"sentence"`, `"fixed-size"`, but the chunker class instances expose `strategyId` properties like `"recursive-chunker"`, `"sentence-chunker"`, `"fixed-size-chunker"`. The **factory registration keys** are the canonical IDs used in ProcessingProfile and throughout the system. As part of this redesign, we will normalize the chunker class `strategyId` properties to match the factory keys (`"recursive"`, `"sentence"`, `"fixed-size"`) to eliminate this inconsistency.

## Design: Layer Config Objects

### Architecture

Replace flat strategy fields with **3 Value Objects**, each representing a pipeline layer:

```
ProcessingProfile {
  id: ProcessingProfileId
  name: string
  version: number
  status: ProfileStatus
  preparation: PreparationLayer      // NEW — text normalization
  fragmentation: FragmentationLayer  // replaces chunkingStrategyId
  projection: ProjectionLayer        // replaces embeddingStrategyId
  createdAt: Date
}
```

The `configuration` field is removed — each layer carries its own typed config.

### Value Objects

#### PreparationLayer

```typescript
type PreparationStrategyId = "none" | "basic"

// Config is strategy-dependent:
// "none" → config is ignored (empty object accepted)
// "basic" → uses BasicPreparationConfig
type BasicPreparationConfig = {
  normalizeWhitespace: boolean  // default: true
  normalizeEncoding: boolean    // default: true
  trimContent: boolean          // default: true
}

type PreparationConfig = BasicPreparationConfig | Record<string, never>
```

When `strategyId = "none"`, the NoOpPreparationStrategy ignores the config entirely (pass-through). When `strategyId = "basic"`, the BasicPreparationStrategy reads config fields with defaults if missing.

Extensibility: future strategies (content-aware, NLP prep) register new strategy IDs and config shapes.

#### FragmentationLayer

```typescript
type FragmentationStrategyId = "recursive" | "sentence" | "fixed-size"

// Discriminated union per strategy for compile-time safety:
type FragmentationConfig =
  | { strategy: "recursive"; chunkSize: number; overlap: number }
  | { strategy: "sentence"; maxChunkSize: number; minChunkSize: number }
  | { strategy: "fixed-size"; chunkSize: number; overlap: number }
```

Defaults aligned with existing chunker constructors:
- **recursive**: `chunkSize: 1000`, `overlap: 100` (matches RecursiveChunker defaults — note: RecursiveChunker currently names this param `maxChunkSize`; we rename it to `chunkSize` for consistency with FixedSizeChunker and the config model)
- **sentence**: `maxChunkSize: 1000`, `minChunkSize: 100` (matches SentenceChunker defaults — note: `minChunkSize` is the size threshold for accumulating sentences, not individual sentence length. Validation tightened from `>= 0` to `> 0` since zero defeats sentence accumulation)
- **fixed-size**: `chunkSize: 500`, `overlap: 50` (matches FixedSizeChunker defaults)

Validation invariants:
- `chunkSize > 0` / `maxChunkSize > 0`
- `overlap >= 0 && overlap < chunkSize` (recursive, fixed-size only)
- `minChunkSize > 0 && minChunkSize < maxChunkSize` (sentence only)

#### ProjectionLayer

```typescript
type ProjectionConfig = {
  dimensions: number    // default varies by model
  batchSize: number     // default: 100, must be > 0
}
```

`strategyId` remains a free string (provider-model pattern: "openai-text-embedding-3-small", "hash-embedding", etc.) since embedding models are dynamic and registered by the platform config.

### Domain Events

No new events. Existing events (ProfileCreated, ProfileUpdated, ProfileDeprecated) update their payload to include the 3 layers instead of flat strategy IDs.

### Migration Strategy

**On-read migration via `fromDTO`** — no database migration needed.

```typescript
// In ProfileDTO → ProcessingProfile reconstitution:
if ('chunkingStrategyId' in dto) {
  // Legacy format → convert to layers with defaults matching existing chunker constructors
  const strategyId = dto.chunkingStrategyId
  const fragmentationConfig =
    strategyId === "sentence"
      ? { strategy: "sentence", maxChunkSize: 1000, minChunkSize: 100 }
      : strategyId === "fixed-size"
        ? { strategy: "fixed-size", chunkSize: 500, overlap: 50 }
        : { strategy: "recursive", chunkSize: 1000, overlap: 100 }  // default

  return reconstitute({
    ...dto,
    preparation: {
      strategyId: "basic",
      config: { normalizeWhitespace: true, normalizeEncoding: true, trimContent: true }
    },
    fragmentation: {
      strategyId,
      config: fragmentationConfig
    },
    projection: {
      strategyId: dto.embeddingStrategyId,
      config: { dimensions: 128, batchSize: 100 }
    },
  })
}
```

This is a format migration, not a semantic change — existing `SemanticProjection` records and their `processingProfileVersion` references remain valid.

Legacy profiles get sensible defaults. On next save, they persist in the new format.

### ProcessingProfileMaterializer (updated)

```typescript
// New signature:
materialize(profile: ProcessingProfile): Promise<{
  preparationStrategy: PreparationStrategy
  chunkingStrategy: ChunkingStrategy
  embeddingStrategy: EmbeddingStrategy
}>
```

Resolves each layer's strategyId + config into a concrete strategy instance.

### New Port: PreparationStrategy

```typescript
interface PreparationStrategy {
  readonly strategyId: string
  prepare(content: string): Promise<string>  // async for future extensibility (NLP, API-based)
}
```

MVP implementations are effectively synchronous but return `Promise<string>` to avoid a breaking port change when future strategies need async (NLP-based, API-based):
- `NoOpPreparationStrategy` — returns content unchanged
- `BasicPreparationStrategy` — normalizes whitespace, encoding, trims per config

### ChunkingStrategy Port (updated)

The current chunkers use a **constructor-injection** pattern via `BaseChunker` (Template Method), where config is passed at construction time. We preserve this pattern — the port signature stays `chunk(content: string): Chunk[]` unchanged.

The config flows through the **materializer**: instead of `ChunkerFactory.create(strategyId)` (which uses no-arg factories with hardcoded defaults), the materializer now constructs chunkers directly with the config from `FragmentationLayer`:

```typescript
// In ProcessingProfileMaterializer:
function resolveChunker(layer: FragmentationLayer): ChunkingStrategy {
  const config = layer.config
  switch (config.strategy) {
    case "recursive":
      return new RecursiveChunker(config.chunkSize, config.overlap)
    case "sentence":
      return new SentenceChunker(config.maxChunkSize, config.minChunkSize)
    case "fixed-size":
      return new FixedSizeChunker(config.chunkSize, config.overlap)
  }
}
```

This means:
- `ChunkingStrategy` port: **no signature change**
- `BaseChunker` / concrete chunkers: **no change** (they already accept constructor params)
- `ChunkerFactory`: still available for tests/convenience but the materializer bypasses it for profile-driven construction
- Config flows: `FragmentationLayer.config` → materializer → chunker constructor

### EmbeddingStrategy Port (unchanged)

No changes. Dimensions and batch size are used by the materializer when constructing the instance (existing pattern).

### Pipeline Execution Flow

```
GenerateProjection.execute(sourceId, content, profileId):
  1. Load ProcessingProfile (must be ACTIVE)
  2. Materialize → { preparationStrategy, chunkingStrategy, embeddingStrategy }
  3. prepared = await preparationStrategy.prepare(content)     // NEW (async)
  4. chunks = chunkingStrategy.chunk(prepared)                 // config already in constructor
  5. vectors = embeddingStrategy.embedBatch(chunks)
  6. vectorStore.upsert(vectors)
  7. Emit ProjectionGenerated
```

Error phase detection (`determineErrorPhase`) is updated to include `"preparation"` as a possible phase, covering errors in step 3.

### Service Layer

```typescript
// Updated signatures:
createProcessingProfile({
  id?: string
  name: string
  preparation: { strategyId: string; config: PreparationConfig }
  fragmentation: { strategyId: string; config: FragmentationConfig }
  projection: { strategyId: string; config: ProjectionConfig }
}): Promise<Result<DomainError, CreateProfileSuccess>>

updateProcessingProfile({
  id: string
  name?: string
  preparation?: { strategyId: string; config: PreparationConfig }
  fragmentation?: { strategyId: string; config: FragmentationConfig }
  projection?: { strategyId: string; config: ProjectionConfig }
}): Promise<Result<DomainError, UpdateProfileSuccess>>
```

Validation: service checks that each strategyId is registered before delegating to domain.

### REST API

Endpoints unchanged (`POST/GET/PUT /api/pipeline/profiles`, `POST .../deprecate`). Payload updated to include 3 layers (see service signatures above).

### ProfileDTO (updated)

```typescript
type ProfileDTO = {
  id: string
  name: string
  version: number
  status: ProfileStatus
  preparation: { strategyId: string; config: Record<string, unknown> }
  fragmentation: { strategyId: string; config: Record<string, unknown> }
  projection: { strategyId: string; config: Record<string, unknown> }
  createdAt: string
}
```

**Type narrowing boundary**: The DTO uses `Record<string, unknown>` for serialization flexibility. Type narrowing from DTO → typed config happens inside each Value Object's factory method (e.g., `FragmentationLayer.fromDTO(dto)`) which validates fields and applies defaults for missing values. This is the single validation boundary — the Value Object constructors are the source of truth.

### Application Layer DTOs (updated)

The `KnowledgePipelineOrchestrator` and its contracts must also be updated:

```typescript
// In contracts/dtos.ts:
type CreateProcessingProfileInput = {
  id?: string
  name: string
  preparation: { strategyId: string; config: Record<string, unknown> }
  fragmentation: { strategyId: string; config: Record<string, unknown> }
  projection: { strategyId: string; config: Record<string, unknown> }
}

type UpdateProfileInput = {
  id: string
  name?: string
  preparation?: { strategyId: string; config: Record<string, unknown> }
  fragmentation?: { strategyId: string; config: Record<string, unknown> }
  projection?: { strategyId: string; config: Record<string, unknown> }
}

type ListProfilesResult = {
  profiles: Array<{
    id: string; name: string; version: number; status: string
    preparation: { strategyId: string; config: Record<string, unknown> }
    fragmentation: { strategyId: string; config: Record<string, unknown> }
    projection: { strategyId: string; config: Record<string, unknown> }
    createdAt: string
  }>
}
```

The `KnowledgePipelineOrchestrator` passes these DTOs through to `SemanticProcessingService` — it is a thin coordinator and the update is mechanical.

### UI Changes

#### CreateProfileForm — 3-section layout

```
┌─ Nombre del Perfil ──────────────────────────┐
│ [input]                                       │
├─ 1. Preparación ─────────────────────────────┤
│ Estrategia: [dropdown: None | Basic]          │
│  ☑ Normalizar whitespace                      │
│  ☑ Normalizar encoding                        │
│  ☑ Trim contenido                             │
├─ 2. Fragmentación ───────────────────────────┤
│ Estrategia: [dropdown]                        │
│  Chunk size: [input: 500]                     │
│  Overlap:    [input: 50]                      │
│  (strategy-specific params shown dynamically) │
├─ 3. Proyección ──────────────────────────────┤
│ Estrategia: [dropdown: runtime-aware]         │
│  Dimensiones: [input: auto]                   │
│  Batch size:  [input: 100]                    │
│  ⚠ API key warning (if applicable)            │
└──────────────────────────────────────────────┘
```

Dynamic behavior:
- Changing fragmentation strategy shows/hides strategy-specific params
- Changing projection strategy updates dimension defaults per model
- API key warnings reused from existing implementation

#### processingStrategies.ts — restructured by layer

```typescript
PREPARATION_STRATEGIES = [
  { value: "none", label: "Ninguna", defaultConfig: {} },
  { value: "basic", label: "Básica", defaultConfig: { normalizeWhitespace: true, normalizeEncoding: true, trimContent: true } },
]

FRAGMENTATION_STRATEGIES = [
  { value: "recursive", label: "Recursive", defaultConfig: { strategy: "recursive", chunkSize: 1000, overlap: 100 } },
  { value: "sentence", label: "Sentence", defaultConfig: { strategy: "sentence", maxChunkSize: 1000, minChunkSize: 100 } },
  { value: "fixed-size", label: "Fixed Size", defaultConfig: { strategy: "fixed-size", chunkSize: 500, overlap: 50 } },
]
// Embedding strategies remain dynamic via getEmbeddingStrategyOptions() with defaultConfig added
```

#### ProfileList — columns updated

Replace `chunkingStrategyId | embeddingStrategyId` with `preparation | fragmentation | projection` columns showing strategy badges.

#### ProfileEditForm — same structure as Create, pre-filled with existing values.

## Testing Strategy

### Domain tests (Value Objects)
- PreparationLayer: known strategyId validation, config immutability, defaults
- FragmentationLayer: chunkSize > 0, overlap < chunkSize, strategy-specific params
- ProjectionLayer: dimensions > 0, batchSize > 0
- ProcessingProfile: create/update/deprecate with 3 layers, legacy DTO migration

### Strategy tests
- BasicPreparationStrategy: whitespace normalization, encoding, trim
- NoOpPreparationStrategy: pass-through
- Existing chunkers: updated to receive explicit config

### Integration tests
- GenerateProjection: full 3-phase pipeline (preparation → fragmentation → projection)
- DTO migration: legacy format converts correctly on read

## Rollout Plan

### Phase 1 — Domain model + migration
- Create 3 Value Objects (PreparationLayer, FragmentationLayer, ProjectionLayer)
- Update ProcessingProfile aggregate (remove old fields, add layers)
- Update ProfileDTO + fromDTO with legacy migration
- Update all repository implementations (InMemory, NeDB, IndexedDB)
- Domain tests
- **Deliverable:** core compiles and tests pass

### Phase 2 — PreparationStrategy + Pipeline
- Create PreparationStrategy async port
- Implement NoOpPreparationStrategy, BasicPreparationStrategy
- Update ProcessingProfileMaterializer to materialize 3 layers (construct chunkers with config from FragmentationLayer)
- Update GenerateProjection to include preparation step + "preparation" error phase
- Normalize chunker class strategyId props to match factory keys
- Pipeline tests
- **Deliverable:** full pipeline works with 3 layers

### Phase 3 — Service + REST API
- Update application DTOs (CreateProcessingProfileInput, UpdateProfileInput, ListProfilesResult)
- Update KnowledgePipelinePort interface
- Update KnowledgePipelineOrchestrator
- Update SemanticProcessingService (create/update/deprecate)
- Update KnowledgePipelineRESTAdapter
- Update pipeline-singleton (default profile)
- Update PipelineService interface + ServerPipelineService
- **Deliverable:** API functional end-to-end with new format

### Phase 4 — UI
- Restructure processingStrategies.ts by layer
- Redesign CreateProfileForm with layer sections
- Redesign ProfileEditForm
- Update ProfileList columns
- **Deliverable:** complete functional experience

## Files Affected

### Core (packages/core)
| File | Change |
|------|--------|
| `semantic-processing/processing-profile/domain/ProcessingProfile.ts` | Replace flat fields with 3 layer VOs |
| `semantic-processing/processing-profile/domain/ProcessingProfileRepository.ts` | No change (generic interface) |
| `semantic-processing/processing-profile/domain/ProfileErrors.ts` | Add layer validation errors |
| `semantic-processing/processing-profile/domain/value-objects/*.ts` | NEW — PreparationLayer, FragmentationLayer, ProjectionLayer |
| `semantic-processing/processing-profile/infrastructure/persistence/**` | Update DTO mapping + fromDTO legacy migration |
| `semantic-processing/projection/domain/ports/ChunkingStrategy.ts` | No signature change (config via constructor) |
| `semantic-processing/projection/domain/ports/PreparationStrategy.ts` | NEW — async port |
| `semantic-processing/projection/domain/ports/EmbeddingStrategy.ts` | No change |
| `semantic-processing/projection/infrastructure/strategies/*Chunker.ts` | Normalize strategyId props to match factory keys |
| `semantic-processing/projection/infrastructure/strategies/BaseChunker.ts` | No change (constructor-injection preserved) |
| `semantic-processing/projection/infrastructure/strategies/ChunkerFactory.ts` | No change (still used for tests, materializer bypasses for profiles) |
| `semantic-processing/projection/infrastructure/strategies/index.ts` | No change (factory registrations) |
| `semantic-processing/projection/infrastructure/strategies/NoOpPreparationStrategy.ts` | NEW |
| `semantic-processing/projection/infrastructure/strategies/BasicPreparationStrategy.ts` | NEW |
| `semantic-processing/projection/composition/ProcessingProfileMaterializer.ts` | Materialize 3 layers, construct chunkers with config |
| `semantic-processing/projection/application/GenerateProjection.ts` | Add preparation step + "preparation" error phase |
| `semantic-processing/service/SemanticProcessingService.ts` | Update CRUD signatures |
| `semantic-processing/composition/factory.ts` | Wire new strategies |
| `application/knowledge-pipeline/contracts/dtos.ts` | Update CreateProcessingProfileInput, UpdateProfileInput, ListProfilesResult |
| `application/knowledge-pipeline/KnowledgePipelineOrchestrator.ts` | Pass 3-layer DTOs to service |
| `application/knowledge-pipeline/contracts/KnowledgePipelinePort.ts` | Update port interface types |
| `adapters/rest/KnowledgePipelineRESTAdapter.ts` | Update payload handling |

### Web (apps/web)
| File | Change |
|------|--------|
| `src/constants/processingStrategies.ts` | Restructure by layer |
| `src/components/features/profiles/CreateProfileForm.tsx` | 3-section layout |
| `src/components/features/profiles/ProfileEditForm.tsx` | 3-section layout |
| `src/components/features/profiles/ProfileList.tsx` | Update columns |
| `src/services/pipeline-service.ts` | Update interface types |
| `src/services/server-pipeline-service.ts` | Update payload mapping |
| `src/server/pipeline-singleton.ts` | Update default profile |

## Decisions

1. **Layer Config Objects over Strategy Registry** — better type safety, aligns with existing DDD patterns
2. **On-read migration over DB migration** — simpler, follows existing SemanticUnit precedent
3. **3 fixed layers over composable pipeline** — predictable UX, avoids over-engineering
4. **MVP preparation (none/basic) over full NLP** — extensible architecture, minimal initial scope
5. **Config in Value Objects over generic Record** — type safety, per-strategy validation
6. **Discriminated union for FragmentationConfig** — prevents invalid config combinations (e.g., overlap on sentence strategy)
7. **Async PreparationStrategy.prepare()** — avoid breaking port change when future strategies need async
8. **Config via constructor (not chunk() param)** — preserves BaseChunker Template Method pattern, materializer constructs chunkers with config
9. **Factory keys as canonical strategy IDs** — normalize chunker class strategyId props to match ("recursive" not "recursive-chunker")
