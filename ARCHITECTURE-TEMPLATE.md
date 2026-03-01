# Architecture Document -- Template

> This document defines the **how** -- the technical structure that realizes your domain model.
> Fill it AFTER completing your Domain Map and PRD.
>
> Pipeline: **DOMAIN-MAPPING-TEMPLATE.md** --> **PRD-TEMPLATE.md** --> **this document**

---

## 1. Architecture Profile

| Field                  | Value                                                  |
| ---------------------- | ------------------------------------------------------ |
| **Project**            | {project-name}                                         |
| **Domain**             | {one-line domain description}                          |
| **Current Level**      | Starter / Growing / Standard (see Section 5)           |
| **Scale Target**       | {expected users, data volume, request rate}             |
| **Runtime Targets**    | {server / browser / edge / mobile / multi-runtime}     |
| **Bounded Contexts**   | {count} -- {list names}                                |
| **Domain Map**         | See `DOMAIN-MAPPING-TEMPLATE.md`                       |
| **PRD**                | See `PRD-TEMPLATE.md`                                  |
| **Repository**         | {repo URL}                                             |
| **Last Updated**       | {date}                                                 |

---

## 2. Architectural Principles

These five principles apply at every level and every layer. They are non-negotiable.

### 2.1 Dependency Rule

Dependencies point **inward** only. Outer layers depend on inner layers, never the reverse.

```
  Composition / Adapters
       |
  Application (orchestrators)
       |
  Context Service (public API)
       |
  Module: infrastructure --> application --> domain
                                               ^
                                          (innermost)
```

Domain has zero knowledge of infrastructure, frameworks, or delivery mechanisms.

### 2.2 Port Isolation

The domain defines **interfaces** (ports). Infrastructure **implements** them (adapters).

```
domain/ports/                         infrastructure/
  ContentExtractor.ts   <---impl---     PdfContentExtractor.ts
  Repository.ts         <---impl---     NeDBRepository.ts
```

Ports live in `domain/`. Implementations live in `infrastructure/`. The domain never imports from `infrastructure/`.

### 2.3 Composition over Inheritance

Favor composing behaviors from small, focused units rather than building deep class hierarchies. The one exception is the shared kernel base classes (`Entity`, `AggregateRoot`, `ValueObject`) which provide a thin, stable foundation.

### 2.4 Result-Based Error Handling

Domain operations return `Result<E, T>` instead of throwing exceptions.

```typescript
// Good -- explicit error channel
createUser(data: UserData): Result<ValidationError, User>

// Bad -- hidden control flow
createUser(data: UserData): User  // throws somewhere inside
```

Exceptions are reserved for truly exceptional circumstances (out of memory, network failure at infrastructure boundary). All domain and application errors flow through `Result`.

### 2.5 Make Illegal States Unrepresentable

Use factory methods, frozen objects, and state machines to guarantee that if an object exists, it is valid.

```typescript
// Good -- factory validates before creating
const result = Email.create("user@example.com");  // Result<ValidationError, Email>

// Bad -- public constructor allows invalid state
const email = new Email("not-an-email");  // no validation, object exists in invalid state
```

Aggregates expose static factory methods (`.create()`) and hide constructors. Value objects freeze themselves after creation. State transitions are explicit methods that enforce invariants.

---

## 3. Shared Kernel -- DDD Building Blocks

The shared kernel contains the tactical patterns every bounded context depends on. These live in `src/shared/` and are the **only** cross-cutting code in the system.

> Code examples use TypeScript-style pseudocode but the patterns are language-agnostic.

### 3.1 ValueObject\<T\>

Immutable, value-based equality. Two ValueObjects are equal if their inner values are equal.

```typescript
abstract class ValueObject<T> {
  protected readonly props: Readonly<T>;

  protected constructor(props: T) {
    this.props = Object.freeze(props);
  }

  equals(other: ValueObject<T>): boolean {
    if (other === null || other === undefined) return false;
    return JSON.stringify(this.props) === JSON.stringify(other.props);
  }
}
```

**Usage**: Email, Money, DateRange, Address -- any concept defined by its attributes, not identity.

### 3.2 UniqueId

A ValueObject wrapping a string identifier. Used as the identity type for entities and aggregates.

```typescript
class UniqueId extends ValueObject<{ value: string }> {
  get value(): string {
    return this.props.value;
  }

  static create(value?: string): UniqueId {
    return new UniqueId({ value: value ?? generateUUID() });
  }

  equals(other: UniqueId): boolean {
    return this.value === other.value;
  }
}
```

### 3.3 Entity\<Id\>

Identity-based equality, mutable state. Two entities are the same if they share the same ID, regardless of attribute values.

```typescript
abstract class Entity<Id extends UniqueId> {
  protected readonly _id: Id;

  protected constructor(id: Id) {
    this._id = id;
  }

  get id(): Id {
    return this._id;
  }

  equals(other: Entity<Id>): boolean {
    if (other === null || other === undefined) return false;
    return this._id.equals(other._id);
  }
}
```

### 3.4 AggregateRoot\<Id\>

Extends Entity. Adds domain event recording and defines the transactional boundary.

```typescript
abstract class AggregateRoot<Id extends UniqueId> extends Entity<Id> {
  private _domainEvents: DomainEvent[] = [];

  get domainEvents(): ReadonlyArray<DomainEvent> {
    return [...this._domainEvents];
  }

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  clearEvents(): DomainEvent[] {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }
}
```

**Rules**:
- One aggregate = one transactional boundary
- External code references aggregates by ID only
- Only the aggregate root can modify its internal entities
- Factory methods (`.create()`) enforce invariants at construction

### 3.5 DomainEvent

Immutable record of something that happened in the domain.

```typescript
interface DomainEvent {
  readonly type: string;           // e.g. "UserRegistered"
  readonly aggregateId: string;    // ID of the aggregate that emitted it
  readonly occurredOn: Date;       // timestamp
  readonly payload: Readonly<Record<string, unknown>>;
}
```

### 3.6 EventPublisher

Port for publishing domain events. Infrastructure provides the implementation.

```typescript
interface EventPublisher {
  publish(event: DomainEvent): Promise<void>;
  publishAll(events: DomainEvent[]): Promise<void>;
}
```

### 3.7 Result\<E, T\>

Railway-oriented error handling. Every domain operation returns success or failure explicitly.

```typescript
type Result<E, T> = Ok<T> | Fail<E>;

class Ok<T> {
  readonly isOk = true;
  readonly isFail = false;
  constructor(readonly value: T) {}

  map<U>(fn: (v: T) => U): Result<never, U> {
    return new Ok(fn(this.value));
  }

  flatMap<E2, U>(fn: (v: T) => Result<E2, U>): Result<E2, U> {
    return fn(this.value);
  }

  match<R>(handlers: { ok: (v: T) => R; fail: (e: never) => R }): R {
    return handlers.ok(this.value);
  }
}

class Fail<E> {
  readonly isOk = false;
  readonly isFail = true;
  constructor(readonly error: E) {}

  map<U>(_fn: (v: never) => U): Result<E, U> {
    return this as unknown as Result<E, U>;
  }

  flatMap<E2, U>(_fn: (v: never) => Result<E2, U>): Result<E | E2, U> {
    return this as unknown as Result<E | E2, U>;
  }

  match<R>(handlers: { ok: (v: never) => R; fail: (e: E) => R }): R {
    return handlers.fail(this.error);
  }
}

// Helper constructors
const ok = <T>(value: T): Result<never, T> => new Ok(value);
const fail = <E>(error: E): Result<E, never> => new Fail(error);
```

### 3.8 DomainError Hierarchy

Structured errors with code, message, and context.

```typescript
abstract class DomainError {
  readonly code: string;
  readonly message: string;
  readonly timestamp: Date;
  readonly context: Record<string, unknown>;

  protected constructor(code: string, message: string, context?: Record<string, unknown>) {
    this.code = code;
    this.message = message;
    this.timestamp = new Date();
    this.context = context ?? {};
  }
}

class NotFoundError extends DomainError {
  constructor(entityType: string, id: string) {
    super("NOT_FOUND", `${entityType} with id ${id} not found`, { entityType, id });
  }
}

class ValidationError extends DomainError {
  constructor(field: string, reason: string) {
    super("VALIDATION", `Invalid ${field}: ${reason}`, { field, reason });
  }
}

class InvalidStateError extends DomainError {
  constructor(entity: string, currentState: string, attemptedAction: string) {
    super("INVALID_STATE",
      `Cannot ${attemptedAction} on ${entity} in state ${currentState}`,
      { entity, currentState, attemptedAction }
    );
  }
}

class OperationError extends DomainError {
  constructor(operation: string, reason: string) {
    super("OPERATION_FAILED", `${operation} failed: ${reason}`, { operation, reason });
  }
}
```

### 3.9 Repository\<T, Id\>

Minimal persistence port. Defined in domain, implemented in infrastructure.

```typescript
interface Repository<T extends AggregateRoot<Id>, Id extends UniqueId> {
  save(aggregate: T): Promise<Result<OperationError, void>>;
  findById(id: Id): Promise<Result<NotFoundError, T>>;
  delete(id: Id): Promise<Result<OperationError, void>>;
}
```

Repositories return `Result` -- they do not throw. Concrete implementations (InMemory, NeDB, IndexedDB, PostgreSQL) live in `infrastructure/`.

---

## 4. Bounded Context Internal Structure

Every bounded context -- at any architecture level -- follows this internal structure. A context is a self-contained vertical slice with its own domain, application, infrastructure, and a single public API surface.

### 4.1 Module Layout

A context contains one or more **modules**. Each module groups a cohesive set of domain concepts.

```
contexts/{context-name}/
  {module-a}/
    domain/              # Entities, VOs, events, domain errors, ports (interfaces)
    application/         # Use cases (single operation each)
    infrastructure/      # Repository impls, adapter impls, mappers
  {module-b}/
    domain/
    application/
    infrastructure/
  service/               # Context's PUBLIC API -- single entry point
    {ContextName}Service.ts
  composition/           # Factory that wires the context
    create{ContextName}Service.ts
    {ContextName}ServicePolicy.ts
```

### 4.2 Service Pattern

The **service** is the context's public boundary. All external consumers interact with the context through this single class. It delegates to internal use cases.

```typescript
// contexts/source-ingestion/service/SourceIngestionService.ts

class SourceIngestionService {
  constructor(
    private readonly registerSourceUseCase: RegisterSourceUseCase,
    private readonly extractContentUseCase: ExtractContentUseCase,
    // ... other use cases
  ) {}

  registerSource(input: RegisterSourceInput): Promise<Result<DomainError, SourceDTO>> {
    return this.registerSourceUseCase.execute(input);
  }

  extractContent(sourceId: string): Promise<Result<DomainError, ExtractionResultDTO>> {
    return this.extractContentUseCase.execute(sourceId);
  }
}
```

### 4.3 Composition Factory

Each context has a factory that constructs its service with all dependencies resolved. The factory accepts a **policy** -- a plain object describing which implementations to use.

```typescript
// contexts/source-ingestion/composition/SourceIngestionServicePolicy.ts

interface SourceIngestionServicePolicy {
  sourceRepository: "in-memory" | "nedb" | "indexeddb";
  contentExtractor: "pdf-parse" | "cheerio" | "mock";
  resourceStorage: "filesystem" | "s3" | "mock";
}

// contexts/source-ingestion/composition/createSourceIngestionService.ts

function createSourceIngestionService(
  policy: SourceIngestionServicePolicy
): SourceIngestionService {
  const sourceRepo = resolveSourceRepository(policy.sourceRepository);
  const extractor = resolveContentExtractor(policy.contentExtractor);
  const storage = resolveResourceStorage(policy.resourceStorage);

  const registerUC = new RegisterSourceUseCase(sourceRepo, storage);
  const extractUC = new ExtractContentUseCase(sourceRepo, extractor);

  return new SourceIngestionService(registerUC, extractUC);
}
```

### 4.4 Dependency Rules Inside a Context

| Layer            | Can Import From                          | Cannot Import From    |
| ---------------- | ---------------------------------------- | --------------------- |
| `domain/`        | `shared/`                                | `application/`, `infrastructure/`, other contexts |
| `application/`   | `domain/`, `shared/`                     | `infrastructure/`, other contexts |
| `infrastructure/`| `domain/`, `application/`, `shared/`     | other contexts        |
| `service/`       | `application/`, `domain/`, `shared/`     | `infrastructure/`     |
| `composition/`   | everything within the context, `shared/` | other contexts        |

### 4.5 New Context Template

> Copy this and fill in the blanks when adding a new bounded context.

```
contexts/{context-name}/
  {primary-module}/
    domain/
      {AggregateRoot}.ts          # Main aggregate
      {ValueObject}.ts            # Key value objects
      {ContextName}Events.ts      # Domain events
      {ContextName}Errors.ts      # Domain-specific errors
      ports/
        {AggregateRoot}Repository.ts  # Repository port
        {PortName}.ts                 # Other ports
    application/
      {UseCaseName}UseCase.ts     # One file per use case
    infrastructure/
      {ImplName}Repository.ts     # Repository implementation
      {ImplName}Adapter.ts        # Port implementation
  service/
    {ContextName}Service.ts
  composition/
    create{ContextName}Service.ts
    {ContextName}ServicePolicy.ts
```

---

## 5. Progressive Layers

The core structural innovation. Your architecture grows in **three levels**, each adding structure only when complexity demands it. Start at Level 1. Promote when you hit a trigger.

---

### Level 1 -- Starter

**When**: 1 bounded context, MVP, simple SaaS, solo developer.

```
src/
  shared/                     # DDD building blocks (Section 3)
    ValueObject.ts
    Entity.ts
    AggregateRoot.ts
    UniqueId.ts
    Result.ts
    DomainError.ts
    Repository.ts
    DomainEvent.ts
    EventPublisher.ts
  contexts/
    {context}/                # Your single bounded context
      {module}/
        domain/
        application/
        infrastructure/
      service/                # Context's public API
      composition/            # Factory + policy
  composition/                # Root composition
    createApp.ts              #   resolves the single context
    AppPolicy.ts              #   root policy (delegates to context policy)
```

#### Dependency Rules -- Level 1

| Source                       | Can Import From                    |
| ---------------------------- | ---------------------------------- |
| `shared/`                    | nothing (leaf)                     |
| `contexts/{ctx}/domain/`     | `shared/`                          |
| `contexts/{ctx}/application/`| `shared/`, same context `domain/`  |
| `contexts/{ctx}/infrastructure/` | `shared/`, same context `domain/`, `application/` |
| `contexts/{ctx}/service/`    | same context `application/`, `domain/`, `shared/`  |
| `contexts/{ctx}/composition/`| everything within same context     |
| `composition/` (root)        | `contexts/{ctx}/composition/`      |

#### What's NOT here (and why)

- **No application layer** (root-level): Only 1 context, so there is nothing to orchestrate across.
- **No adapters layer**: Consumers (a UI, a CLI) import directly from the context service or root composition.
- **No platform layer**: Infrastructure lives inside the context's modules. Nothing is shared yet.

#### Trigger to Level 2

Promote when ANY of these become true:
- You need a **second bounded context** with its own domain model
- You need to **coordinate operations** across modules that feel like different domains
- You find yourself importing between what should be separate contexts

---

### Level 2 -- Growing

**When**: 2-3 bounded contexts, coordination needed across contexts.

```
src/
  shared/                     # DDD building blocks (unchanged)
  contexts/
    {context-1}/
      {module}/
        domain/
        application/
        infrastructure/
      service/
      composition/
    {context-2}/
      {module}/
        domain/
        application/
        infrastructure/
      service/
      composition/
  application/                # NEW -- cross-context orchestration
    {orchestrator-name}/
      contracts/              #   Port interface + input/output DTOs
      domain/                 #   Orchestration errors, tracking objects
      application/            #   Use cases that span contexts
      composition/            #   Orchestrator factory
  composition/                # Root composition
    createApp.ts              #   resolves all contexts + orchestrators
    AppPolicy.ts
```

#### What's New in Level 2

The **application layer** (root-level `application/`). This is where orchestrators live. An orchestrator coordinates operations across multiple context services.

```typescript
// application/knowledge-pipeline/application/IngestAndProcessUseCase.ts

class IngestAndProcessUseCase {
  constructor(
    private readonly ingestion: SourceIngestionService,
    private readonly knowledge: SemanticKnowledgeService,
    private readonly processing: SemanticProcessingService,
  ) {}

  async execute(input: IngestInput): Promise<Result<DomainError, ProcessingResult>> {
    const source = await this.ingestion.registerSource(input.sourceData);
    if (source.isFail) return source;

    const unit = await this.knowledge.addSourceToUnit(input.unitId, source.value.id);
    if (unit.isFail) return unit;

    return this.processing.processContent(unit.value.id, input.profileId);
  }
}
```

#### Orchestrator Internal Structure

```
application/{orchestrator-name}/
  contracts/
    {OrchestratorName}Port.ts         # Interface the orchestrator exposes
    {OrchestratorName}DTOs.ts         # Input/output data shapes
  domain/
    {OrchestratorName}Errors.ts       # Orchestration-specific errors
  application/
    {UseCaseName}UseCase.ts           # Cross-context use cases
  composition/
    create{OrchestratorName}.ts       # Factory
    {OrchestratorName}Policy.ts       # Policy type
```

#### Dependency Rules -- Level 2

| Source                       | Can Import From                                     |
| ---------------------------- | --------------------------------------------------- |
| `shared/`                    | nothing                                             |
| `contexts/{ctx}/*`           | same rules as Level 1 (self-contained)              |
| `application/{orch}/contracts/` | `shared/`                                        |
| `application/{orch}/domain/`    | `shared/`, same orchestrator `contracts/`         |
| `application/{orch}/application/` | `shared/`, `contexts/*/service/`, same orchestrator `contracts/`, `domain/` |
| `application/{orch}/composition/` | everything within same orchestrator, `contexts/*/composition/` |
| `composition/` (root)       | `contexts/*/composition/`, `application/*/composition/` |

**Key rule**: Orchestrators depend on context **services**, never on context internals. Contexts remain fully self-contained.

#### Trigger to Level 3

Promote when ANY of these become true:
- **Infrastructure sharing**: Multiple contexts need the same persistence engine, event bus, or config provider
- **External consumers**: A REST API, CLI, or separate UI app needs formal adapter contracts
- You find yourself duplicating infrastructure code across contexts

---

### Level 3 -- Standard

**When**: 4+ bounded contexts, production SaaS, multiple external consumers, shared infrastructure.

```
src/
  shared/                     # DDD building blocks (unchanged)
  platform/                   # NEW -- shared infrastructure (NO domain logic)
    config/                   #   Config providers (env vars, feature flags)
    persistence/              #   Store engines, repository base classes
    eventing/                 #   Event publisher/subscriber implementations
    {custom-infra}/           #   Vector stores, caching, blob storage, etc.
  contexts/
    {context-1..N}/
      {module}/
        domain/
        application/
        infrastructure/       #   Uses platform/ for shared infra
      service/
      composition/
  application/
    {orchestrator-1..N}/
      contracts/
      domain/
      application/
      composition/
  adapters/                   # NEW -- external integration layer
    rest/                     #   REST/GraphQL API
      routes/
      middleware/
      serialization/
    ui/                       #   UI adapter (if applicable)
      {framework}-components/
      view-models/
    cli/                      #   CLI adapter
      commands/
  composition/                # Root composition
    createApp.ts
    AppPolicy.ts
```

#### What's New in Level 3

**Platform layer** (`platform/`): Extracts shared infrastructure that multiple contexts depend on. This is pure infrastructure -- it contains ZERO domain logic.

```typescript
// platform/persistence/NeDBStoreEngine.ts

class NeDBStoreEngine {
  constructor(private readonly dbPath: string) {}

  createCollection<T>(name: string): NeDBCollection<T> { /* ... */ }
}

// contexts/source-ingestion/infrastructure/NeDBSourceRepository.ts
// Uses the shared engine from platform/

class NeDBSourceRepository implements SourceRepository {
  constructor(private readonly collection: NeDBCollection<SourceRecord>) {}

  async save(source: Source): Promise<Result<OperationError, void>> { /* ... */ }
}
```

**Adapters layer** (`adapters/`): Provides the integration layer for external consumers (REST APIs, browser UIs, CLIs). Adapters depend ONLY on `application/` contracts -- they never import from contexts directly.

```typescript
// adapters/rest/routes/pipelineRoutes.ts

function createPipelineRoutes(pipeline: KnowledgePipelinePort) {
  return {
    POST_ingest: async (req, res) => {
      const result = await pipeline.ingest(req.body);
      result.match({
        ok: (data) => res.status(201).json(data),
        fail: (err) => res.status(mapErrorCode(err)).json({ error: err.message }),
      });
    },
  };
}
```

#### Dependency Rules -- Level 3

| Source                       | Can Import From                                     |
| ---------------------------- | --------------------------------------------------- |
| `shared/`                    | nothing                                             |
| `platform/`                  | `shared/` (infrastructure, no domain)               |
| `contexts/{ctx}/domain/`     | `shared/`                                           |
| `contexts/{ctx}/infrastructure/` | `shared/`, `platform/`, same context `domain/`, `application/` |
| `contexts/{ctx}/service/`    | same context `application/`, `domain/`, `shared/`   |
| `contexts/{ctx}/composition/`| everything within same context, `platform/`         |
| `application/{orch}/*`       | same rules as Level 2                               |
| `adapters/`                  | `application/*/contracts/`, `shared/`               |
| `composition/` (root)        | everything except `domain/`, `infrastructure/` internals |

#### Full Dependency Diagram -- Level 3

```
                    +------------------+
                    |   composition/   |  <-- entry point, wires everything
                    +--------+---------+
                             |
          +------------------+------------------+
          |                  |                  |
  +-------v------+  +-------v-------+  +-------v-------+
  |   adapters/  |  | application/  |  |   platform/   |
  |  (REST, UI)  |  | (orchestrate) |  | (shared infra)|
  +-------+------+  +-------+-------+  +-------+-------+
          |                  |                  |
          |          +-------v-------+          |
          +--------->| contexts/     |<---------+
          (NEVER)    |   service/    |
                     +-------+-------+
                             |
                     +-------v-------+
                     |    shared/    |
                     +---------------+

  Arrows = "depends on" (points toward dependency)
  adapters/ NEVER imports from contexts/ directly
```

---

## 6. Composition Root Pattern

The composition root is the **single place** where all dependencies are resolved. No dependency injection framework needed -- just functions and plain objects.

### 6.1 Policy-Based Dependency Injection

A **policy** is a plain object that describes WHAT implementations to use, not HOW to wire them. Policies are declarative configuration.

```typescript
// composition/AppPolicy.ts

interface AppPolicy {
  environment: "test" | "development" | "production";
  persistence: "in-memory" | "nedb" | "indexeddb" | "postgresql";
  eventing: "in-memory" | "redis" | "kafka";
  features: {
    enableSearch: boolean;
    enableBatchProcessing: boolean;
  };
}
```

### 6.2 ProviderRegistry Pattern

A registry maps policy keys to factory functions. Contexts and platform modules register their implementations; the composition root resolves them.

```typescript
// composition/ProviderRegistry.ts

type ProviderFactory<T> = () => T;

class ProviderRegistry<T> {
  private providers = new Map<string, ProviderFactory<T>>();

  register(key: string, factory: ProviderFactory<T>): void {
    this.providers.set(key, factory);
  }

  resolve(key: string): T {
    const factory = this.providers.get(key);
    if (!factory) throw new Error(`No provider registered for key: ${key}`);
    return factory();
  }
}
```

### 6.3 Environment-Agnostic Wiring

The same domain code runs in different environments by swapping policies.

```typescript
// composition/createApp.ts

function createApp(policy: AppPolicy) {
  const ingestion = createSourceIngestionService({
    sourceRepository: policy.persistence,
    contentExtractor: policy.environment === "test" ? "mock" : "pdf-parse",
    resourceStorage: policy.environment === "test" ? "mock" : "filesystem",
  });

  const knowledge = createSemanticKnowledgeService({
    unitRepository: policy.persistence,
  });

  const pipeline = createKnowledgePipeline({
    ingestion,
    knowledge,
  });

  return { ingestion, knowledge, pipeline };
}
```

### 6.4 Per-Environment Policies

```typescript
// Test environment -- everything in-memory, no I/O
const testPolicy: AppPolicy = {
  environment: "test",
  persistence: "in-memory",
  eventing: "in-memory",
  features: { enableSearch: false, enableBatchProcessing: false },
};

// Server environment -- NeDB on disk, real extractors
const serverPolicy: AppPolicy = {
  environment: "production",
  persistence: "nedb",
  eventing: "redis",
  features: { enableSearch: true, enableBatchProcessing: true },
};

// Browser environment -- IndexedDB, no server-side features
const browserPolicy: AppPolicy = {
  environment: "production",
  persistence: "indexeddb",
  eventing: "in-memory",
  features: { enableSearch: true, enableBatchProcessing: false },
};
```

### 6.5 Factory Function Convention

All factories follow the same signature pattern:

```
create{Thing}(policy: {Thing}Policy): {ThingPort}
```

- Input: a policy object (plain data)
- Output: the public interface (port), never the concrete implementation
- The consumer has no knowledge of what was constructed behind the interface

---

## 7. Expansion Points Catalog

When you hit a growth point, follow the corresponding recipe below. Each entry tells you the **symptom**, the **action**, and the **structural change**.

### 7.1 When you need a second bounded context

**Symptom**: You have modules with different domain languages, different reasons to change, or different invariants that feel forced into one context.

**Action**:
1. Extract the new context following the template in Section 4.5
2. Each context gets its own `service/` and `composition/`
3. Remove any direct imports between the two contexts

**Structural change**: You are now at Level 2 (but may not need orchestrators yet if the contexts are independent).

### 7.2 When you need cross-context coordination

**Symptom**: A user operation requires calling multiple context services in sequence, with rollback or error handling logic that doesn't belong in any single context.

**Action**:
1. Create `src/application/{orchestrator-name}/` with the orchestrator structure
2. The orchestrator imports from context `service/` classes -- never from context internals
3. Define the orchestrator's own port (in `contracts/`) so adapters can depend on it

**Structural change**: Root-level `application/` directory added. Full Level 2.

### 7.3 When you need external API (REST, GraphQL, CLI)

**Symptom**: An external system or separate frontend needs to consume your domain over a protocol boundary.

**Action**:
1. Create `src/adapters/{type}/` (e.g., `adapters/rest/`)
2. Adapters import ONLY from `application/*/contracts/` -- never from contexts
3. Wire adapters in the composition root

**Structural change**: `adapters/` directory added. Level 3.

### 7.4 When infrastructure is shared across contexts

**Symptom**: Multiple contexts need the same database engine, cache client, or event bus. You are duplicating infrastructure setup code.

**Action**:
1. Create `src/platform/{infra-concern}/` (e.g., `platform/persistence/`)
2. Move shared infrastructure there. Platform contains ZERO domain logic
3. Context `infrastructure/` modules import from `platform/`
4. Context `domain/` and `application/` layers remain unaware of platform

**Structural change**: `platform/` directory added. Level 3.

### 7.5 When you need multi-runtime support

**Symptom**: The same domain must run in server (Node.js), browser, edge (Cloudflare Workers), or mobile.

**Action**:
1. Ensure all ports are defined in `domain/` (no concrete imports in domain or application)
2. Create one infrastructure implementation per runtime target
3. Create one policy per runtime (see Section 6.4)
4. Use the ProviderRegistry to map policy keys to runtime-specific implementations
5. The composition root selects the policy based on runtime detection

**Structural change**: Multiple implementations per port in `infrastructure/`. Multiple policies in `composition/`.

### 7.6 When you need event-driven communication between contexts

**Symptom**: Context A needs to notify Context B when something happens, but they should not import each other.

**Action**:
1. Define domain events in the publishing context's `domain/` layer
2. Implement the `EventPublisher` port in `infrastructure/` (or `platform/eventing/` if shared)
3. Create event handlers in the subscribing context's `application/` layer
4. Wire publishers and subscribers in the composition root
5. Keep event payloads as primitive data (IDs, strings, numbers) -- never pass domain objects

**Structural change**: `platform/eventing/` if shared, otherwise `infrastructure/` within each context.

### 7.7 When you need auditing or lineage tracking

**Symptom**: You need to track who did what, when, and what the data looked like at each step.

**Action**:
1. Add a `lineage` module inside the relevant context
2. Define a `LineageRecord` aggregate: `{ entityId, action, actor, timestamp, snapshot }`
3. Record lineage entries in use cases (application layer) after successful operations
4. Lineage is append-only -- records are never modified

**Structural change**: New module within existing context.

### 7.8 When you need batch processing

**Symptom**: A use case needs to process hundreds or thousands of items, with progress tracking, partial failure handling, and resumability.

**Action**:
1. Create a `BatchProcessor<T>` pattern in `shared/` or `application/`
2. Define: `processBatch(items: T[], handler: (item: T) => Promise<Result<E, R>>)`
3. Track progress: `{ total, processed, succeeded, failed, errors[] }`
4. Support resumability: persist progress state, allow restart from last checkpoint
5. Use concurrency controls: configurable parallelism, backpressure

**Structural change**: Utility in `shared/` or use case pattern in `application/`.

---

## 8. Decision Log

Record architecture decisions as you make them. Keep it lightweight -- one row per decision.

| #  | Date       | Decision                              | Alternatives Considered         | Reason                                           |
| -- | ---------- | ------------------------------------- | ------------------------------- | ------------------------------------------------ |
| 1  | {date}     | {what was decided}                    | {what else was considered}      | {why this option was chosen}                     |
| 2  |            |                                       |                                 |                                                  |
| 3  |            |                                       |                                 |                                                  |
| 4  |            |                                       |                                 |                                                  |
| 5  |            |                                       |                                 |                                                  |

### Decision categories

Use these tags in the Decision column for filtering:

- `[STRUCTURE]` -- directory layout, layer boundaries
- `[PATTERN]` -- design pattern choices
- `[INFRA]` -- persistence, eventing, hosting
- `[BOUNDARY]` -- bounded context boundaries, module splits
- `[RUNTIME]` -- multi-runtime decisions
- `[TRADE-OFF]` -- explicit trade-off accepted

---

## 9. Checklist: Architecture Health

Run this checklist periodically. Every unchecked item is a potential architecture violation.

### Domain Integrity

- [ ] Domain layer has **zero** infrastructure imports
- [ ] All ports are **interfaces** defined in `domain/ports/`
- [ ] Aggregates use **factory methods** -- no public constructors
- [ ] Value objects are **immutable** (frozen after creation)
- [ ] Domain operations return `Result<E, T>` -- no thrown exceptions for domain logic
- [ ] Domain events are **immutable data records**

### Bounded Context Isolation

- [ ] Bounded contexts do **not** import from each other
- [ ] Cross-context references use **IDs only** (never shared domain objects)
- [ ] Each context has a **single public service** as its API
- [ ] Context internals (use cases, repos, entities) are **not exported**

### Composition

- [ ] All dependencies are resolved in the **composition root**
- [ ] Policies are **plain objects** (no framework-specific DI)
- [ ] Factory functions return **ports** (interfaces), not implementations
- [ ] Switching runtime target requires **only** a policy change

### Application Layer (if Level 2+)

- [ ] Orchestrators depend on context **services**, not context internals
- [ ] Orchestrators have their own **contract ports** for adapters to consume
- [ ] Cross-context flows handle **partial failures** explicitly

### Adapters (if Level 3)

- [ ] Adapters depend **only** on `application/*/contracts/`
- [ ] Adapters do **not** import from `contexts/` directly
- [ ] Serialization/deserialization happens **inside the adapter**, not in domain

### Platform (if Level 3)

- [ ] Platform contains **zero** domain logic
- [ ] Platform modules are **independently replaceable**
- [ ] Context code uses platform via **ports**, not direct imports (where possible)

---

## Revision History

| Date   | Author | Changes       |
| ------ | ------ | ------------- |
| {date} |        | Initial draft |
