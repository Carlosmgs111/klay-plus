# DDD Context Design Skill

## Descripción

Este skill guía el diseño e implementación de **Bounded Contexts**, sus **Módulos** y el **Pipeline Orchestrator** siguiendo Domain-Driven Design (DDD), Arquitectura Hexagonal y patrones funcionales. Basado en la arquitectura de klay+.

---

## 0. Conceptos Fundamentales

### 0.1 Contexto vs Módulo vs Pipeline

| Concepto | Descripción | Ejemplo |
|----------|-------------|---------|
| **Bounded Context** | Límite semántico que encapsula un subdominio completo. Contiene uno o más módulos. | `source-ingestion` |
| **Módulo** | Unidad cohesiva dentro de un contexto. Contiene un Aggregate Root y sus colaboradores. | `source`, `extraction` |
| **Pipeline** | Capa de coordinación cross-context. Orquesta flujos de usuario que atraviesan múltiples contextos. | `ProcessKnowledge` |

**Regla crítica**: Los módulos NO se comunican directamente entre sí. La coordinación entre módulos ocurre **exclusivamente a nivel de contexto**, mediante:
- El **context wiring** en `index.ts` del contexto

**Regla crítica**: Los contextos NO se comunican directamente entre sí. La coordinación entre contextos ocurre **exclusivamente** mediante:
- `coreWiring()` en `contexts/index.ts` que resuelve inter-context deps
- **Pipelines** en `pipelines/` que coordinan use cases cross-context
- **Eventos de integración** (comunicación asíncrona)

### 0.2 Responsabilidades por Nivel

```
COMPOSITION ROOT (composition/root.ts)
├── resolveConfig(policy) → ResolvedConfig
├── coreWiring(config) → wired contexts
├── Creates pipelines (ProcessKnowledge)
├── Wraps cross-cutting concerns (search context filter)
└── Returns KnowledgeApplication namespace object

CORE WIRING (contexts/index.ts)
├── Resuelve inter-context deps entre contextos
├── Llama context wirings en orden correcto
├── Ports resueltos inline (no adapters/ directory)
├── NO contiene lógica de dominio
└── Solo conecta outputs de un contexto como inputs de otro

PIPELINES (pipelines/)
├── Orquestación cross-context (e.g., ProcessKnowledge)
├── Reciben deps por constructor (use cases/queries de contextos)
├── NO contiene lógica de dominio
├── NO accede a repositorios
└── Solo coordina use cases de diferentes contextos

CONTEXTO (Bounded Context)
├── Orquestación de workflows que involucran múltiples módulos
├── Wiring function en `index.ts` como coordinador
├── Llama module wirings, resuelve intra-context deps
└── Políticas de infraestructura por módulo

MÓDULO (dentro del contexto)
├── Un Aggregate Root + Value Objects
├── Use Cases que operan SOLO sobre su propio Aggregate
├── Factory que resuelve SU infraestructura, Wiring que crea use cases
├── NO coordina otros módulos
└── NO tiene Service propio
```

---

## 1. Estructura de un Bounded Context

```
{context-name}/
├── index.ts                          # Context wiring: coordina módulos, resuelve intra-context deps
├── CLAUDE.md                         # Documentación del contexto
├── __tests__/
│   └── e2e.test.ts                   # Tests end-to-end (OBLIGATORIO)
│
├── {module-a}/                       # Módulo A
│   ├── index.ts
│   ├── domain/
│   ├── application/
│   │   └── use-cases/                # Use cases + DTOs co-located
│   ├── infrastructure/
│   └── composition/
│       ├── factory.ts                # {moduleA}Factory(policy) → { infra }
│       └── wiring.ts                 # {moduleA}Wiring(policy, deps?) → use cases
│
└── {module-b}/                       # Módulo B
    ├── index.ts
    ├── domain/
    ├── application/
    │   └── use-cases/
    ├── infrastructure/
    └── composition/
        ├── factory.ts                # {moduleB}Factory(policy) → { infra }
        └── wiring.ts                 # {moduleB}Wiring(policy, deps?) → use cases
```

### 1.1 Estructura de un Módulo

```
{module-name}/
├── index.ts                          # Re-exports del módulo
├── domain/
│   ├── {Aggregate}.ts                # Aggregate Root
│   ├── {Aggregate}Id.ts              # Value Object ID
│   ├── {ValueObject}.ts              # Value Objects adicionales
│   ├── {Aggregate}Repository.ts      # Port (interfaz)
│   ├── {Port}.ts                     # Otros ports (ej: ContentExtractor)
│   ├── errors/
│   │   ├── {Module}Errors.ts
│   │   └── index.ts
│   ├── events/
│   │   └── {EventName}.ts
│   └── index.ts
├── application/
│   ├── use-cases/
│   │   ├── {UseCaseName}.ts          # Use Cases + DTOs co-located
│   │   └── index.ts
│   └── index.ts
├── infrastructure/
│   ├── adapters/                     # Implementaciones de ports
│   │   └── {AdapterName}.ts
│   └── persistence/
│       ├── InMemory{Aggregate}Repository.ts
│       ├── indexeddb/
│       └── nedb/
└── composition/                      # ÚNICA ubicación para decisiones de infra
    ├── factory.ts                    # {module}Factory(policy) → { infra }
    └── wiring.ts                     # {module}Wiring(policy, deps?) → use cases wired
```

### 1.2 composition/ Structure (OBLIGATORIO)

Cada módulo DEBE tener `composition/factory.ts` y `composition/wiring.ts`:

```typescript
// composition/factory.ts — resolves infrastructure from policy
export type ModuleInfrastructurePolicy = {
  provider: "in-memory" | "browser" | "server";
  dbPath?: string;
  dbName?: string;
};

export async function moduleFactory(policy: ModuleInfrastructurePolicy) {
  // ... resolve repository + eventPublisher based on policy.provider
  return { infra: { repository, eventPublisher } };
}
```

```typescript
// composition/wiring.ts — creates use cases with resolved infra + deps
export async function moduleWiring(
  policy: ModuleInfrastructurePolicy,
  deps?: ModuleWiringDeps,
) {
  const { moduleFactory } = await import("./factory");
  const { infra } = await moduleFactory(policy);
  // ... create use cases with infra + deps
  return { useCase1, useCase2 };
}
```

---

## 2. Capa Composition: Rol y Responsabilidades

### 2.1 Definición

La carpeta `composition/` es el **único lugar** donde se toman decisiones de infraestructura. Su responsabilidad es:

1. **Resolver adaptadores** según la política recibida
2. **Resolver repositorios** (InMemory, IndexedDB, NeDB, etc.)
3. **Resolver extractores/processors** y otros ports
4. **Resolver event publishers**
5. **Ensamblar** el módulo con sus dependencias resueltas

### 2.2 Reglas Estrictas

```
✅ CORRECTO                              ❌ INCORRECTO
───────────────────────────────────────────────────────────────────
Factory decide qué Repository usar       Adapter detecta si es browser/server
Factory importa dinámicamente adapters   Repository decide su implementación
Política viene de arriba (coreWiring)    Adapter lee process.env o window
Factory retorna { infra }                Factory crea use cases directamente
Wiring crea use cases con infra+deps     Factory mezcla infra + use cases
Factory en composition/factory.ts        Factory inline en index.ts del módulo
Wiring en composition/wiring.ts          Use case creation dispersa
Config resolved in composition root      API keys/paths hardcodeados en contextos
DTOs co-located with use cases           Centralized dtos.ts files
Ports resolved inline in coreWiring      Separate adapters/ directory
```

### 2.3 ConfigProvider Pattern

Config resolution happens at the **composition root** (`composition/root.ts`), NOT at context or module level. The `resolveConfig()` function converts an `OrchestratorPolicy` into a `ResolvedConfig`:

```typescript
// composition/root.ts
export async function createKnowledgeApplication(policy: OrchestratorPolicy) {
  const { resolveConfig } = await import("../config/resolveConfig");
  const config = await resolveConfig(policy);  // OrchestratorPolicy → ResolvedConfig

  const { coreWiring } = await import("../contexts");
  const core = await coreWiring(config);       // ResolvedConfig → wired contexts

  // ... create pipelines, return KnowledgeApplication
}
```

Context and module wirings receive already-resolved infrastructure policies — they never resolve config themselves. The `coreWiring()` function builds per-module policies from the `ResolvedConfig`:

```typescript
// contexts/index.ts
export const coreWiring = async (config: ResolvedConfig) => {
  const persistenceConfig = {
    provider: config.persistenceProvider,
    dbPath: config.dbPath,
    dbName: config.dbName,
  };

  // Pass already-resolved policy to context wirings
  const result = await sourceIngestionWiring({
    sourceInfrastructurePolicy: persistenceConfig,
    resourceInfrastructurePolicy: persistenceConfig,
    extractionInfrastructurePolicy: persistenceConfig,
  });
  // ...
};
```

**Variables de configuración comunes:**
- `KLAY_DB_PATH`: Ruta para bases de datos NeDB (server)
- `KLAY_DB_NAME`: Nombre de base de datos IndexedDB (browser)
- API keys y tokens deben resolverse via ConfigProvider, nunca hardcodeados

### 2.4 Factory (Obligatorio)

```typescript
// composition/factory.ts
export type {Module}InfrastructurePolicy = {
  provider: "in-memory" | "browser" | "server";
  dbPath?: string;
  dbName?: string;
};

/**
 * Factory: ÚNICO responsable de decisiones de infraestructura.
 * Los adapters NO detectan entorno por sí mismos.
 */
export async function {module}Factory(
  policy: {Module}InfrastructurePolicy,
) {
  // ─── Resolver Repositorio ─────────────────────────────────
  let repository: {Aggregate}Repository;
  switch (policy.provider) {
    case "in-memory": {
      const { InMemory{Aggregate}Repository } = await import(
        "../infrastructure/persistence/InMemory{Aggregate}Repository"
      );
      repository = new InMemory{Aggregate}Repository();
      break;
    }
    case "browser": {
      const { IndexedDB{Aggregate}Repository } = await import(
        "../infrastructure/persistence/indexeddb/IndexedDB{Aggregate}Repository"
      );
      repository = new IndexedDB{Aggregate}Repository(policy.dbName ?? "default-db");
      break;
    }
    case "server": {
      const { NeDB{Aggregate}Repository } = await import(
        "../infrastructure/persistence/nedb/NeDB{Aggregate}Repository"
      );
      repository = new NeDB{Aggregate}Repository(policy.dbPath);
      break;
    }
    default:
      throw new Error(`Unknown policy provider: ${(policy as any).provider}`);
  }

  // ─── Resolver Event Publisher ─────────────────────────────
  const { InMemoryEventPublisher } = await import(
    "@shared/infrastructure/InMemoryEventPublisher"
  );
  const eventPublisher = new InMemoryEventPublisher();

  return { infra: { repository, eventPublisher } };
}
```

### 2.5 Wiring (Crea use cases con infra + deps)

El archivo `wiring.ts` usa la factory para obtener infra y luego crea use cases inyectándoles las dependencias resueltas. Opcionalmente recibe `deps` para intra-context dependencies (resueltas por el context wiring).

```typescript
// composition/wiring.ts
export interface {Module}WiringDeps {
  somePort: SomePort;  // Intra-context dep from another module
}

export interface {Module}WiringResult {
  someUseCase: SomeUseCase;
  someQuery: SomeQuery;
}

export async function {module}Wiring(
  policy: {Module}InfrastructurePolicy,
  deps: {Module}WiringDeps,
): Promise<{Module}WiringResult> {
  const { {module}Factory } = await import("./factory");
  const { infra } = await {module}Factory(policy);

  const { SomeUseCase } = await import("../application/use-cases/SomeUseCase");
  const { SomeQuery } = await import("../application/use-cases/SomeQuery");

  const someUseCase = new SomeUseCase(infra.repository, infra.eventPublisher, deps.somePort);
  const someQuery = new SomeQuery(infra.repository);

  return { someUseCase, someQuery };
}
```

**¿Por qué separar factory y wiring?**
- Factory solo resuelve infraestructura (repository, eventPublisher, etc.)
- Wiring crea use cases y puede recibir deps de otros módulos del mismo contexto
- El context wiring (`index.ts`) coordina el orden de module wirings

---

## 3. Context Wiring (Nivel de Contexto)

### 3.1 Ubicación y Responsabilidad

El context wiring existe en el `index.ts` **a nivel de contexto**, NO de módulo. Es el único punto de coordinación entre módulos del mismo contexto.

```
source-ingestion/
├── index.ts                          ← Context wiring: sourceIngestionWiring()
├── source/                           ← Módulo (NO tiene service propio)
│   └── composition/
│       ├── factory.ts
│       └── wiring.ts
├── resource/                         ← Módulo
│   └── composition/
│       ├── factory.ts
│       └── wiring.ts
└── extraction/                       ← Módulo
    └── composition/
        ├── factory.ts
        └── wiring.ts
```

### 3.2 Context Wiring (Patrón Obligatorio)

```typescript
// {context}/index.ts
export type SourceIngestionInfrastructurePolicy = {
  sourceInfrastructurePolicy: SourceInfrastructurePolicy;
  resourceInfrastructurePolicy: ResourceInfrastructurePolicy;
  extractionInfrastructurePolicy: ExtractionInfrastructurePolicy;
};

export const sourceIngestionWiring = async (
  policy: SourceIngestionInfrastructurePolicy,
) => {
  // 1. Wire independent modules first
  const extractionWiringResult = await extractionWiring(
    policy.extractionInfrastructurePolicy,
  );
  const resourceWiringResult = await resourceWiring(
    policy.resourceInfrastructurePolicy,
  );

  // 2. Wire dependent module with intra-context deps
  const sourceWiringDeps: SourceWiringDeps = {
    executeExtraction: extractionWiringResult.executeExtraction,
    extractionJobRepository: extractionWiringResult.extractionJobRepository,
    storeResource: resourceWiringResult.storeResource,
    registerExternalResource: resourceWiringResult.registerExternalResource,
  };
  const sourceWiringResult = await sourceWiring(
    policy.sourceInfrastructurePolicy,
    sourceWiringDeps,
  );

  return { sourceWiringResult, resourceWiringResult, extractionWiringResult };
};
```

### 3.3 Qué hace el Context Wiring

- Llama module wirings en el **orden correcto** (independientes primero)
- Resuelve **intra-context deps** entre módulos (outputs de un módulo → deps de otro)
- Retorna los resultados de cada module wiring como un objeto plano
- **No crea clases Service** — la coordinación es funcional via el wiring

### 3.4 Qué NO hace un Módulo

Un módulo individual **NUNCA**:
- Importa o referencia otro módulo
- Coordina flujos que involucran otros módulos
- Tiene su propio Service/Orchestrator
- Accede al repository de otro módulo

### 3.5 Context Wiring with Cross-Context Deps

Some contexts need cross-context ports (resolved by `coreWiring()`). These are passed as a second argument:

```typescript
// context-management/index.ts
export type ContextManagementInfrastructurePolicy = {
  contextInfrastructurePolicy: ContextInfrastructurePolicy;
  lineageInfrastructurePolicy: LineageInfrastructurePolicy;
};

export type ContextManagementCrossContextDeps = {
  enrichment: {
    sourceMetadata: SourceMetadataPort;
    projectionStats: ProjectionStatsPort;
  };
  reconciliation: {
    projectionOperations: ProjectionOperations;
    getExtractedText: (id: string) => Promise<string | null>;
    listActiveProfiles: () => Promise<Array<{ id: string }>>;
  };
};

export const contextManagementWiring = async (
  policy: ContextManagementInfrastructurePolicy,
  crossContextDeps: ContextManagementCrossContextDeps,
) => {
  const contextWiringResult = await contextWiring(
    policy.contextInfrastructurePolicy,
    crossContextDeps, // Cross-context deps passed through to module wiring
  );
  const lineageWiringResult = await lineageWiring(
    policy.lineageInfrastructurePolicy,
  );
  return { contextWiringResult, lineageWiringResult };
};
```

The cross-context ports are resolved inline in `coreWiring()` — no separate `adapters/` directory needed.

---

## 4. Pipelines + Core Wiring (Nivel Cross-Context)

### 4.1 Ubicación y Responsabilidad

Pipelines live in `pipelines/`, and `coreWiring()` lives in `contexts/index.ts`. Together they handle cross-context coordination.

```
src/
├── composition/
│   └── root.ts                ← createKnowledgeApplication() — composition root
├── pipelines/                 ← Cross-context pipelines (NOT bounded contexts)
│   └── process-knowledge/
│       ├── ProcessKnowledge.ts  # Pipeline class
│       ├── boundary.ts          # PipelineError type
│       └── dtos.ts              # DTOs co-located
├── contexts/
│   ├── index.ts               ← coreWiring(ResolvedConfig) — inter-context deps
│   ├── source-ingestion/      ← Bounded Context
│   ├── context-management/    ← Bounded Context
│   ├── semantic-processing/   ← Bounded Context
│   └── knowledge-retrieval/   ← Bounded Context
└── shared/                    ← Shared Kernel
```

### 4.2 Qué hace vs Qué NO hace el Pipeline

```
✅ EL PIPELINE HACE                          ❌ EL PIPELINE NO HACE
─────────────────────────────────────────────────────────────────────────
Coordinar use cases en secuencia             Contener lógica de dominio
Propagar resultados entre pasos              Acceder a repositorios directamente
Envolver errores con contexto de paso        Definir entidades o agregados
Recibir deps por constructor                 Importar internos de un contexto
Exponer execute() como operación             Decidir reglas de negocio
Usar Result<PipelineError, T>                Publicar eventos de dominio
```

### 4.3 Analogía Arquitectónica

La jerarquía de coordinación sigue un patrón fractal:

| Nivel | Coordinador | Coordina | Mediante |
|-------|-------------|----------|----------|
| **Módulo** | Use Case | Aggregate + Ports | Inyección directa |
| **Contexto** | Context wiring (`index.ts`) | Múltiples Módulos | Module wirings |
| **Core wiring** | `coreWiring()` | Múltiples Contextos | Context wirings |
| **Pipeline** | Pipeline class | Use cases cross-context | Constructor injection |

Cada nivel solo conoce la API pública del nivel inferior. Nunca accede a los internos.

### 4.4 OrchestratorPolicy (Top-Level Config)

The top-level policy is `OrchestratorPolicy` (in `config/OrchestratorPolicy.ts`), which is resolved into `ResolvedConfig` by the composition root:

```typescript
// config/OrchestratorPolicy.ts
export interface OrchestratorPolicy {
  provider: "in-memory" | "browser" | "server";
  dbPath?: string;
  dbName?: string;
  configOverrides?: Record<string, string>;
  configStore?: ConfigStore;
  // ... embedding, vector store, retrieval settings
}
```

`resolveConfig(policy)` converts this to a `ResolvedConfig` with all values resolved (defaults applied, config store consulted). The `ResolvedConfig` is then passed to `coreWiring()` which builds per-module infrastructure policies.

### 4.5 Core Wiring (Inter-Context Coordination)

`coreWiring()` in `contexts/index.ts` wires all 4 contexts respecting inter-context dependencies. Independent contexts first, then dependent ones:

```typescript
// contexts/index.ts
export const coreWiring = async (config: ResolvedConfig) => {
  const persistenceConfig = { provider: config.persistenceProvider, dbPath: config.dbPath, dbName: config.dbName };

  // 1. Source Ingestion (independent — no cross-context deps)
  const sourceIngestionWiringResult = await sourceIngestionWiring({
    sourceInfrastructurePolicy: persistenceConfig,
    resourceInfrastructurePolicy: persistenceConfig,
    extractionInfrastructurePolicy: persistenceConfig,
  });

  // 2. Semantic Processing (depends on SI: SourceIngestionPort)
  const semanticProcessingWiringResult = await semanticProcessingWiring({
    projectionInfrastructurePolicy: { ...persistenceConfig, /* embedding config */ },
    processingProfileInfrastructurePolicy: persistenceConfig,
    projectionWiringDeps: {
      sourceIngestionPort: {
        sourceExists: (id) => sourceQueries.exists(id),        // ← resolved inline
        getExtractedText: (id) => sourceQueries.getExtractedText(id),
      },
    },
  });

  // 3. Context Management + Knowledge Retrieval (parallel, depend on SI + SP)
  const [contextManagementWiringResult, knowledgeRetrievalWiringResult] =
    await Promise.all([
      contextManagementWiring(
        { contextInfrastructurePolicy: persistenceConfig, lineageInfrastructurePolicy: persistenceConfig },
        { enrichment: { /* sourceMetadata, projectionStats */ }, reconciliation: { /* ... */ } },
      ),
      knowledgeRetrievalWiring({
        semanticQueryInfrastructurePolicy: { ..., vectorStoreConfig: projectionResult.vectorStoreConfig },
      }),
    ]);

  return { contextManagementWiringResult, sourceIngestionWiringResult, ... };
};
```

**Key pattern**: Cross-context ports are resolved **inline** in `coreWiring()`. No separate `adapters/` directory — just closures that call use cases from other contexts.

### 4.6 Pipeline Pattern

A Pipeline is a class that coordinates a cross-context flow. It receives use cases/queries by constructor (not services) and exposes an `execute()` method that returns `Result<PipelineError, T>`.

```typescript
// pipelines/process-knowledge/ProcessKnowledge.ts
export interface ProcessKnowledgeDeps {
  ingestAndExtract: IngestAndExtract;
  sourceQueries: SourceQueries;
  projectionOperations: ProjectionOperations;
  contextQueries: ContextQueries;
  addSourceToContext: AddSourceToContext;
}

export class ProcessKnowledge {
  constructor(private readonly deps: ProcessKnowledgeDeps) {}

  async execute(
    input: ProcessKnowledgeInput,
  ): Promise<Result<PipelineError, ProcessKnowledgeResult>> {
    // Step 1: Ingest and extract
    const ingestionResult = await this.deps.ingestAndExtract.execute({...});
    if (ingestionResult.isFail()) {
      return Result.fail(pipelineError("ingestion", ingestionResult.error));
    }

    // Step 2: Process projections
    const projectionResult = await this.deps.projectionOperations.processSource({...});
    if (projectionResult.isFail()) {
      return Result.fail(pipelineError("processing", projectionResult.error, ["ingestion"]));
    }

    // Step 3: Add source to context (catalog)
    const catalogResult = await this.deps.addSourceToContext.execute({...});
    if (catalogResult.isFail()) {
      return Result.fail(pipelineError("cataloging", catalogResult.error, ["ingestion", "processing"]));
    }

    return Result.ok({ sourceId, contextId, projectionCount });
  }
}
```

The pipeline is instantiated in `composition/root.ts` with deps from `coreWiring()`:

```typescript
// composition/root.ts (excerpt)
const processKnowledge = new ProcessKnowledge({
  ingestAndExtract: core.sourceIngestionWiringResult.sourceWiringResult.ingestAndExtract,
  sourceQueries: core.sourceIngestionWiringResult.sourceWiringResult.sourceQueries,
  projectionOperations: core.semanticProcessingWiringResult.projectionWiringResult.projectionOperations,
  contextQueries: core.contextManagementWiringResult.contextWiringResult.contextQueries,
  addSourceToContext: core.contextManagementWiringResult.contextWiringResult.addSourceToContext,
});
```

### 4.7 Pipeline Error

Pipeline errors are plain objects (not classes), defined in `boundary.ts` co-located with the pipeline:

```typescript
// pipelines/process-knowledge/boundary.ts
export type PipelineError = {
  step: string;              // Contexto donde falló
  code: string;              // Error code
  message: string;           // Human-readable message
  completedSteps: string[];  // Pasos exitosos antes del fallo
};

export function pipelineError(
  step: string,
  error: { code?: string; message: string },
  completedSteps: string[] = [],
): PipelineError {
  return { step, code: error.code ?? "PIPELINE_STEP_FAILED", message: error.message, completedSteps };
}
```

### 4.8 Composition Root

The composition root (`composition/root.ts`) is the top-level factory. It:
1. Resolves config from `OrchestratorPolicy`
2. Calls `coreWiring()` to wire all contexts
3. Creates pipelines with deps from wired contexts
4. Wraps cross-cutting concerns (e.g., search context filter)
5. Returns the `KnowledgeApplication` namespace object

```typescript
// composition/root.ts
export async function createKnowledgeApplication(
  policy: OrchestratorPolicy,
): Promise<KnowledgeApplication> {
  const config = await resolveConfig(policy);
  const core = await coreWiring(config);

  // Unpack wiring results
  const { contextWiringResult: context, lineageWiringResult: lineage } =
    core.contextManagementWiringResult;
  const { sourceWiringResult: source } = core.sourceIngestionWiringResult;
  // ...

  // Create ProcessKnowledge pipeline
  const processKnowledge = new ProcessKnowledge({ /* deps from core */ });

  // Return KnowledgeApplication namespace
  return {
    processKnowledge,
    contextManagement: { /* use cases from context wiring */ },
    sourceIngestion: { /* use cases from source wiring */ },
    semanticProcessing: { /* use cases from projection/profile wirings */ },
    knowledgeRetrieval: { searchKnowledge: wrappedSearch },
  };
}
```

### 4.9 Public API (index.ts)

The package's public API is in `src/index.ts`, which exports the `KnowledgeApplication` interface and the `createKnowledgeApplication` factory:

```typescript
// src/index.ts
export type { KnowledgeApplication } from "./application-interface";
export { createKnowledgeApplication } from "./composition/root";

// Type re-exports for consumers
export type { ProcessKnowledgeInput, ProcessKnowledgeResult } from "./pipelines/process-knowledge/dtos";
// ... other type re-exports
```

---

## 5. Eventos de Integración

### 5.1 Contratos

Los eventos de integración se definen en `shared/domain/events/IntegrationEvents.ts`. Son DTOs inmutables que constituyen la interfaz pública asíncrona de cada contexto:

```typescript
// Formato de eventType: "{bounded-context}.{module}.{event}" en kebab-case
interface SourceExtractedEvent {
  readonly eventType: "source-ingestion.source.extracted";
  readonly sourceId: string;
  readonly rawContent: string;
  readonly contentHash: string;
}

interface ContextCreatedEvent {
  readonly eventType: "context-management.context.created";
  readonly contextId: string;
  readonly name: string;
  readonly version: number;
}
```

### 5.2 Flujo de Eventos

```
Source Ingestion ──SourceExtracted──▶ Context Management
                                          │
                                    ContextCreated
                                    ContextVersioned
                                    ReprocessRequested
                                          │
                                          ▼
Knowledge Retrieval ◀──ProjectionGenerated── Semantic Processing
```

### 5.3 Coreografía vs Orquestación

| Aspecto | Orquestación (Pipeline) | Coreografía (Eventos) |
|---|---|---|
| Coordinador | PipelineOrchestrator | Handlers independientes |
| Acoplamiento | Services conocidos por Pipeline | Solo contratos compartidos |
| Trazabilidad | Explícita via `PipelineError.completedSteps` | Requiere correlation IDs |
| Errores | Centralizados en workflow | Distribuidos en handlers |
| Ideal para | Confirmación inmediata | Procesamiento background |

La recomendación es iniciar con orquestación síncrona y evolucionar a coreografía event-driven cuando se requiera procesamiento background.

---

## 6. Reglas Anti-Errores para Agentes

### 6.1 Errores Críticos a Evitar

#### ❌ Detección de Runtime en Adapters

```typescript
// ❌ INCORRECTO - Adapter detecta entorno
export class PdfExtractor implements ContentExtractor {
  async extract(source: Source) {
    if (typeof window !== 'undefined') {  // ❌ NO HACER ESTO
      return this.browserExtract(source);
    } else {
      return this.serverExtract(source);
    }
  }
}

// ✅ CORRECTO - Factory decide, Adapter es específico
// BrowserPdfExtractor.ts - Solo sabe extraer en browser
export class BrowserPdfExtractor implements ContentExtractor {
  async extract(source: Source) {
    // Usa pdfjs-dist, asume contexto browser
  }
}

// ServerPdfExtractor.ts - Solo sabe extraer en server
export class ServerPdfExtractor implements ContentExtractor {
  async extract(source: Source) {
    // Usa pdf-extraction, asume contexto Node
  }
}

// Factory decide cuál usar
async function resolveExtractor(policy): Promise<ContentExtractor> {
  if (policy.provider === "browser") {
    return new BrowserPdfExtractor();
  }
  return new ServerPdfExtractor();
}
```

#### ❌ Dependencias Cruzadas entre Módulos

```typescript
// ❌ INCORRECTO - Módulo importa otro módulo
// extraction/application/ExecuteExtraction.ts
import { SourceRepository } from "../../source/domain/SourceRepository"; // ❌ NO

// ✅ CORRECTO - Solo el context wiring coordina
// source-ingestion/index.ts
export const sourceIngestionWiring = async (policy) => {
  const extractionResult = await extractionWiring(policy.extractionInfrastructurePolicy);
  const sourceResult = await sourceWiring(
    policy.sourceInfrastructurePolicy,
    { executeExtraction: extractionResult.executeExtraction }, // intra-context dep
  );
  return { sourceResult, extractionResult };
};
```

#### ❌ Dependencias Cruzadas entre Contextos

```typescript
// ❌ INCORRECTO - Contexto importa internos de otro contexto
// knowledge-retrieval/semantic-query/application/QueryUseCase.ts
import { SemanticProjectionRepository } from "../../semantic-processing/projection/domain/..."; // ❌ NO

// ✅ CORRECTO - Solo coreWiring coordina contextos, pipelines receive deps
// pipelines/process-knowledge/ProcessKnowledge.ts
export class ProcessKnowledge {
  constructor(private readonly deps: {
    ingestAndExtract: IngestAndExtract;  // From source-ingestion wiring
    contextQueries: ContextQueries;     // From context-management wiring
  }) {}
}
// deps resolved in composition/root.ts from coreWiring() results
```

#### ❌ Lógica de Composición Fuera de composition/

```typescript
// ❌ INCORRECTO - Use case decide infraestructura
export class RegisterSource {
  constructor() {
    // ❌ Use case crea su propio repository
    this.repository = process.env.NODE_ENV === 'test'
      ? new InMemoryRepository()
      : new NeDBRepository();
  }
}

// ✅ CORRECTO - Use case recibe dependencias
export class RegisterSource {
  constructor(
    private readonly repository: SourceRepository,  // ✅ Inyectado
    private readonly eventPublisher: EventPublisher, // ✅ Inyectado
  ) {}
}
```

#### ❌ Lógica de Dominio en el Pipeline

```typescript
// ❌ INCORRECTO - Pipeline contiene lógica de negocio
class IngestDocumentWorkflow {
  async execute(command) {
    // ❌ Pipeline validando reglas de dominio
    if (command.content.length < 100) {
      return Result.fail(new ContentTooShortError());
    }
    // ❌ Pipeline calculando hashes
    const hash = crypto.createHash('sha256').update(command.content).digest('hex');
    // ...
  }
}

// ✅ CORRECTO - Pipeline solo coordina
class IngestDocumentWorkflow {
  async execute(command) {
    // ✅ Delega al use case, que valida en dominio
    const result = await this.deps.ingestAndExtract.execute({...command});
    if (result.isFail()) return Result.fail(PipelineError.fromStep("ingestion", result.error));
    // ...
  }
}
```

### 6.2 Checklist de Validación

Antes de finalizar un módulo, verificar:

- [ ] ¿La factory es la ÚNICA que decide implementaciones?
- [ ] ¿Los adapters NO detectan entorno (window, process, etc.)?
- [ ] ¿El módulo NO importa otros módulos del contexto?
- [ ] ¿Los Use Cases reciben TODAS sus dependencias por constructor?
- [ ] ¿La coordinación entre módulos está SOLO en el context wiring (`index.ts`)?
- [ ] ¿Factory retorna `{ infra }`?
- [ ] ¿Wiring crea use cases y retorna resultado tipado?
- [ ] ¿DTOs están co-located con use cases (no centralizados)?
- [ ] ¿Cross-context ports se resuelven inline en `coreWiring()`?
- [ ] ¿Existe `__tests__/e2e.test.ts` para el contexto?

---

## 7. Convenciones de Nombrado

### 7.1 Archivos

| Tipo | Patrón | Ejemplo |
|------|--------|---------|
| Clase/Interface | PascalCase | `Source.ts`, `SourceRepository.ts` |
| Factory function | camelCase | `source.factory.ts` |
| Políticas | kebab-case | `infra-policies.ts` |
| Errores | `{Module}Errors.ts` | `SourceErrors.ts` |
| Workflow | PascalCase | `IngestDocumentWorkflow.ts` |

### 7.2 Clases y Tipos

| Elemento | Patrón | Ejemplo |
|----------|--------|---------|
| Aggregate Root | `{Name}` | `Source`, `ExtractionJob` |
| Value Object ID | `{Aggregate}Id` | `SourceId`, `ExtractionJobId` |
| Use Case | `{Verb}{Noun}` | `RegisterSource`, `ExecuteExtraction` |
| Error | `{Concept}{Type}Error` | `SourceNotFoundError` |
| Event | `{Aggregate}{PastVerb}` | `SourceRegistered` |
| Module Factory | `{module}Factory` | `sourceFactory` |
| Module Wiring | `{module}Wiring` | `sourceWiring` |
| Context Wiring | `{context}Wiring` | `sourceIngestionWiring` |
| Pipeline | `{Verb}{Domain}` | `ProcessKnowledge` |
| Pipeline Error | `PipelineError` | Plain object, con `step` discriminante |
| Composition Root | `createKnowledgeApplication` | API pública |

### 7.3 EVENT_TYPE

Formato: `{bounded-context}.{module}.{event}` en kebab-case

```typescript
static readonly EVENT_TYPE = "source-ingestion.source.registered";
static readonly EVENT_TYPE = "source-ingestion.extraction.completed";
```

---

## 8. Patrones de Implementación

### 8.1 Aggregate Root

```typescript
export class {Aggregate} extends AggregateRoot<{Aggregate}Id> {
  private _field: string;

  // Constructor privado
  private constructor(id: {Aggregate}Id, field: string) {
    super(id);
    this._field = field;
  }

  // Solo getters
  get field(): string { return this._field; }

  // Factory para crear
  static create(id: {Aggregate}Id, field: string): {Aggregate} {
    if (!field) throw new Error("Field is required");
    const entity = new {Aggregate}(id, field);
    entity.record({ /* evento */ });
    return entity;
  }

  // Reconstitute para hidratar (sin eventos)
  static reconstitute(id: {Aggregate}Id, field: string): {Aggregate} {
    return new {Aggregate}(id, field);
  }
}
```

### 8.2 Use Case con Result

```typescript
export class {UseCase} {
  constructor(
    private readonly repository: {Aggregate}Repository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(command: {UseCase}Command): Promise<Result<{Module}Error, {Aggregate}>> {
    // Validar
    if (!command.field) {
      return Result.fail(new FieldRequiredError());
    }

    // Crear/modificar
    const entity = {Aggregate}.create(id, command.field);

    // Persistir
    await this.repository.save(entity);

    // Publicar eventos
    await this.eventPublisher.publishAll(entity.clearEvents());

    // Retornar
    return Result.ok(entity);
  }
}
```

### 8.3 Domain Errors

```typescript
// Errores específicos del módulo
export class {Aggregate}NotFoundError extends NotFoundError {
  constructor(id: string) { super("{Aggregate}", id); }
}

export class {Aggregate}ValidationError extends ValidationError {
  constructor(field: string, reason: string) {
    super("{Aggregate}", field, reason);
  }
}

// Union type
export type {Module}Error =
  | {Aggregate}NotFoundError
  | {Aggregate}ValidationError;
```

### 8.4 Repository Interface (Port)

```typescript
export interface {Aggregate}Repository extends Repository<{Aggregate}, {Aggregate}Id> {
  // Métodos adicionales del dominio
  findByField(field: string): Promise<{Aggregate} | null>;
  exists(id: {Aggregate}Id): Promise<boolean>;
}
```

---

## 9. Flujo de Composición

### 9.1 Nivel Módulo

```
Policy → factory → { infra } → wiring(policy, deps) → use cases
```

```typescript
// 1. Factory resuelve infraestructura
const { infra } = await sourceFactory({ provider: "server", dbPath: "./data" });

// 2. Wiring crea use cases con infra + deps
const result = await sourceWiring(policy, { executeExtraction, ... });
// result = { sourceQueries, ingestAndExtract, ... }
```

### 9.2 Nivel Contexto

```
ContextPolicy → contextWiring() → calls module wirings → resolves intra-context deps
```

```typescript
// Context wiring calls module wirings in correct order
const result = await sourceIngestionWiring({
  sourceInfrastructurePolicy: persistenceConfig,
  resourceInfrastructurePolicy: persistenceConfig,
  extractionInfrastructurePolicy: persistenceConfig,
});
// result = { sourceWiringResult, resourceWiringResult, extractionWiringResult }
```

### 9.3 Nivel Core Wiring

```
ResolvedConfig → coreWiring() → calls context wirings → resolves inter-context deps
```

```typescript
const core = await coreWiring(config);
// core = { contextManagementWiringResult, sourceIngestionWiringResult, ... }
```

### 9.4 Nivel Composition Root

```
OrchestratorPolicy → resolveConfig → coreWiring → pipelines → KnowledgeApplication
```

```typescript
const app = await createKnowledgeApplication({ provider: "server" });
const result = await app.processKnowledge.execute({ ... });
```

---

## 10. Reglas y Principios

### 10.1 Reglas de Dominio

1. **Constructor privado** + `static create()` + `static reconstitute()`
2. **Solo getters**, nunca setters públicos
3. **Eventos en create/mutate**, nunca en reconstitute
4. **Validaciones** en factory methods

### 10.2 Reglas de Aplicación

1. **Result Pattern**: Use cases retornan `Result<Error, Value>`
2. **Inyección**: Dependencias por constructor
3. **Single Responsibility**: Un use case = una operación sobre UN aggregate

### 10.3 Reglas de Infraestructura

1. **Adapters puros**: NO detectan entorno, solo implementan
2. **DTOs** para serialización
3. **Dynamic imports** en Composers

### 10.4 Reglas de Composición

1. **Factory es obligatorio** por módulo (resuelve infra)
2. **Wiring es obligatorio** por módulo (crea use cases)
3. **Políticas declarativas** (`in-memory`, `browser`, `server`)
4. **DTOs co-located** con use cases (no centralizados)

### 10.5 Reglas de Contexto

1. **Context wiring en `index.ts`** — no Service classes
2. **Módulos NO se comunican directamente**
3. **Coordinación vía context wiring**

### 10.6 Reglas del Pipeline + Core Wiring

1. **Pipeline NO es un Bounded Context** — no tiene dominio
2. **Pipelines reciben use cases por constructor** — no services ni repositorios
3. **Sin lógica de negocio** — solo coordinación y propagación de resultados
4. **PipelineError es plain object** — preserva `step` y `completedSteps`
5. **`coreWiring()` resuelve inter-context deps** inline (no adapters/ directory)
6. **Composition root** (`root.ts`) crea pipelines y retorna `KnowledgeApplication`

---

## 11. Checklist para Nuevo Módulo

- [ ] Crear estructura de carpetas
- [ ] Implementar Aggregate Root (constructor privado)
- [ ] Implementar Value Objects
- [ ] Definir Repository interface (port)
- [ ] Definir errores de dominio
- [ ] Implementar eventos de dominio
- [ ] Implementar Use Cases con Result (DTOs co-located)
- [ ] Implementar repositorios (InMemory mínimo)
- [ ] **Crear `composition/factory.ts`** retornando `{ infra }`
- [ ] **Crear `composition/wiring.ts`** creando use cases
- [ ] Configurar index.ts del módulo

## 12. Checklist para Nuevo Contexto

- [ ] Crear estructura de contexto
- [ ] Implementar módulos individuales (con factory + wiring)
- [ ] **Crear `index.ts`** con context wiring function
- [ ] Definir `InfrastructurePolicy` type (per-module policies)
- [ ] Definir cross-context deps type (si aplica)
- [ ] **Escribir `__tests__/e2e.test.ts`** (obligatorio)

## 13. Checklist para Nuevo Pipeline

- [ ] Crear `pipelines/{pipeline-name}/` directory
- [ ] Crear pipeline class con deps por constructor
- [ ] Crear `boundary.ts` con PipelineError type
- [ ] Crear `dtos.ts` co-located con pipeline
- [ ] `execute()` retorna `Result<PipelineError, Success>`
- [ ] Cada paso invoca use case → verifica `isFail()` → propaga con `pipelineError()`
- [ ] `completedSteps` acumula pasos exitosos
- [ ] Instanciar pipeline en `composition/root.ts` con deps de `coreWiring()`
- [ ] Agregar al `KnowledgeApplication` interface
- [ ] Agregar tests en `__tests__/e2e.test.ts`

---

## 15. Resumen de Archivos Obligatorios

| Nivel | Archivo | Contenido |
|-------|---------|-----------|
| Módulo | `composition/factory.ts` | `{module}Factory(policy)` → `{ infra }` |
| Módulo | `composition/wiring.ts` | `{module}Wiring(policy, deps?)` → use cases wired |
| Contexto | `index.ts` | `{context}Wiring(policy, crossContextDeps?)` |
| Contexto | `__tests__/e2e.test.ts` | Test E2E completo del contexto |
| Core wiring | `contexts/index.ts` | `coreWiring(ResolvedConfig)` — inter-context deps |
| Pipeline | `pipelines/{name}/{Name}.ts` | Pipeline class con deps por constructor |
| Pipeline | `pipelines/{name}/boundary.ts` | PipelineError plain object type |
| Pipeline | `pipelines/{name}/dtos.ts` | DTOs co-located |
| Composition | `composition/root.ts` | `createKnowledgeApplication(policy)` |

---

*Skill arquitectónico para klay+ - Última actualización: Marzo 2026*
