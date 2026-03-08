# Source Projection Autonomy — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable per-source projection generation through the lifecycle port, with a UI action on each source card.

**Architecture:** Add `generateProjection` to `KnowledgeLifecyclePort` and its orchestrator (extend deps with `ingestion` + `sourceKnowledge`). Add `getExtractedText` to `SourceIngestionService` via a new query on `ExtractionUseCases`. This follows existing patterns exactly and avoids a separate adapter chain.

**Tech Stack:** TypeScript, DDD bounded contexts, Astro API routes, React components

---

### Task 1: Add query to ExtractionUseCases

**Files:**
- Modify: `packages/core/src/contexts/source-ingestion/extraction/application/index.ts`

**Step 1: Add `getLatestCompletedBySourceId` method to ExtractionUseCases**

```typescript
// In ExtractionUseCases class, after getSupportedMimeTypes():
async getLatestCompletedBySourceId(sourceId: string): Promise<ExtractionJob | null> {
  const jobs = await this.executeExtraction['_repository'].findBySourceId(sourceId);
  const completed = jobs
    .filter(j => j.status === ExtractionStatus.Completed)
    .sort((a, b) => b.completedAt!.getTime() - a.completedAt!.getTime());
  return completed[0] ?? null;
}
```

NOTE: `ExecuteExtraction` exposes the repository as a private field. Instead, add the repository as a direct field on ExtractionUseCases:

```typescript
export class ExtractionUseCases {
  readonly executeExtraction: ExecuteExtraction;
  private readonly _repository: ExtractionJobRepository;

  constructor(
    repository: ExtractionJobRepository,
    extractors: ExtractorMap,
    eventPublisher: EventPublisher,
  ) {
    this._repository = repository;
    this.executeExtraction = new ExecuteExtraction(repository, extractors, eventPublisher);
  }

  getSupportedMimeTypes(): string[] {
    return this.executeExtraction.getSupportedMimeTypes();
  }

  async getLatestCompletedBySourceId(sourceId: string): Promise<ExtractionJob | null> {
    const jobs = await this._repository.findBySourceId(sourceId);
    const completed = jobs.filter(j => j.extractedText !== null);
    if (completed.length === 0) return null;
    // Return most recent (last in array after sort by completedAt)
    return completed.reduce((latest, job) =>
      (job.completedAt?.getTime() ?? 0) > (latest.completedAt?.getTime() ?? 0) ? job : latest
    );
  }
}
```

Add import for `ExtractionJobRepository` and `ExtractionJob` at top of file.

**Step 2: Run tests**

Run: `pnpm --filter @klay/core test -- --reporter=verbose 2>&1 | tail -30`
Expected: All existing tests pass

**Step 3: Commit**

```bash
git add packages/core/src/contexts/source-ingestion/extraction/application/index.ts
git commit -m "feat(core): add getLatestCompletedBySourceId to ExtractionUseCases"
```

---

### Task 2: Add `getExtractedText` to SourceIngestionService

**Files:**
- Modify: `packages/core/src/contexts/source-ingestion/service/SourceIngestionService.ts`

**Step 1: Add method after `getResource` (around line 355)**

```typescript
async getExtractedText(sourceId: string): Promise<Result<DomainError, { text: string }>> {
  const sid = SourceId.create(sourceId);
  const source = await this._sourceRepository.findById(sid);

  if (!source) {
    return Result.fail(new SourceNotFoundError(sourceId));
  }

  const job = await this._extraction.getLatestCompletedBySourceId(sourceId);
  if (!job || !job.extractedText) {
    return Result.fail(new SourceNotFoundError(`No extracted text found for source ${sourceId}`));
  }

  return Result.ok({ text: job.extractedText });
}
```

**Step 2: Run tests**

Run: `pnpm --filter @klay/core test -- --reporter=verbose 2>&1 | tail -30`
Expected: All existing tests pass

**Step 3: Commit**

```bash
git add packages/core/src/contexts/source-ingestion/service/SourceIngestionService.ts
git commit -m "feat(core): add getExtractedText to SourceIngestionService"
```

---

### Task 3: Add DTOs + LifecycleStep for GenerateProjection

**Files:**
- Modify: `packages/core/src/application/knowledge-lifecycle/contracts/dtos.ts`
- Modify: `packages/core/src/application/knowledge-lifecycle/domain/LifecycleStep.ts`
- Modify: `packages/core/src/application/knowledge-lifecycle/index.ts`

**Step 1: Add DTOs to `dtos.ts` (append at end)**

```typescript
export interface GenerateProjectionInput {
  sourceId: string;
  processingProfileId: string;
  projectionId?: string;
}

export interface GenerateProjectionResult {
  projectionId: string;
  chunksCount: number;
  dimensions: number;
  model: string;
}
```

**Step 2: Add LifecycleStep entry**

In `LifecycleStep.ts`, add:
```typescript
GenerateProjection: "generate-projection",
```

**Step 3: Add to barrel exports in `index.ts`**

Add `GenerateProjectionInput` and `GenerateProjectionResult` to the type exports.

**Step 4: Add to KnowledgeLifecyclePort**

In `contracts/KnowledgeLifecyclePort.ts`, add import and method:

```typescript
import type { GenerateProjectionInput, GenerateProjectionResult } from "./dtos";

// Add to interface:
generateProjection(
  input: GenerateProjectionInput,
): Promise<Result<KnowledgeLifecycleError, GenerateProjectionResult>>;
```

**Step 5: Commit**

```bash
git add packages/core/src/application/knowledge-lifecycle/
git commit -m "feat(core): add GenerateProjection DTOs and port method"
```

---

### Task 4: Implement generateProjection in KnowledgeLifecycleOrchestrator

**Files:**
- Modify: `packages/core/src/application/knowledge-lifecycle/application/KnowledgeLifecycleOrchestrator.ts`
- Modify: `packages/core/src/application/composition/knowledge-platform.factory.ts`

**Step 1: Extend `ResolvedLifecycleDependencies` with ingestion + sourceKnowledge**

```typescript
import type { SourceIngestionService } from "../../../contexts/source-ingestion/service/SourceIngestionService";
import type { SourceKnowledgeService } from "../../../contexts/source-knowledge/service/SourceKnowledgeService";

export interface ResolvedLifecycleDependencies {
  contextManagement: ContextManagementService;
  processing: SemanticProcessingService;
  ingestion: SourceIngestionService;
  sourceKnowledge: SourceKnowledgeService;
}
```

Add private fields + constructor assignments for the two new deps.

**Step 2: Add `generateProjection` method**

```typescript
async generateProjection(
  input: GenerateProjectionInput,
): Promise<Result<KnowledgeLifecycleError, GenerateProjectionResult>> {
  try {
    const projectionId = input.projectionId ?? `proj-${crypto.randomUUID()}`;

    // 1. Get extracted text from source
    const textResult = await this._ingestion.getExtractedText(input.sourceId);
    if (textResult.isFail()) {
      return ResultClass.fail(
        LifecycleError.fromStep(LifecycleStep.GenerateProjection, textResult.error, []),
      );
    }

    // 2. Process content (chunking + embedding)
    const processResult = await this._processing.processContent({
      projectionId,
      sourceId: input.sourceId,
      content: textResult.value.text,
      type: "EMBEDDING",
      processingProfileId: input.processingProfileId,
    });
    if (processResult.isFail()) {
      return ResultClass.fail(
        LifecycleError.fromStep(LifecycleStep.GenerateProjection, processResult.error, ["get-text"]),
      );
    }

    // 3. Register projection in source knowledge hub
    const registerResult = await this._sourceKnowledge.registerProjection({
      sourceId: input.sourceId,
      projectionId,
      profileId: input.processingProfileId,
      status: "COMPLETED",
    });
    if (registerResult.isFail()) {
      return ResultClass.fail(
        LifecycleError.fromStep(LifecycleStep.GenerateProjection, registerResult.error, ["get-text", "process"]),
      );
    }

    return ResultClass.ok({
      projectionId,
      chunksCount: processResult.value.chunksCount,
      dimensions: processResult.value.dimensions,
      model: processResult.value.model,
    });
  } catch (error) {
    return ResultClass.fail(
      LifecycleError.fromStep(LifecycleStep.GenerateProjection, error, []),
    );
  }
}
```

Add DTO imports: `GenerateProjectionInput`, `GenerateProjectionResult`.

**Step 3: Wire new deps in `knowledge-platform.factory.ts`**

Update the lifecycle orchestrator creation to pass `ingestion` and `sourceKnowledge`:

```typescript
const lifecycle = new KnowledgeLifecycleOrchestrator({
  contextManagement: deps.contextManagement,
  processing: deps.processing,
  ingestion: deps.ingestion,
  sourceKnowledge: deps.sourceKnowledge,
});
```

**Step 4: Run tests**

Run: `pnpm --filter @klay/core test -- --reporter=verbose 2>&1 | tail -30`
Expected: All existing tests pass

**Step 5: Commit**

```bash
git add packages/core/src/application/knowledge-lifecycle/ packages/core/src/application/composition/
git commit -m "feat(core): implement generateProjection in lifecycle orchestrator"
```

---

### Task 5: Add to REST + UI adapters

**Files:**
- Modify: `packages/core/src/adapters/rest/KnowledgeLifecycleRESTAdapter.ts`
- Modify: `packages/core/src/adapters/ui/KnowledgeLifecycleUIAdapter.ts`

**Step 1: Add to REST adapter**

```typescript
// Import GenerateProjectionInput
async generateProjection(req: RESTRequest): Promise<RESTResponse> {
  const input = req.body as GenerateProjectionInput;
  const result = await this._lifecycle.generateProjection(input);
  return this._toResponse(result);
}
```

**Step 2: Add to UI adapter**

```typescript
// Import GenerateProjectionInput, GenerateProjectionResult
async generateProjection(input: GenerateProjectionInput): Promise<UIResult<GenerateProjectionResult>> {
  const result = await this._lifecycle.generateProjection(input);
  return this._unwrap(result);
}
```

**Step 3: Commit**

```bash
git add packages/core/src/adapters/
git commit -m "feat(core): add generateProjection to REST and UI adapters"
```

---

### Task 6: Add API route + web service layer

**Files:**
- Create: `apps/web/src/pages/api/lifecycle/generate-projection.ts`
- Modify: `apps/web/src/services/lifecycle-service.ts`
- Modify: `apps/web/src/services/server-lifecycle-service.ts`
- Modify: `apps/web/src/services/browser-lifecycle-service.ts`

**Step 1: Create API route**

```typescript
import type { APIRoute } from "astro";
import { getLifecycleAdapter } from "../../../server/pipeline-singleton";

export const POST: APIRoute = async ({ request }) => {
  const adapter = await getLifecycleAdapter();
  const body = await request.json();
  const result = await adapter.generateProjection({ body });
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: { "Content-Type": "application/json" },
  });
};
```

**Step 2: Add types + interface method to `lifecycle-service.ts`**

```typescript
// Types
export interface GenerateProjectionInput {
  sourceId: string;
  processingProfileId: string;
}

export interface GenerateProjectionResult {
  projectionId: string;
  chunksCount: number;
  dimensions: number;
  model: string;
}

// Add to LifecycleService interface:
generateProjection(input: GenerateProjectionInput): Promise<ServiceResult<GenerateProjectionResult>>;
```

**Step 3: Add to `ServerLifecycleService`**

```typescript
async generateProjection(input: GenerateProjectionInput): Promise<ServiceResult<GenerateProjectionResult>> {
  return this._post("/api/lifecycle/generate-projection", input);
}
```

**Step 4: Add to `BrowserLifecycleService`**

```typescript
async generateProjection(input: GenerateProjectionInput): Promise<ServiceResult<GenerateProjectionResult>> {
  const { lifecycle } = await this._getAdapters();
  return lifecycle.generateProjection(input) as Promise<ServiceResult<GenerateProjectionResult>>;
}
```

**Step 5: Build check**

Run: `pnpm --filter @klay/web build 2>&1 | tail -5`
Expected: `Complete!`

**Step 6: Commit**

```bash
git add apps/web/src/pages/api/lifecycle/generate-projection.ts apps/web/src/services/
git commit -m "feat(web): add generateProjection API route and service methods"
```

---

### Task 7: Create GenerateProjectionAction UI component

**Files:**
- Create: `apps/web/src/components/features/knowledge/GenerateProjectionAction.tsx`

**Step 1: Create the component**

```tsx
import { useState, useEffect, useCallback } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { useToast } from "../../../contexts/ToastContext";
import { useServiceAction } from "../../../hooks/usePipelineAction";
import { Button } from "../../shared/Button";
import { Icon } from "../../shared/Icon";
import { Spinner } from "../../shared/Spinner";
import { ErrorDisplay } from "../../shared/ErrorDisplay";
import type { GenerateProjectionInput } from "../../../services/lifecycle-service";

interface GenerateProjectionActionProps {
  sourceId: string;
  onSuccess?: () => void;
}

export function GenerateProjectionAction({ sourceId, onSuccess }: GenerateProjectionActionProps) {
  const { lifecycleService, pipelineService } = useRuntimeMode();
  const { addToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [profileId, setProfileId] = useState("default");
  const [profiles, setProfiles] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    if (!showForm || !pipelineService) return;
    pipelineService.listProcessingProfiles().then((result) => {
      if (result.success && result.data) {
        setProfiles(result.data.profiles ?? []);
      }
    });
  }, [showForm, pipelineService]);

  const generateAction = useCallback(
    (input: GenerateProjectionInput) => lifecycleService!.generateProjection(input),
    [lifecycleService],
  );

  const { error, isLoading, execute } = useServiceAction(generateAction);

  const handleGenerate = async () => {
    if (!profileId.trim()) return;
    const result = await execute({ sourceId, processingProfileId: profileId });
    if (result) {
      addToast(
        `Projection generated: ${result.chunksCount} chunks, ${result.dimensions}d`,
        "success",
      );
      setShowForm(false);
      onSuccess?.();
    }
  };

  if (showForm) {
    return (
      <div className="space-y-2 pt-2 mt-2 border-t border-subtle">
        <div className="flex items-center gap-2">
          <select
            value={profileId}
            onChange={(e) => setProfileId(e.target.value)}
            className="flex-1 text-xs px-2 py-1.5 rounded-md border border-default bg-surface-0 text-primary"
          >
            {profiles.length === 0 && (
              <option value="default">default</option>
            )}
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <Button
            variant="primary"
            size="sm"
            disabled={isLoading}
            onClick={handleGenerate}
          >
            {isLoading ? (
              <span className="flex items-center gap-1">
                <Spinner size="sm" /> Generating...
              </span>
            ) : (
              "Generate"
            )}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
            Cancel
          </Button>
        </div>
        {error && <ErrorDisplay {...error} />}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setShowForm(true)}
      className="flex items-center justify-center w-7 h-7 rounded-md transition-colors hover:bg-surface-3"
      title="Generate projection"
    >
      <Icon name="layers" className="text-tertiary" />
    </button>
  );
}
```

**Step 2: Verify the `listProcessingProfiles` exists on pipelineService**

Check `apps/web/src/services/pipeline-service.ts` — confirm `listProcessingProfiles()` returns `{ profiles: Array<{ id, name }> }`. If not, adjust the profiles loading.

**Step 3: Commit**

```bash
git add apps/web/src/components/features/knowledge/GenerateProjectionAction.tsx
git commit -m "feat(web): create GenerateProjectionAction component"
```

---

### Task 8: Integrate GenerateProjectionAction in ContextSourcesPage

**Files:**
- Modify: `apps/web/src/components/features/knowledgeContext/ContextSourcesPage.tsx`

**Step 1: Import the component**

```typescript
import { GenerateProjectionAction } from "../knowledge/GenerateProjectionAction";
```

**Step 2: Add to source card actions**

In the actions div (the one with expand toggle + RemoveSourceAction), add `GenerateProjectionAction` before the expand button:

```tsx
<div className="ml-3 flex-shrink-0 flex items-center gap-1">
  <GenerateProjectionAction
    sourceId={manifest.sourceId}
    onSuccess={handleActionSuccess}
  />
  <button ... expand toggle ... />
  <RemoveSourceAction ... />
</div>
```

**Step 3: Build check**

Run: `pnpm --filter @klay/web build 2>&1 | tail -5`
Expected: `Complete!`

**Step 4: Commit**

```bash
git add apps/web/src/components/features/knowledgeContext/ContextSourcesPage.tsx
git commit -m "feat(web): integrate GenerateProjectionAction in source cards"
```

---

## Verification

1. `pnpm --filter @klay/core test` — all pass
2. `pnpm --filter @klay/web build` — succeeds
3. Navigate to Sources page → each source card shows a layers icon button
4. Click it → dropdown with profile selector + Generate button
5. Generate → toast confirms projection with chunk count and dimensions
6. Works in both Server and Browser runtime modes
