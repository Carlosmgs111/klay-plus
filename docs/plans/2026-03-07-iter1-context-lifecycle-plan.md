# Iteration 1: Context Lifecycle + Metadata — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Give users explicit control over context creation, lifecycle states (Active/Archived/Deprecated), and surface the rich metadata the core already tracks.

**Architecture:** Vertical slice — extend the core lifecycle port with 4 new operations (create/archive/deprecate/activate), wire them through REST adapter → API routes → web services → UI components. Follow existing patterns exactly.

**Tech Stack:** TypeScript, @klay/core DDD, Astro SSR API routes, React components, TailwindCSS

---

## Pre-requisite: Fix Unit→Context naming mismatch

The web layer still imports stale type names (`ReprocessUnitInput`, `RollbackUnitInput`, `LinkUnitsInput`, `UnlinkUnitsInput`) from `@klay/core/lifecycle`, but the core only exports `ReprocessContextInput`, `RollbackContextInput`, `LinkContextsInput`, `UnlinkContextsInput`. This must be fixed first.

### Task 0: Rename stale Unit types to Context types in web layer

**Files:**
- Modify: `apps/web/src/services/lifecycle-service.ts`
- Modify: `apps/web/src/services/server-lifecycle-service.ts`
- Modify: `apps/web/src/services/browser-lifecycle-service.ts`
- Modify: `apps/web/src/components/features/knowledge/ReprocessAction.tsx`
- Modify: `apps/web/src/components/features/knowledge/RollbackAction.tsx`

**Step 1: Update lifecycle-service.ts interface**

Replace all `Unit` type names with `Context` equivalents:
- `ReprocessUnitInput` → `ReprocessContextInput`
- `ReprocessUnitResult` → `ReprocessContextResult`
- `RollbackUnitInput` → `RollbackContextInput`
- `RollbackUnitResult` → `RollbackContextResult`
- `LinkUnitsInput` → `LinkContextsInput`
- `LinkUnitsResult` → `LinkContextsResult`
- `UnlinkUnitsInput` → `UnlinkContextsInput`
- `UnlinkUnitsResult` → `UnlinkContextsResult`

Also rename methods:
- `reprocessUnit` → `reprocessContext`
- `rollbackUnit` → `rollbackContext`
- `linkUnits` → `linkContexts`
- `unlinkUnits` → `unlinkContexts`

**Step 2: Update server-lifecycle-service.ts**

Same renames as Step 1 (implements the interface).

**Step 3: Update browser-lifecycle-service.ts**

Same renames. Also update the internal adapter calls:
- `lifecycle.reprocessUnit(input)` → `lifecycle.reprocessContext(input)`
- `lifecycle.rollbackUnit(input)` → `lifecycle.rollbackContext(input)`
- `lifecycle.linkUnits(input)` → `lifecycle.linkContexts(input)`
- `lifecycle.unlinkUnits(input)` → `lifecycle.unlinkContexts(input)`

**Step 4: Update ReprocessAction.tsx and RollbackAction.tsx**

Update to call new method names (`lifecycleService.reprocessContext()`, `lifecycleService.rollbackContext()`).

**Step 5: Run build to verify**

Run: `pnpm --filter @klay/web build`
Expected: Build succeeds with no type errors

**Step 6: Commit**

```bash
git add apps/web/src/services/ apps/web/src/components/features/knowledge/ReprocessAction.tsx apps/web/src/components/features/knowledge/RollbackAction.tsx
git commit -m "refactor(web): rename Unit→Context types in lifecycle service layer"
```

---

## Phase 1: Core Extensions

### Task 1: Add lifecycle DTOs for create/archive/deprecate/activate

**Files:**
- Modify: `packages/core/src/application/knowledge-lifecycle/contracts/dtos.ts`

**Step 1: Add new DTOs**

Append to existing file:

```typescript
export interface CreateContextInput {
  id: string;
  name: string;
  description: string;
  language: string;
  requiredProfileId: string;
  createdBy: string;
  tags?: string[];
  attributes?: Record<string, string>;
}

export interface CreateContextResult {
  contextId: string;
  state: string;
}

export interface ArchiveContextInput {
  contextId: string;
}

export interface ArchiveContextResult {
  contextId: string;
  state: string;
}

export interface DeprecateContextInput {
  contextId: string;
  reason: string;
}

export interface DeprecateContextResult {
  contextId: string;
  state: string;
}

export interface ActivateContextInput {
  contextId: string;
}

export interface ActivateContextResult {
  contextId: string;
  state: string;
}
```

**Step 2: Commit**

```bash
git add packages/core/src/application/knowledge-lifecycle/contracts/dtos.ts
git commit -m "feat(core): add create/archive/deprecate/activate lifecycle DTOs"
```

---

### Task 2: Add LifecycleSteps and extend Port

**Files:**
- Modify: `packages/core/src/application/knowledge-lifecycle/domain/LifecycleStep.ts`
- Modify: `packages/core/src/application/knowledge-lifecycle/contracts/KnowledgeLifecyclePort.ts`

**Step 1: Add new LifecycleSteps**

Add to `LifecycleStep` const:

```typescript
CreateContext: "create-context",
ArchiveContext: "archive-context",
DeprecateContext: "deprecate-context",
ActivateContext: "activate-context",
```

**Step 2: Extend KnowledgeLifecyclePort**

Import new DTOs and add 4 methods:

```typescript
createContext(input: CreateContextInput): Promise<Result<KnowledgeLifecycleError, CreateContextResult>>;
archiveContext(input: ArchiveContextInput): Promise<Result<KnowledgeLifecycleError, ArchiveContextResult>>;
deprecateContext(input: DeprecateContextInput): Promise<Result<KnowledgeLifecycleError, DeprecateContextResult>>;
activateContext(input: ActivateContextInput): Promise<Result<KnowledgeLifecycleError, ActivateContextResult>>;
```

**Step 3: Commit**

```bash
git add packages/core/src/application/knowledge-lifecycle/domain/LifecycleStep.ts packages/core/src/application/knowledge-lifecycle/contracts/KnowledgeLifecyclePort.ts
git commit -m "feat(core): extend lifecycle port with context state transitions"
```

---

### Task 3: Implement in KnowledgeLifecycleOrchestrator

**Files:**
- Modify: `packages/core/src/application/knowledge-lifecycle/application/KnowledgeLifecycleOrchestrator.ts`

**Step 1: Add createContext method**

Follow existing pattern (see `removeSource` for reference):

```typescript
async createContext(input: CreateContextInput): Promise<Result<KnowledgeLifecycleError, CreateContextResult>> {
  try {
    const result = await this._contextManagement.createContext({
      id: input.id,
      name: input.name,
      description: input.description,
      language: input.language,
      requiredProfileId: input.requiredProfileId,
      createdBy: input.createdBy,
      tags: input.tags,
      attributes: input.attributes,
    });

    if (result.isFail()) {
      return ResultClass.fail(
        LifecycleError.fromStep(LifecycleStep.CreateContext, result.error, []),
      );
    }

    const context = result.value;
    // Auto-activate: skip Draft, go straight to Active for low-friction UX
    const activateResult = await this._contextManagement.activateContext({
      contextId: context.id.value,
    });

    if (activateResult.isFail()) {
      return ResultClass.fail(
        LifecycleError.fromStep(LifecycleStep.ActivateContext, activateResult.error, [LifecycleStep.CreateContext]),
      );
    }

    return ResultClass.ok({
      contextId: activateResult.value.id.value,
      state: activateResult.value.state,
    });
  } catch (error) {
    return ResultClass.fail(
      LifecycleError.fromStep(LifecycleStep.CreateContext, error, []),
    );
  }
}
```

**Step 2: Add archiveContext, deprecateContext, activateContext**

Each follows the same pattern — call `this._contextManagement.<method>()`, wrap result:

```typescript
async archiveContext(input: ArchiveContextInput): Promise<Result<KnowledgeLifecycleError, ArchiveContextResult>> {
  try {
    const result = await this._contextManagement.archiveContext({ contextId: input.contextId });
    if (result.isFail()) {
      return ResultClass.fail(LifecycleError.fromStep(LifecycleStep.ArchiveContext, result.error, []));
    }
    return ResultClass.ok({ contextId: result.value.id.value, state: result.value.state });
  } catch (error) {
    return ResultClass.fail(LifecycleError.fromStep(LifecycleStep.ArchiveContext, error, []));
  }
}

async deprecateContext(input: DeprecateContextInput): Promise<Result<KnowledgeLifecycleError, DeprecateContextResult>> {
  try {
    const result = await this._contextManagement.deprecateContext({
      contextId: input.contextId,
      reason: input.reason,
    });
    if (result.isFail()) {
      return ResultClass.fail(LifecycleError.fromStep(LifecycleStep.DeprecateContext, result.error, []));
    }
    return ResultClass.ok({ contextId: result.value.id.value, state: result.value.state });
  } catch (error) {
    return ResultClass.fail(LifecycleError.fromStep(LifecycleStep.DeprecateContext, error, []));
  }
}

async activateContext(input: ActivateContextInput): Promise<Result<KnowledgeLifecycleError, ActivateContextResult>> {
  try {
    const result = await this._contextManagement.activateContext({ contextId: input.contextId });
    if (result.isFail()) {
      return ResultClass.fail(LifecycleError.fromStep(LifecycleStep.ActivateContext, result.error, []));
    }
    return ResultClass.ok({ contextId: result.value.id.value, state: result.value.state });
  } catch (error) {
    return ResultClass.fail(LifecycleError.fromStep(LifecycleStep.ActivateContext, error, []));
  }
}
```

**Step 3: Run tests**

Run: `pnpm --filter @klay/core test`
Expected: All 153 tests pass (new methods not tested yet — no regressions)

**Step 4: Commit**

```bash
git add packages/core/src/application/knowledge-lifecycle/application/KnowledgeLifecycleOrchestrator.ts
git commit -m "feat(core): implement create/archive/deprecate/activate in lifecycle orchestrator"
```

---

### Task 4: Extend lifecycle exports and adapters

**Files:**
- Modify: `packages/core/src/application/knowledge-lifecycle/index.ts`
- Modify: `packages/core/src/adapters/rest/KnowledgeLifecycleRESTAdapter.ts`
- Modify: `packages/core/src/adapters/ui/KnowledgeLifecycleUIAdapter.ts`

**Step 1: Export new DTOs from lifecycle index**

Add to the type exports block:

```typescript
CreateContextInput,
CreateContextResult,
ArchiveContextInput,
ArchiveContextResult,
DeprecateContextInput,
DeprecateContextResult,
ActivateContextInput,
ActivateContextResult,
```

**Step 2: Add REST adapter methods**

Follow existing pattern in `KnowledgeLifecycleRESTAdapter`:

```typescript
async createContext(req: RESTRequest): Promise<RESTResponse> {
  const input = req.body as CreateContextInput;
  const result = await this._lifecycle.createContext(input);
  return this._toResponse(result);
}

async archiveContext(req: RESTRequest): Promise<RESTResponse> {
  const input = req.body as ArchiveContextInput;
  const result = await this._lifecycle.archiveContext(input);
  return this._toResponse(result);
}

async deprecateContext(req: RESTRequest): Promise<RESTResponse> {
  const input = req.body as DeprecateContextInput;
  const result = await this._lifecycle.deprecateContext(input);
  return this._toResponse(result);
}

async activateContext(req: RESTRequest): Promise<RESTResponse> {
  const input = req.body as ActivateContextInput;
  const result = await this._lifecycle.activateContext(input);
  return this._toResponse(result);
}
```

**Step 3: Add UI adapter methods**

Follow existing pattern in `KnowledgeLifecycleUIAdapter`:

```typescript
async createContext(input: CreateContextInput): Promise<UIResult<CreateContextResult>> {
  const result = await this._lifecycle.createContext(input);
  return this._unwrap(result);
}

async archiveContext(input: ArchiveContextInput): Promise<UIResult<ArchiveContextResult>> {
  const result = await this._lifecycle.archiveContext(input);
  return this._unwrap(result);
}

async deprecateContext(input: DeprecateContextInput): Promise<UIResult<DeprecateContextResult>> {
  const result = await this._lifecycle.deprecateContext(input);
  return this._unwrap(result);
}

async activateContext(input: ActivateContextInput): Promise<UIResult<ActivateContextResult>> {
  const result = await this._lifecycle.activateContext(input);
  return this._unwrap(result);
}
```

**Step 4: Run tests**

Run: `pnpm --filter @klay/core test`
Expected: All tests pass

**Step 5: Commit**

```bash
git add packages/core/src/application/knowledge-lifecycle/index.ts packages/core/src/adapters/rest/KnowledgeLifecycleRESTAdapter.ts packages/core/src/adapters/ui/KnowledgeLifecycleUIAdapter.ts
git commit -m "feat(core): wire lifecycle create/archive/deprecate/activate through adapters"
```

---

## Phase 2: Web Service Layer

### Task 5: Extend LifecycleService interface and implementations

**Files:**
- Modify: `apps/web/src/services/lifecycle-service.ts`
- Modify: `apps/web/src/services/server-lifecycle-service.ts`
- Modify: `apps/web/src/services/browser-lifecycle-service.ts`

**Step 1: Add to LifecycleService interface**

Import new types from `@klay/core/lifecycle` and add 4 methods:

```typescript
createContext(input: CreateContextInput): Promise<ServiceResult<CreateContextResult>>;
archiveContext(input: ArchiveContextInput): Promise<ServiceResult<ArchiveContextResult>>;
deprecateContext(input: DeprecateContextInput): Promise<ServiceResult<DeprecateContextResult>>;
activateContext(input: ActivateContextInput): Promise<ServiceResult<ActivateContextResult>>;
```

**Step 2: Implement in ServerLifecycleService**

```typescript
async createContext(input: CreateContextInput): Promise<ServiceResult<CreateContextResult>> {
  return this._post("/api/lifecycle/create-context", input);
}

async archiveContext(input: ArchiveContextInput): Promise<ServiceResult<ArchiveContextResult>> {
  return this._post("/api/lifecycle/archive-context", input);
}

async deprecateContext(input: DeprecateContextInput): Promise<ServiceResult<DeprecateContextResult>> {
  return this._post("/api/lifecycle/deprecate-context", input);
}

async activateContext(input: ActivateContextInput): Promise<ServiceResult<ActivateContextResult>> {
  return this._post("/api/lifecycle/activate-context", input);
}
```

**Step 3: Implement in BrowserLifecycleService**

```typescript
async createContext(input: CreateContextInput): Promise<ServiceResult<CreateContextResult>> {
  const { lifecycle } = await this._getAdapters();
  return lifecycle.createContext(input) as Promise<ServiceResult<CreateContextResult>>;
}

async archiveContext(input: ArchiveContextInput): Promise<ServiceResult<ArchiveContextResult>> {
  const { lifecycle } = await this._getAdapters();
  return lifecycle.archiveContext(input) as Promise<ServiceResult<ArchiveContextResult>>;
}

async deprecateContext(input: DeprecateContextInput): Promise<ServiceResult<DeprecateContextResult>> {
  const { lifecycle } = await this._getAdapters();
  return lifecycle.deprecateContext(input) as Promise<ServiceResult<DeprecateContextResult>>;
}

async activateContext(input: ActivateContextInput): Promise<ServiceResult<ActivateContextResult>> {
  const { lifecycle } = await this._getAdapters();
  return lifecycle.activateContext(input) as Promise<ServiceResult<ActivateContextResult>>;
}
```

**Step 4: Commit**

```bash
git add apps/web/src/services/
git commit -m "feat(web): add create/archive/deprecate/activate to lifecycle service layer"
```

---

## Phase 3: API Routes

### Task 6: Create 4 lifecycle API routes

**Files:**
- Create: `apps/web/src/pages/api/lifecycle/create-context.ts`
- Create: `apps/web/src/pages/api/lifecycle/archive-context.ts`
- Create: `apps/web/src/pages/api/lifecycle/deprecate-context.ts`
- Create: `apps/web/src/pages/api/lifecycle/activate-context.ts`

**Step 1: Create all 4 routes**

Each follows the identical pattern from existing routes (e.g. `remove-source.ts`):

```typescript
// create-context.ts
import type { APIRoute } from "astro";
import { getLifecycleAdapter } from "../../../server/pipeline-singleton";

export const POST: APIRoute = async ({ request }) => {
  const adapter = await getLifecycleAdapter();
  const body = await request.json();
  const result = await adapter.createContext({ body });
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: { "Content-Type": "application/json" },
  });
};
```

Same for `archive-context.ts` (calls `adapter.archiveContext`), `deprecate-context.ts` (`adapter.deprecateContext`), `activate-context.ts` (`adapter.activateContext`).

**Step 2: Run build to verify**

Run: `pnpm --filter @klay/web build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add apps/web/src/pages/api/lifecycle/
git commit -m "feat(web): add API routes for context create/archive/deprecate/activate"
```

---

## Phase 4: UI Components

### Task 7: Add "empty" status to StatusBadge and context state badge

**Files:**
- Modify: `apps/web/src/components/shared/StatusBadge.tsx`

**Step 1: Add context lifecycle states to BadgeStatus**

Extend `BadgeStatus` type to include context states and add configs:

```typescript
type BadgeStatus = "complete" | "failed" | "pending" | "processing" | "partial" | "empty"
  | "ACTIVE" | "ARCHIVED" | "DEPRECATED" | "DRAFT";
```

Add to `BADGE_CONFIG`:

```typescript
ACTIVE: {
  className: "badge-complete",
  label: "Active",
  dotClassName: "bg-success",
},
ARCHIVED: {
  className: "badge-pending",
  label: "Archived",
  dotClassName: "bg-tertiary",
},
DEPRECATED: {
  className: "badge-failed",
  label: "Deprecated",
  dotClassName: "bg-warning",
},
DRAFT: {
  className: "badge-pending",
  label: "Draft",
  dotClassName: "bg-accent",
},
```

**Step 2: Commit**

```bash
git add apps/web/src/components/shared/StatusBadge.tsx
git commit -m "feat(web): add context lifecycle states to StatusBadge"
```

---

### Task 8: Create CreateContextForm component

**Files:**
- Create: `apps/web/src/components/features/knowledge/CreateContextForm.tsx`

**Step 1: Build the form**

Low-friction form with smart defaults. Uses Overlay pattern (like AddSourceUploadForm). Fields: name (auto-generated default), description (optional), language (default "en"), processing profile (select from available, default first).

```typescript
import { useState, useCallback, useEffect } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { useToast } from "../../../contexts/ToastContext";
import { useServiceAction } from "../../../hooks/usePipelineAction";
import { Icon } from "../../shared/Icon";
import type { CreateContextInput, CreateContextResult } from "@klay/core/lifecycle";

interface CreateContextFormProps {
  onSuccess?: (contextId: string) => void;
}

export function CreateContextForm({ onSuccess }: CreateContextFormProps) {
  const { lifecycleService, service } = useRuntimeMode();
  const { addToast } = useToast();
  const [profiles, setProfiles] = useState<{ id: string; name: string }[]>([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("en");
  const [profileId, setProfileId] = useState("");

  useEffect(() => {
    service?.listProcessingProfiles().then((result) => {
      if (result.success && result.data) {
        setProfiles(result.data.map((p: any) => ({ id: p.id, name: p.name })));
        if (result.data.length > 0 && !profileId) {
          setProfileId(result.data[0].id);
        }
      }
    });
  }, [service]);

  const createAction = useCallback(
    (input: CreateContextInput) => lifecycleService!.createContext(input),
    [lifecycleService],
  );

  const { error, isLoading, execute } = useServiceAction(createAction);

  const handleCreate = async () => {
    const contextName = name.trim() || `Context-${new Date().toISOString().slice(0, 10)}-${crypto.randomUUID().slice(0, 4)}`;
    const input: CreateContextInput = {
      id: crypto.randomUUID(),
      name: contextName,
      description: description.trim(),
      language,
      requiredProfileId: profileId,
      createdBy: "user",
    };

    const result = await execute(input);
    if (result) {
      addToast(`Context "${contextName}" created`, "success");
      onSuccess?.(result.contextId);
    }
  };

  return (
    <div className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-xs font-medium text-secondary mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Auto-generated if empty"
          className="input w-full"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-medium text-secondary mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional"
          rows={3}
          className="input w-full resize-none"
        />
      </div>

      {/* Language */}
      <div>
        <label className="block text-xs font-medium text-secondary mb-1">Language</label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="input w-full"
        >
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
          <option value="pt">Portuguese</option>
        </select>
      </div>

      {/* Processing Profile */}
      <div>
        <label className="block text-xs font-medium text-secondary mb-1">Processing Profile</label>
        <select
          value={profileId}
          onChange={(e) => setProfileId(e.target.value)}
          className="input w-full"
        >
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg p-3 bg-danger-muted border border-danger">
          <p className="text-xs text-danger">{error.message}</p>
        </div>
      )}

      {/* Submit */}
      <button
        type="button"
        onClick={handleCreate}
        disabled={isLoading || !profileId}
        className="btn-primary w-full"
      >
        {isLoading ? "Creating..." : "Create Context"}
      </button>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/components/features/knowledge/CreateContextForm.tsx
git commit -m "feat(web): add CreateContextForm with smart defaults"
```

---

### Task 9: Create lifecycle action components

**Files:**
- Create: `apps/web/src/components/features/knowledge/ArchiveContextAction.tsx`
- Create: `apps/web/src/components/features/knowledge/DeprecateContextAction.tsx`
- Create: `apps/web/src/components/features/knowledge/ActivateContextAction.tsx`

**Step 1: ArchiveContextAction**

Confirmation button following RemoveSourceAction pattern:

```typescript
import { useState, useCallback } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { useToast } from "../../../contexts/ToastContext";
import { useServiceAction } from "../../../hooks/usePipelineAction";
import { Icon } from "../../shared/Icon";
import type { ArchiveContextInput, ArchiveContextResult } from "@klay/core/lifecycle";

interface ArchiveContextActionProps {
  contextId: string;
  onSuccess?: () => void;
}

export function ArchiveContextAction({ contextId, onSuccess }: ArchiveContextActionProps) {
  const { lifecycleService } = useRuntimeMode();
  const { addToast } = useToast();
  const [confirming, setConfirming] = useState(false);

  const archiveAction = useCallback(
    (input: ArchiveContextInput) => lifecycleService!.archiveContext(input),
    [lifecycleService],
  );

  const { error, isLoading, execute } = useServiceAction(archiveAction);

  const handleArchive = async () => {
    const result = await execute({ contextId });
    if (result) {
      addToast("Context archived", "success");
      onSuccess?.();
    }
    setConfirming(false);
  };

  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors text-tertiary hover:bg-black/5 dark:hover:bg-white/5">
        <Icon name="archive" className="text-sm" />
        Archive
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-secondary">Archive this context?</span>
      <button type="button" onClick={handleArchive} disabled={isLoading}
        className="px-2 py-0.5 rounded text-xs font-medium bg-danger text-white">
        {isLoading ? "..." : "Confirm"}
      </button>
      <button type="button" onClick={() => setConfirming(false)}
        className="px-2 py-0.5 rounded text-xs font-medium text-tertiary hover:text-primary">
        Cancel
      </button>
      {error && <span className="text-xs text-danger">{error.message}</span>}
    </div>
  );
}
```

**Step 2: DeprecateContextAction**

Same pattern but with a reason input:

```typescript
import { useState, useCallback } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { useToast } from "../../../contexts/ToastContext";
import { useServiceAction } from "../../../hooks/usePipelineAction";
import { Icon } from "../../shared/Icon";
import type { DeprecateContextInput, DeprecateContextResult } from "@klay/core/lifecycle";

interface DeprecateContextActionProps {
  contextId: string;
  onSuccess?: () => void;
}

export function DeprecateContextAction({ contextId, onSuccess }: DeprecateContextActionProps) {
  const { lifecycleService } = useRuntimeMode();
  const { addToast } = useToast();
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState("");

  const deprecateAction = useCallback(
    (input: DeprecateContextInput) => lifecycleService!.deprecateContext(input),
    [lifecycleService],
  );

  const { error, isLoading, execute } = useServiceAction(deprecateAction);

  const handleDeprecate = async () => {
    const result = await execute({ contextId, reason: reason.trim() || "No reason provided" });
    if (result) {
      addToast("Context deprecated", "success");
      onSuccess?.();
    }
    setConfirming(false);
  };

  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors text-warning hover:bg-warning/10">
        <Icon name="alert-triangle" className="text-sm" />
        Deprecate
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <input type="text" value={reason} onChange={(e) => setReason(e.target.value)}
        placeholder="Reason (optional)" className="input w-full text-xs" />
      <div className="flex items-center gap-2">
        <button type="button" onClick={handleDeprecate} disabled={isLoading}
          className="px-2 py-0.5 rounded text-xs font-medium bg-warning text-white">
          {isLoading ? "..." : "Deprecate"}
        </button>
        <button type="button" onClick={() => setConfirming(false)}
          className="px-2 py-0.5 rounded text-xs font-medium text-tertiary hover:text-primary">
          Cancel
        </button>
      </div>
      {error && <span className="text-xs text-danger">{error.message}</span>}
    </div>
  );
}
```

**Step 3: ActivateContextAction**

Simple confirmation button:

```typescript
import { useCallback } from "react";
import { useRuntimeMode } from "../../../contexts/RuntimeModeContext";
import { useToast } from "../../../contexts/ToastContext";
import { useServiceAction } from "../../../hooks/usePipelineAction";
import { Icon } from "../../shared/Icon";
import type { ActivateContextInput, ActivateContextResult } from "@klay/core/lifecycle";

interface ActivateContextActionProps {
  contextId: string;
  onSuccess?: () => void;
}

export function ActivateContextAction({ contextId, onSuccess }: ActivateContextActionProps) {
  const { lifecycleService } = useRuntimeMode();
  const { addToast } = useToast();

  const activateAction = useCallback(
    (input: ActivateContextInput) => lifecycleService!.activateContext(input),
    [lifecycleService],
  );

  const { error, isLoading, execute } = useServiceAction(activateAction);

  const handleActivate = async () => {
    const result = await execute({ contextId });
    if (result) {
      addToast("Context activated", "success");
      onSuccess?.();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={handleActivate} disabled={isLoading}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors text-success hover:bg-success/10">
        <Icon name="check-circle" className="text-sm" />
        {isLoading ? "Activating..." : "Activate"}
      </button>
      {error && <span className="text-xs text-danger">{error.message}</span>}
    </div>
  );
}
```

**Step 4: Commit**

```bash
git add apps/web/src/components/features/knowledge/ArchiveContextAction.tsx apps/web/src/components/features/knowledge/DeprecateContextAction.tsx apps/web/src/components/features/knowledge/ActivateContextAction.tsx
git commit -m "feat(web): add Archive/Deprecate/Activate action components"
```

---

### Task 10: Wire lifecycle actions into ContextDashboardPage

**Files:**
- Modify: `apps/web/src/components/features/knowledgeContext/ContextDashboardPage.tsx`

**Step 1: Import new components**

```typescript
import { ArchiveContextAction } from "../knowledge/ArchiveContextAction";
import { DeprecateContextAction } from "../knowledge/DeprecateContextAction";
import { ActivateContextAction } from "../knowledge/ActivateContextAction";
```

**Step 2: Add lifecycle actions to the status header area**

After the existing `<StatusBadge status={overallStatus} />`, add a conditional actions bar based on context state. The context state comes from manifests or a separate fetch — for now, derive from overallStatus + a new state field.

Since we don't have context state in the current data model (manifests don't carry it), we need to extend `KnowledgeContextContext` to also fetch context info. This requires a new API call or extending the manifest response to include context state.

**Practical approach:** Add context state to the `getManifest` response in a follow-up task. For now, show the actions unconditionally and let the API reject invalid transitions.

Add below the status header `<div className="flex items-center justify-between">`:

```tsx
{/* Lifecycle Actions */}
<div className="flex items-center gap-2">
  <ArchiveContextAction contextId={contextId} onSuccess={refresh} />
  <DeprecateContextAction contextId={contextId} onSuccess={refresh} />
  <ActivateContextAction contextId={contextId} onSuccess={refresh} />
</div>
```

**Step 3: Commit**

```bash
git add apps/web/src/components/features/knowledgeContext/ContextDashboardPage.tsx
git commit -m "feat(web): wire lifecycle actions into context dashboard"
```

---

### Task 11: Add "New Context" button to ContextsIndexPage

**Files:**
- Modify: `apps/web/src/components/features/knowledgeContext/ContextsIndexPage.tsx`

**Step 1: Import CreateContextForm and Overlay**

```typescript
import { CreateContextForm } from "../knowledge/CreateContextForm";
import { Overlay } from "../../shared/Overlay";
```

**Step 2: Add state and button**

Add `const [showCreate, setShowCreate] = useState(false);` and a "New Context" button in the header area, plus the Overlay with the form.

The button should use the same style as existing "Add" buttons. On success, navigate to the new context's dashboard.

**Step 3: Run build to verify**

Run: `pnpm --filter @klay/web build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add apps/web/src/components/features/knowledgeContext/ContextsIndexPage.tsx
git commit -m "feat(web): add New Context button to contexts index page"
```

---

### Task 12: Final build verification and integration test

**Step 1: Run core tests**

Run: `pnpm --filter @klay/core test`
Expected: All tests pass

**Step 2: Run web build**

Run: `pnpm --filter @klay/web build`
Expected: Build succeeds with no errors

**Step 3: Manual smoke test**

Run: `pnpm --filter @klay/web dev`
- Navigate to `/contexts` — verify "New Context" button appears
- Click "New Context" — verify form opens in overlay
- Create a context — verify it appears in the list
- Navigate to context dashboard — verify lifecycle action buttons appear
- Test Archive/Deprecate/Activate buttons

**Step 4: Final commit if any fixes needed**

---

## Summary

| Task | Phase | What |
|------|-------|------|
| 0 | Pre-req | Fix Unit→Context naming in web services |
| 1 | Core | Add lifecycle DTOs |
| 2 | Core | Extend LifecycleStep + Port |
| 3 | Core | Implement in Orchestrator |
| 4 | Core | Wire through adapters + exports |
| 5 | Web services | Extend interface + implementations |
| 6 | API routes | Create 4 new route files |
| 7 | UI | Add context states to StatusBadge |
| 8 | UI | CreateContextForm component |
| 9 | UI | Archive/Deprecate/Activate actions |
| 10 | UI | Wire actions into ContextDashboardPage |
| 11 | UI | Add "New Context" button to index |
| 12 | Verify | Build + tests + smoke test |
