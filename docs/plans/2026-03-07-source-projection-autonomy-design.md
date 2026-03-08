# Source Projection Autonomy — Design

**Date:** 2026-03-07
**Status:** Approved

## Problem

Sources currently cannot generate projections independently. The full `KnowledgePipelineOrchestrator.execute()` pipeline is the only path, which is coarse-grained (ingestion + extraction + processing in one call). There's no way to trigger projection generation for an already-ingested source.

## Decision

Add `generateProjection` to the existing `KnowledgeLifecyclePort` and `KnowledgeLifecycleOrchestrator`, extending its dependencies with `SourceIngestionService` and `SourceKnowledgeService`. This follows existing patterns exactly and reuses the full adapter chain (REST, UI, web services) without creating new boilerplate.

### Why the lifecycle port (not a separate orchestrator)?

During implementation planning, we found that a dedicated `SourceProjectionOrchestrator` would require a completely new adapter chain (REST adapter, UI adapter, web service wiring). Since `generateProjection` is a lifecycle operation on an existing source, it fits naturally in the lifecycle port. The orchestrator just needs two extra deps (`ingestion`, `sourceKnowledge`).

Future methods (regenerate, list, delete projections) can be added to the lifecycle port following the same pattern. If the lifecycle port grows too large, a dedicated orchestrator can be extracted later.

## Architecture

### KnowledgeLifecycleOrchestrator (extended)

**Dependencies (constructor-injected) — 2 new:**
- `ContextManagementService` — existing
- `SemanticProcessingService` — existing
- `SourceIngestionService` — **new** (get extracted text)
- `SourceKnowledgeService` — **new** (register projection)

**New method:**
```typescript
generateProjection(input: {
  sourceId: string;
  processingProfileId: string;
  projectionId?: string;
}): Promise<Result<KnowledgeLifecycleError, {
  projectionId: string;
  chunksCount: number;
  dimensions: number;
  model: string;
}>>
```

**Internal flow:**
1. `SourceIngestionService.getExtractedText(sourceId)` → extracted text
2. `SemanticProcessingService.processContent(...)` → projection result
3. `SourceKnowledgeService.registerProjection(...)` → registered

### Required additions to existing services

**ExtractionUseCases** — new query method:
```typescript
getLatestCompletedBySourceId(sourceId: string): Promise<ExtractionJob | null>
```

**SourceIngestionService** — new read method:
```typescript
getExtractedText(sourceId: string): Promise<Result<DomainError, { text: string }>>
```

### Factory wiring

`knowledge-platform.factory.ts` passes `ingestion` and `sourceKnowledge` to the lifecycle orchestrator constructor (both already available from `deps`).

## API Layer

**New endpoint:** `POST /api/lifecycle/generate-projection`
```json
// Request
{ "sourceId": "...", "processingProfileId": "..." }

// Response
{ "projectionId": "...", "chunksCount": 42, "dimensions": 384, "model": "..." }
```

**LifecycleService interface** — add:
```typescript
generateProjection(input: GenerateProjectionInput): Promise<GenerateProjectionOutput>
```

Both `ServerLifecycleService` (fetch) and `BrowserLifecycleService` (direct call) implement this.

## UI

**New component:** `GenerateProjectionAction.tsx`
- Button per source card in ContextSourcesPage
- On click: shows inline form with processing profile dropdown (`listProcessingProfiles()`)
- States: idle → profile selection → loading → success/error
- Follows existing pattern of `ReprocessAction` / `RemoveSourceAction`

**Integration:** Added to each source card's action buttons in `ContextSourcesPage.tsx`.

## Future expansion

The lifecycle port can grow with these methods as needed:
- `regenerateProjection(sourceId, projectionId, profileId?)` — re-run for existing projection
- `listProjectionsForSource(sourceId)` — query projection status per source
- `deleteProjection(sourceId, projectionId)` — remove vectors

If lifecycle port grows too large, extract a dedicated `SourceProjectionOrchestrator` at that point.

## Files affected

| Layer | File | Change |
|-------|------|--------|
| core | `ExtractionUseCases` (extraction/application/index.ts) | Add `getLatestCompletedBySourceId()` query |
| core | `SourceIngestionService.ts` | Add `getExtractedText()` |
| core | `KnowledgeLifecyclePort.ts` + `dtos.ts` | Add `generateProjection` method + DTOs |
| core | `LifecycleStep.ts` | Add `GenerateProjection` step |
| core | `KnowledgeLifecycleOrchestrator.ts` | Extend deps + implement method |
| core | `knowledge-platform.factory.ts` | Pass `ingestion` + `sourceKnowledge` to lifecycle |
| core | `KnowledgeLifecycleRESTAdapter.ts` | Add adapter method |
| core | `KnowledgeLifecycleUIAdapter.ts` | Add adapter method |
| core | `knowledge-lifecycle/index.ts` | Export new DTOs |
| web | **NEW** `pages/api/lifecycle/generate-projection.ts` | POST endpoint |
| web | `lifecycle-service.ts` | Add method to interface + types |
| web | `server-lifecycle-service.ts` | Server implementation |
| web | `browser-lifecycle-service.ts` | Browser implementation |
| web | **NEW** `GenerateProjectionAction.tsx` | UI component |
| web | `ContextSourcesPage.tsx` | Integrate action in source cards |
