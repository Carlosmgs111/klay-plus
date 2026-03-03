# Domain Restructure: Source-Centric Projection Model — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Decouple projections from SemanticUnit, make Sources self-sufficient with ProjectionHub, rename SemanticUnit to Context, and add source-knowledge bounded context.

**Architecture:** New bounded context `source-knowledge` owns Source+ProjectionHub+Projection lifecycle. `semantic-processing` keeps ProcessingProfile and execution logic but Projection moves to source-knowledge. `semantic-knowledge` renamed to `context-management`, simplified to manage source references and declare required profile. Application layer orchestrators updated for new flows.

**Tech Stack:** TypeScript, Vitest, DDD patterns (AggregateRoot, ValueObject, Repository, Result), triple persistence (InMemory/NeDB/IndexedDB)

---

## Phase 1: Create `source-knowledge` Bounded Context (Domain Layer)

### Task 1.1: Directory structure and ProjectionHub value object

**Files:**
- Create: `packages/core/src/contexts/source-knowledge/source/domain/ProjectionHub.ts`
- Test: `packages/core/src/contexts/source-knowledge/source/domain/__tests__/ProjectionHub.test.ts`

**Step 1: Write the failing test**

```typescript
import { describe, it, expect } from "vitest";
import { ProjectionHub } from "../ProjectionHub";

describe("ProjectionHub", () => {
  it("creates empty hub", () => {
    const hub = ProjectionHub.create();
    expect(hub.projections).toEqual([]);
    expect(hub.hasProjectionForProfile("profile-1")).toBe(false);
  });

  it("registers a projection", () => {
    const hub = ProjectionHub.create();
    const updated = hub.withProjection({
      projectionId: "proj-1",
      profileId: "profile-1",
      status: "COMPLETED",
      generatedAt: new Date(),
    });
    expect(updated.projections).toHaveLength(1);
    expect(updated.hasProjectionForProfile("profile-1")).toBe(true);
  });

  it("does not duplicate projection for same profile", () => {
    const hub = ProjectionHub.create();
    const first = hub.withProjection({
      projectionId: "proj-1",
      profileId: "profile-1",
      status: "COMPLETED",
      generatedAt: new Date(),
    });
    const second = first.withProjection({
      projectionId: "proj-2",
      profileId: "profile-1",
      status: "COMPLETED",
      generatedAt: new Date(),
    });
    // Should replace, not duplicate
    expect(second.projections).toHaveLength(1);
    expect(second.getProjectionForProfile("profile-1")?.projectionId).toBe("proj-2");
  });

  it("accumulates projections for different profiles", () => {
    const hub = ProjectionHub.create();
    const updated = hub
      .withProjection({ projectionId: "proj-1", profileId: "profile-1", status: "COMPLETED", generatedAt: new Date() })
      .withProjection({ projectionId: "proj-2", profileId: "profile-2", status: "COMPLETED", generatedAt: new Date() });
    expect(updated.projections).toHaveLength(2);
  });

  it("reconstitutes from props", () => {
    const projections = [
      { projectionId: "proj-1", profileId: "profile-1", status: "COMPLETED" as const, generatedAt: new Date() },
    ];
    const hub = ProjectionHub.reconstitute(projections);
    expect(hub.projections).toHaveLength(1);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @klay/core exec vitest run src/contexts/source-knowledge/source/domain/__tests__/ProjectionHub.test.ts`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

```typescript
import { ValueObject } from "../../../../shared/domain/ValueObject";

interface ProjectionEntry {
  projectionId: string;
  profileId: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  generatedAt: Date;
}

interface ProjectionHubProps {
  projections: ReadonlyArray<ProjectionEntry>;
}

export class ProjectionHub extends ValueObject<ProjectionHubProps> {
  get projections(): ReadonlyArray<ProjectionEntry> {
    return this.props.projections;
  }

  hasProjectionForProfile(profileId: string): boolean {
    return this.props.projections.some((p) => p.profileId === profileId);
  }

  getProjectionForProfile(profileId: string): ProjectionEntry | undefined {
    return this.props.projections.find((p) => p.profileId === profileId);
  }

  withProjection(entry: ProjectionEntry): ProjectionHub {
    const filtered = this.props.projections.filter((p) => p.profileId !== entry.profileId);
    return new ProjectionHub({ projections: [...filtered, entry] });
  }

  static create(): ProjectionHub {
    return new ProjectionHub({ projections: [] });
  }

  static reconstitute(projections: ProjectionEntry[]): ProjectionHub {
    return new ProjectionHub({ projections });
  }
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @klay/core exec vitest run src/contexts/source-knowledge/source/domain/__tests__/ProjectionHub.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/core/src/contexts/source-knowledge/
git commit -m "feat(source-knowledge): add ProjectionHub value object"
```

---

### Task 1.2: SourceKnowledge aggregate

**Files:**
- Create: `packages/core/src/contexts/source-knowledge/source/domain/SourceKnowledge.ts`
- Create: `packages/core/src/contexts/source-knowledge/source/domain/SourceKnowledgeId.ts`
- Test: `packages/core/src/contexts/source-knowledge/source/domain/__tests__/SourceKnowledge.test.ts`

**Context:** This is the source-knowledge context's representation of a Source. It wraps the sourceId (from source-ingestion) with its ProjectionHub. It is NOT the same entity as `source-ingestion/Source` — each bounded context has its own model.

**Step 1: Write the failing test**

```typescript
import { describe, it, expect } from "vitest";
import { SourceKnowledge } from "../SourceKnowledge";
import { SourceKnowledgeId } from "../SourceKnowledgeId";

describe("SourceKnowledge", () => {
  const defaultParams = {
    id: SourceKnowledgeId.create("sk-1"),
    sourceId: "source-1",
    contentHash: "hash-abc",
    defaultProfileId: "profile-default",
  };

  it("creates with empty hub and pending default projection", () => {
    const sk = SourceKnowledge.create(defaultParams);
    expect(sk.sourceId).toBe("source-1");
    expect(sk.contentHash).toBe("hash-abc");
    expect(sk.hub.projections).toHaveLength(0);
    expect(sk.defaultProfileId).toBe("profile-default");
    expect(sk.domainEvents).toHaveLength(1);
    expect(sk.domainEvents[0].eventType).toBe("SourceKnowledgeCreated");
  });

  it("registers a completed projection in hub", () => {
    const sk = SourceKnowledge.create(defaultParams);
    sk.registerProjection({
      projectionId: "proj-1",
      profileId: "profile-default",
      status: "COMPLETED",
    });
    expect(sk.hub.hasProjectionForProfile("profile-default")).toBe(true);
    expect(sk.domainEvents.some((e) => e.eventType === "ProjectionRegistered")).toBe(true);
  });

  it("checks if a profile requirement is satisfied", () => {
    const sk = SourceKnowledge.create(defaultParams);
    expect(sk.satisfiesProfile("profile-default")).toBe(false);
    sk.registerProjection({
      projectionId: "proj-1",
      profileId: "profile-default",
      status: "COMPLETED",
    });
    expect(sk.satisfiesProfile("profile-default")).toBe(true);
  });

  it("only satisfies profile when projection is COMPLETED", () => {
    const sk = SourceKnowledge.create(defaultParams);
    sk.registerProjection({
      projectionId: "proj-1",
      profileId: "profile-default",
      status: "PENDING",
    });
    expect(sk.satisfiesProfile("profile-default")).toBe(false);
  });

  it("reconstitutes from persistence", () => {
    const sk = SourceKnowledge.reconstitute({
      id: SourceKnowledgeId.create("sk-1"),
      sourceId: "source-1",
      contentHash: "hash-abc",
      defaultProfileId: "profile-default",
      hub: [{ projectionId: "proj-1", profileId: "profile-default", status: "COMPLETED", generatedAt: new Date() }],
      createdAt: new Date(),
    });
    expect(sk.hub.hasProjectionForProfile("profile-default")).toBe(true);
    expect(sk.domainEvents).toHaveLength(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @klay/core exec vitest run src/contexts/source-knowledge/source/domain/__tests__/SourceKnowledge.test.ts`
Expected: FAIL

**Step 3: Write SourceKnowledgeId**

```typescript
// SourceKnowledgeId.ts
import { UniqueId } from "../../../../shared/domain/UniqueId";

export class SourceKnowledgeId extends UniqueId {
  static create(value: string): SourceKnowledgeId {
    if (!value) throw new Error("SourceKnowledgeId cannot be empty");
    return new SourceKnowledgeId(value);
  }
}
```

**Step 4: Write SourceKnowledge aggregate**

```typescript
// SourceKnowledge.ts
import { AggregateRoot } from "../../../../shared/domain/AggregateRoot";
import { SourceKnowledgeId } from "./SourceKnowledgeId";
import { ProjectionHub } from "./ProjectionHub";

interface CreateParams {
  id: SourceKnowledgeId;
  sourceId: string;
  contentHash: string;
  defaultProfileId: string;
}

interface ReconstituteParams {
  id: SourceKnowledgeId;
  sourceId: string;
  contentHash: string;
  defaultProfileId: string;
  hub: Array<{ projectionId: string; profileId: string; status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED"; generatedAt: Date }>;
  createdAt: Date;
}

interface RegisterProjectionParams {
  projectionId: string;
  profileId: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
}

export class SourceKnowledge extends AggregateRoot<SourceKnowledgeId> {
  private _sourceId: string;
  private _contentHash: string;
  private _defaultProfileId: string;
  private _hub: ProjectionHub;
  private _createdAt: Date;

  private constructor(
    id: SourceKnowledgeId,
    sourceId: string,
    contentHash: string,
    defaultProfileId: string,
    hub: ProjectionHub,
    createdAt: Date,
  ) {
    super(id);
    this._sourceId = sourceId;
    this._contentHash = contentHash;
    this._defaultProfileId = defaultProfileId;
    this._hub = hub;
    this._createdAt = createdAt;
  }

  get sourceId(): string { return this._sourceId; }
  get contentHash(): string { return this._contentHash; }
  get defaultProfileId(): string { return this._defaultProfileId; }
  get hub(): ProjectionHub { return this._hub; }
  get createdAt(): Date { return this._createdAt; }

  satisfiesProfile(profileId: string): boolean {
    const entry = this._hub.getProjectionForProfile(profileId);
    return entry !== undefined && entry.status === "COMPLETED";
  }

  registerProjection(params: RegisterProjectionParams): void {
    this._hub = this._hub.withProjection({
      ...params,
      generatedAt: new Date(),
    });
    this.record({
      eventType: "ProjectionRegistered",
      payload: {
        sourceKnowledgeId: this.id.value,
        sourceId: this._sourceId,
        projectionId: params.projectionId,
        profileId: params.profileId,
        status: params.status,
      },
    });
  }

  static create(params: CreateParams): SourceKnowledge {
    const sk = new SourceKnowledge(
      params.id,
      params.sourceId,
      params.contentHash,
      params.defaultProfileId,
      ProjectionHub.create(),
      new Date(),
    );
    sk.record({
      eventType: "SourceKnowledgeCreated",
      payload: {
        id: params.id.value,
        sourceId: params.sourceId,
        contentHash: params.contentHash,
        defaultProfileId: params.defaultProfileId,
      },
    });
    return sk;
  }

  static reconstitute(params: ReconstituteParams): SourceKnowledge {
    return new SourceKnowledge(
      params.id,
      params.sourceId,
      params.contentHash,
      params.defaultProfileId,
      ProjectionHub.reconstitute(params.hub),
      params.createdAt,
    );
  }
}
```

**Step 5: Run test to verify it passes**

Run: `pnpm --filter @klay/core exec vitest run src/contexts/source-knowledge/source/domain/__tests__/SourceKnowledge.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add packages/core/src/contexts/source-knowledge/
git commit -m "feat(source-knowledge): add SourceKnowledge aggregate with ProjectionHub"
```

---

### Task 1.3: SourceKnowledgeRepository port and InMemory implementation

**Files:**
- Create: `packages/core/src/contexts/source-knowledge/source/domain/SourceKnowledgeRepository.ts`
- Create: `packages/core/src/contexts/source-knowledge/source/infrastructure/InMemorySourceKnowledgeRepository.ts`
- Test: `packages/core/src/contexts/source-knowledge/source/infrastructure/__tests__/InMemorySourceKnowledgeRepository.test.ts`

**Step 1: Write the repository port**

```typescript
// SourceKnowledgeRepository.ts
import { Repository } from "../../../../shared/domain/Repository";
import { SourceKnowledge } from "./SourceKnowledge";
import { SourceKnowledgeId } from "./SourceKnowledgeId";

export interface SourceKnowledgeRepository extends Repository<SourceKnowledge, SourceKnowledgeId> {
  findBySourceId(sourceId: string): Promise<SourceKnowledge | null>;
  findByProfileId(profileId: string): Promise<SourceKnowledge[]>;
  exists(id: SourceKnowledgeId): Promise<boolean>;
}
```

**Step 2: Write failing test for InMemory implementation**

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { InMemorySourceKnowledgeRepository } from "../InMemorySourceKnowledgeRepository";
import { SourceKnowledge } from "../../domain/SourceKnowledge";
import { SourceKnowledgeId } from "../../domain/SourceKnowledgeId";

describe("InMemorySourceKnowledgeRepository", () => {
  let repo: InMemorySourceKnowledgeRepository;

  beforeEach(() => {
    repo = new InMemorySourceKnowledgeRepository();
  });

  const createSK = (id: string, sourceId: string) =>
    SourceKnowledge.create({
      id: SourceKnowledgeId.create(id),
      sourceId,
      contentHash: "hash-1",
      defaultProfileId: "profile-1",
    });

  it("saves and finds by id", async () => {
    const sk = createSK("sk-1", "source-1");
    await repo.save(sk);
    const found = await repo.findById(SourceKnowledgeId.create("sk-1"));
    expect(found).not.toBeNull();
    expect(found!.sourceId).toBe("source-1");
  });

  it("finds by sourceId", async () => {
    const sk = createSK("sk-1", "source-1");
    await repo.save(sk);
    const found = await repo.findBySourceId("source-1");
    expect(found).not.toBeNull();
    expect(found!.id.value).toBe("sk-1");
  });

  it("returns null for non-existent sourceId", async () => {
    const found = await repo.findBySourceId("nonexistent");
    expect(found).toBeNull();
  });

  it("checks existence", async () => {
    const sk = createSK("sk-1", "source-1");
    await repo.save(sk);
    expect(await repo.exists(SourceKnowledgeId.create("sk-1"))).toBe(true);
    expect(await repo.exists(SourceKnowledgeId.create("sk-2"))).toBe(false);
  });

  it("deletes", async () => {
    const sk = createSK("sk-1", "source-1");
    await repo.save(sk);
    await repo.delete(SourceKnowledgeId.create("sk-1"));
    expect(await repo.findById(SourceKnowledgeId.create("sk-1"))).toBeNull();
  });
});
```

**Step 3: Run test to verify it fails**

Run: `pnpm --filter @klay/core exec vitest run src/contexts/source-knowledge/source/infrastructure/__tests__/InMemorySourceKnowledgeRepository.test.ts`
Expected: FAIL

**Step 4: Write InMemory implementation**

Follow the existing pattern from `InMemorySemanticUnitRepository` or similar InMemory repos in the project. Use a `Map<string, SourceKnowledge>` internally.

**Step 5: Run test to verify it passes**

**Step 6: Commit**

```bash
git add packages/core/src/contexts/source-knowledge/
git commit -m "feat(source-knowledge): add SourceKnowledgeRepository port and InMemory impl"
```

---

### Task 1.4: SourceKnowledgeService

**Files:**
- Create: `packages/core/src/contexts/source-knowledge/service/SourceKnowledgeService.ts`
- Test: `packages/core/src/contexts/source-knowledge/service/__tests__/SourceKnowledgeService.test.ts`

**Context:** Public API of the source-knowledge bounded context. Operations: create source knowledge (on source registration), register projection, check profile satisfaction, get hub for source.

**Step 1: Write failing tests**

Test cases:
- `createSourceKnowledge` — creates and saves SourceKnowledge, returns Result.ok
- `registerProjection` — finds by sourceId, registers projection, saves
- `satisfiesProfile` — checks if source has completed projection for profile
- `getBySourceId` — returns SourceKnowledge or NotFoundError
- `ensureProfileSatisfied` — if already satisfied returns ok, if not returns indicator that processing is needed

**Step 2: Implement service following existing service patterns** (constructor takes resolved modules, returns Result<Error, T>)

**Step 3: Run tests, verify pass**

**Step 4: Commit**

```bash
git add packages/core/src/contexts/source-knowledge/
git commit -m "feat(source-knowledge): add SourceKnowledgeService"
```

---

### Task 1.5: Factory and context composition

**Files:**
- Create: `packages/core/src/contexts/source-knowledge/composition/factory.ts`
- Create: `packages/core/src/contexts/source-knowledge/index.ts`

**Context:** Follow existing factory pattern (see `packages/core/src/contexts/source-ingestion/composition/factory.ts`). Wire repository and event publisher. Export public API from index.

**Step 1: Write factory**

```typescript
export interface SourceKnowledgeModules {
  sourceKnowledgeRepository: SourceKnowledgeRepository;
  sourceKnowledgeEventPublisher: EventPublisher;
}

export type ResolvedSourceKnowledgeModules = SourceKnowledgeModules;

export function createSourceKnowledgeContext(modules: SourceKnowledgeModules) {
  return {
    service: new SourceKnowledgeService(modules),
  };
}
```

**Step 2: Write index.ts exports** — export domain types, service, factory

**Step 3: Commit**

```bash
git add packages/core/src/contexts/source-knowledge/
git commit -m "feat(source-knowledge): add factory and context exports"
```

---

## Phase 2: Decouple Projections from SemanticUnit

### Task 2.1: Make SemanticProjection sourceId-primary

**Files:**
- Modify: `packages/core/src/contexts/semantic-processing/projection/domain/SemanticProjection.ts`
- Modify: `packages/core/src/contexts/semantic-processing/projection/domain/SemanticProjectionRepository.ts`
- Modify related tests

**Changes:**
- `semanticUnitId` → remove (or make optional/deprecated for migration)
- `sourceId` → make required (currently nullable)
- Add `processingProfileId: string` field to SemanticProjection
- `create()` factory: require `sourceId` and `processingProfileId`, remove `semanticUnitId` requirement
- Update repository: add `findBySourceIdAndProfileId(sourceId, profileId)`, remove/deprecate `findBySemanticUnitId`

**Step 1: Update tests to reflect new API** (sourceId required, semanticUnitId removed)

**Step 2: Update SemanticProjection entity**

**Step 3: Update SemanticProjectionRepository port**

**Step 4: Update InMemory implementation**

**Step 5: Run all semantic-processing tests**

Run: `pnpm --filter @klay/core exec vitest run src/contexts/semantic-processing/`
Expected: PASS (after updating tests)

**Step 6: Commit**

```bash
git commit -m "refactor(semantic-processing): decouple SemanticProjection from SemanticUnit, anchor to sourceId"
```

---

### Task 2.2: Update SemanticProcessingService

**Files:**
- Modify: `packages/core/src/contexts/semantic-processing/service/SemanticProcessingService.ts`
- Modify related tests

**Changes:**
- `processContent` params: replace `semanticUnitId`/`semanticUnitVersion` with `sourceId`
- Add `processingProfileId` to projection creation
- `batchProcess` — same parameter changes

**Step 1: Update service tests**

**Step 2: Update service implementation**

**Step 3: Run tests**

Run: `pnpm --filter @klay/core exec vitest run src/contexts/semantic-processing/`
Expected: PASS

**Step 4: Commit**

```bash
git commit -m "refactor(semantic-processing): update service to use sourceId instead of semanticUnitId"
```

---

## Phase 3: Rename `semantic-knowledge` → `context-management`

### Task 3.1: Create Context aggregate (new version of SemanticUnit)

**Files:**
- Create: `packages/core/src/contexts/context-management/context/domain/Context.ts`
- Create: `packages/core/src/contexts/context-management/context/domain/ContextId.ts`
- Create: `packages/core/src/contexts/context-management/context/domain/ContextVersion.ts`
- Create: `packages/core/src/contexts/context-management/context/domain/ContextSource.ts`
- Create: `packages/core/src/contexts/context-management/context/domain/ContextState.ts`
- Test: `packages/core/src/contexts/context-management/context/domain/__tests__/Context.test.ts`

**Context:** Context is the simplified successor to SemanticUnit. Key differences:
- Has `requiredProfileId` (declares which projection profile all sources must satisfy)
- `ContextSource` is a lightweight reference (sourceId, sourceKnowledgeId, addedAt) — no extracted content
- `ContextVersion` tracks source add/remove history only
- State machine reused from SemanticState (Draft → Active → Deprecated → Archived)

**Step 1: Write failing tests**

Test cases:
- Creates in Draft state with requiredProfileId
- Adds source reference (emits ContextSourceAdded + ContextVersioned)
- Removes source reference (must leave at least 1)
- Versions track source add/remove
- Activate, deprecate, archive state transitions
- Rollback to previous version

**Step 2: Implement ContextId, ContextState, ContextSource, ContextVersion value objects**

**Step 3: Implement Context aggregate**

**Step 4: Run tests, verify pass**

**Step 5: Commit**

```bash
git commit -m "feat(context-management): add Context aggregate replacing SemanticUnit"
```

---

### Task 3.2: ContextRepository, InMemory impl, and ContextManagementService

**Files:**
- Create: `packages/core/src/contexts/context-management/context/domain/ContextRepository.ts`
- Create: `packages/core/src/contexts/context-management/context/infrastructure/InMemoryContextRepository.ts`
- Create: `packages/core/src/contexts/context-management/service/ContextManagementService.ts`
- Tests for each

**Context:** Service operations:
- `createContext(id, name, description, language, requiredProfileId, createdBy)`
- `addSourceToContext(contextId, sourceId, sourceKnowledgeId)` — verifies profile satisfaction before adding
- `removeSourceFromContext(contextId, sourceId)`
- `rollbackContext(contextId, targetVersion)`
- `deprecateContext(contextId, reason)`

**Important:** `addSourceToContext` needs to verify the source's hub has a completed projection for the context's `requiredProfileId`. This is a cross-context check. The service should accept a `profileSatisfied: boolean` parameter (checked by the orchestrator) rather than reaching into source-knowledge directly — preserving bounded context isolation.

**Step 1-5: TDD cycle**

**Step 6: Commit**

```bash
git commit -m "feat(context-management): add ContextRepository, InMemory impl, and service"
```

---

### Task 3.3: Factory, composition, and exports

**Files:**
- Create: `packages/core/src/contexts/context-management/composition/factory.ts`
- Create: `packages/core/src/contexts/context-management/index.ts`

**Step 1: Wire factory following existing pattern**

**Step 2: Export public API**

**Step 3: Commit**

```bash
git commit -m "feat(context-management): add factory and context exports"
```

---

### Task 3.4: Migrate lineage sub-domain

**Files:**
- Copy: `packages/core/src/contexts/semantic-knowledge/lineage/` → `packages/core/src/contexts/context-management/lineage/`
- Update references from SemanticUnit to Context

**Context:** Lineage tracks relationships between contexts (formerly between semantic units). The domain model stays the same — just rename references.

**Step 1: Copy lineage directory**

**Step 2: Update imports and references**

**Step 3: Run tests**

**Step 4: Commit**

```bash
git commit -m "refactor(context-management): migrate lineage sub-domain from semantic-knowledge"
```

---

## Phase 4: Update Application Layer (Orchestrators)

### Task 4.1: Update KnowledgePipelineOrchestrator

**Files:**
- Modify: `packages/core/src/application/knowledge-pipeline/application/KnowledgePipelineOrchestrator.ts`
- Modify: `packages/core/src/application/knowledge-pipeline/contracts/dtos.ts`
- Modify: `packages/core/src/application/knowledge-pipeline/contracts/KnowledgePipelinePort.ts`
- Modify related tests

**Changes:**
- Add `sourceKnowledge` dependency (SourceKnowledgeService)
- `execute()` new flow:
  1. Ingest source (source-ingestion)
  2. Create SourceKnowledge with hub (source-knowledge)
  3. Process with default profile (semantic-processing)
  4. Register projection in hub (source-knowledge)
  5. Optionally link to Context (context-management) — checking profile satisfaction
- `processDocument()` → now takes sourceId instead of semanticUnitId
- Update DTOs to reflect new parameter names

**Step 1: Update tests**

**Step 2: Update orchestrator**

**Step 3: Run pipeline tests**

Run: `pnpm --filter @klay/core exec vitest run src/application/knowledge-pipeline/`
Expected: PASS

**Step 4: Commit**

```bash
git commit -m "refactor(pipeline): update orchestrator for source-centric projection model"
```

---

### Task 4.2: Update KnowledgeManagementOrchestrator

**Files:**
- Modify: `packages/core/src/application/knowledge-management/`

**Changes:**
- Update `IngestAndAddSource` use case: now creates SourceKnowledge, processes, then adds to Context
- Replace SemanticUnit references with Context

**Step 1-4: TDD cycle + Commit**

```bash
git commit -m "refactor(management): update orchestrator for Context model"
```

---

### Task 4.3: Update KnowledgeLifecycleOrchestrator

**Files:**
- Modify: `packages/core/src/application/knowledge-lifecycle/`

**Changes:**
- Replace SemanticUnit references with Context
- Update lifecycle operations (deprecate, archive, rollback) to use ContextManagementService

**Step 1-4: TDD cycle + Commit**

```bash
git commit -m "refactor(lifecycle): update orchestrator for Context model"
```

---

### Task 4.4: Update ContentManifest and factory wiring

**Files:**
- Modify: `packages/core/src/application/knowledge-pipeline/domain/ContentManifest.ts`
- Modify: `packages/core/src/application/composition/knowledge-platform.factory.ts`

**Changes:**
- ContentManifest: replace `semanticUnitId` with `contextId` (optional — source can exist without context), add `sourceKnowledgeId`
- Factory: wire source-knowledge context into platform composition

**Step 1-4: TDD cycle + Commit**

```bash
git commit -m "refactor(pipeline): update ContentManifest and platform factory wiring"
```

---

## Phase 5: Update Adapters

### Task 5.1: Update REST adapters

**Files:**
- Modify: `packages/core/src/adapters/rest/KnowledgePipelineRESTAdapter.ts`
- Modify: `packages/core/src/adapters/rest/KnowledgeManagementRESTAdapter.ts`
- Modify: `packages/core/src/adapters/rest/KnowledgeLifecycleRESTAdapter.ts`

**Changes:**
- Update parameter names (semanticUnitId → contextId where applicable)
- Add new endpoints for source-knowledge operations (get hub, list projections by source)
- Update response shapes

**Step 1-4: Update + Commit**

```bash
git commit -m "refactor(adapters): update REST adapters for new domain model"
```

---

### Task 5.2: Update UI adapters

**Files:**
- Modify: `packages/core/src/adapters/ui/KnowledgePipelineUIAdapter.ts`
- Modify: `packages/core/src/adapters/ui/KnowledgeManagementUIAdapter.ts`
- Modify: `packages/core/src/adapters/ui/KnowledgeLifecycleUIAdapter.ts`

**Changes:** Same as REST — update parameter names and expose source-knowledge operations.

**Step 1-4: Update + Commit**

```bash
git commit -m "refactor(adapters): update UI adapters for new domain model"
```

---

## Phase 6: Cleanup and Migration

### Task 6.1: Remove old semantic-knowledge context

**Files:**
- Delete: `packages/core/src/contexts/semantic-knowledge/` (entire directory)

**Precondition:** All references migrated to context-management. Run full test suite first.

**Step 1: Run full test suite**

Run: `pnpm --filter @klay/core test`
Expected: All tests pass

**Step 2: Delete old directory**

**Step 3: Run full test suite again**

**Step 4: Commit**

```bash
git commit -m "cleanup: remove old semantic-knowledge context (replaced by context-management)"
```

---

### Task 6.2: Update package exports and index files

**Files:**
- Modify: `packages/core/src/index.ts` (or wherever public API is exported)
- Modify: any barrel exports referencing old context names

**Changes:** Export new contexts, remove old exports.

**Step 1-3: Update + test + Commit**

```bash
git commit -m "refactor: update package exports for new bounded context structure"
```

---

### Task 6.3: Update documentation

**Files:**
- Modify: `packages/core/src/.claude/CLAUDE.md`
- Modify: `.claude/CLAUDE.md`
- Modify: `docs/plans/2026-03-03-domain-restructure-design.md` (mark as implemented)

**Changes:** Update bounded context descriptions, entity relationships, conventions.

**Step 1: Update docs**

**Step 2: Commit**

```bash
git commit -m "docs: update architecture docs for domain restructure"
```

---

## Phase 7 (deferred): Web Dashboard Updates

> The web dashboard (`apps/web`) will need updates to reflect the new domain model (Context instead of SemanticUnit, source-centric projection views). This is deferred as a separate change since the core domain should stabilize first.

---

## Summary

| Phase | Tasks | Focus |
|-------|-------|-------|
| 1 | 1.1–1.5 | New `source-knowledge` bounded context |
| 2 | 2.1–2.2 | Decouple projections from SemanticUnit |
| 3 | 3.1–3.4 | Create `context-management` (rename + simplify) |
| 4 | 4.1–4.4 | Update orchestrators and pipeline |
| 5 | 5.1–5.2 | Update REST and UI adapters |
| 6 | 6.1–6.3 | Cleanup old code + update docs |
| 7 | deferred | Web dashboard |

**Total:** ~18 tasks, ~6 phases active
**Estimated commits:** ~18 atomic commits
**Test strategy:** TDD — write tests first for new code, update existing tests for modified code, full suite pass before cleanup
