# Source Ingestion - Informe Arquitectónico

## 1. Visión General

El módulo **source-ingestion** es un Bounded Context que implementa el patrón de ingesta de contenido para la plataforma de conocimiento. Su responsabilidad principal es gestionar referencias a fuentes externas, almacenar recursos físicos y extraer su contenido de forma controlada.

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SOURCE INGESTION CONTEXT                        │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────────┐  ┌──────────────────────┐  │
│  │ Source Module │  │ Resource Module  │  │  Extraction Module   │  │
│  │ ──────────── │  │ ────────────────  │  │ ──────────────────── │  │
│  │ • Referencias│  │ • Archivos       │  │ • Jobs de extracción │  │
│  │ • Metadata   │  │ • Storage        │  │ • Contenido extraído │  │
│  │ • Versiones  │  │ • Ref. externas  │  │ • Extractores        │  │
│  └──────────────┘  └──────────────────┘  └──────────────────────┘  │
│                           │                                         │
│                           ▼                                         │
│               ┌──────────────────────┐                              │
│               │SourceIngestionService│                              │
│               │  (Punto de entrada)  │                              │
│               └──────────────────────┘                              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Estructura del Contexto

```
source-ingestion/
├── index.ts                         # API pública del contexto
├── CLAUDE.md                        # Documentación para agentes
├── ARCHITECTURE.md                  # Este documento
├── __tests__/
│   ├── e2e.test.ts                 # Pruebas end-to-end
│   └── resource-buffer-upload.test.ts
│
├── composition/                     # Wiring del contexto
│   ├── factory.ts                  # ServicePolicy + resolveSourceIngestionModules()
│   └── index.ts
│
├── service/                         # Application Service (entry point)
│   ├── SourceIngestionService.ts   # Service principal
│   └── index.ts                    # createSourceIngestionService() factory
│
├── source/                          # Módulo de Source
│   ├── index.ts
│   ├── domain/
│   │   ├── Source.ts               # Aggregate Root
│   │   ├── SourceId.ts             # Value Object
│   │   ├── SourceType.ts           # Enum
│   │   ├── SourceVersion.ts        # Value Object
│   │   ├── SourceRepository.ts     # Port (interfaz)
│   │   ├── errors/
│   │   │   └── SourceErrors.ts
│   │   └── events/
│   │       ├── SourceRegistered.ts
│   │       ├── SourceUpdated.ts
│   │       └── SourceExtracted.ts
│   ├── infrastructure/
│   │   └── persistence/
│   │       ├── InMemorySourceRepository.ts
│   │       ├── indexeddb/
│   │       │   └── IndexedDBSourceRepository.ts
│   │       └── nedb/
│   │           └── NeDBSourceRepository.ts
│   └── composition/
│       ├── factory.ts              # sourceFactory(policy)
│       └── index.ts
│
├── resource/                        # Módulo de Resource
│   ├── index.ts
│   ├── domain/
│   │   ├── Resource.ts             # Aggregate Root
│   │   ├── ResourceId.ts           # Value Object
│   │   ├── ResourceStatus.ts       # Value Object (Stored/Failed/Deleted)
│   │   ├── StorageLocation.ts      # Value Object (uri + provider)
│   │   ├── ResourceRepository.ts   # Port
│   │   ├── ResourceStorage.ts      # Port (upload, delete, exists)
│   │   ├── errors/
│   │   │   └── ResourceErrors.ts
│   │   └── events/
│   │       ├── ResourceStored.ts
│   │       └── ResourceDeleted.ts
│   ├── infrastructure/
│   │   ├── persistence/
│   │   │   ├── InMemoryResourceRepository.ts
│   │   │   ├── indexeddb/
│   │   │   │   └── IndexedDBResourceRepository.ts
│   │   │   └── nedb/
│   │   │       └── NeDBResourceRepository.ts
│   │   └── storage/
│   │       ├── InMemoryResourceStorage.ts
│   │       └── LocalFileResourceStorage.ts
│   └── composition/
│       ├── factory.ts              # resourceFactory(policy)
│       └── index.ts
│
└── extraction/                      # Módulo de Extraction
    ├── index.ts
    ├── domain/
    │   ├── ExtractionJob.ts        # Aggregate Root
    │   ├── ExtractionJobId.ts      # Value Object
    │   ├── ExtractionStatus.ts     # Enum
    │   ├── ContentExtractor.ts     # Port (interfaz)
    │   ├── ExtractionJobRepository.ts
    │   ├── errors/
    │   │   └── ExtractionErrors.ts
    │   └── events/
    │       ├── ExtractionCompleted.ts
    │       └── ExtractionFailed.ts
    ├── application/
    │   ├── ExecuteExtraction.ts    # Use Case
    │   └── index.ts
    ├── infrastructure/
    │   ├── adapters/
    │   │   ├── TextContentExtractor.ts
    │   │   ├── BrowserPdfContentExtractor.ts
    │   │   └── ServerPdfContentExtractor.ts
    │   └── persistence/
    │       ├── InMemoryExtractionJobRepository.ts
    │       ├── indexeddb/
    │       │   └── IndexedDBExtractionJobRepository.ts
    │       └── nedb/
    │           └── NeDBExtractionJobRepository.ts
    └── composition/
        ├── factory.ts              # extractionFactory(policy)
        └── index.ts
```

---

## 3. Patrones de Diseño Implementados

### 3.1 Domain-Driven Design (DDD)

El módulo implementa los building blocks tácticos de DDD:

| Patrón | Implementación |
|--------|----------------|
| **Aggregate Root** | `Source`, `Resource`, `ExtractionJob` |
| **Value Object** | `SourceId`, `SourceVersion`, `ResourceId`, `ResourceStatus`, `StorageLocation`, `ExtractionJobId`, `ExtractionStatus` |
| **Domain Events** | `SourceRegistered`, `SourceUpdated`, `ResourceStored`, `ResourceDeleted`, `ExtractionCompleted`, `ExtractionFailed` |
| **Repository** | `SourceRepository`, `ResourceRepository`, `ExtractionJobRepository` (interfaces) |
| **Domain Errors** | `SourceError`, `ResourceError`, `ExtractionError` (jerarquía de errores) |

### 3.2 Arquitectura Hexagonal (Ports & Adapters)

```
                    ┌─────────────────────────────────────┐
                    │           APPLICATION               │
                    │  ┌───────────────────────────────┐  │
   Primary          │  │         USE CASES             │  │
   Adapters         │  │  RegisterSource, UpdateSource │  │
   (Driving)        │  │  StoreResource, GetResource   │  │
       │            │  │  ExecuteExtraction            │  │
       │            │  └───────────────────────────────┘  │
       ▼            │               │                     │
   ┌────────┐       │  ┌────────────┴────────────┐       │
   │ Service │──────►│  │         DOMAIN          │       │
   └────────┘       │  │  Source, Resource,       │       │
                    │  │  ExtractionJob           │       │
                    │  │  Value Objects            │       │
                    │  │  Domain Events            │       │
                    │  └─────────────────────────┘       │
                    │               │                     │
                    │               ▼                     │
                    │  ┌─────────────────────────────┐   │
                    │  │          PORTS              │   │  Secondary
                    │  │  SourceRepository          │   │  Adapters
                    │  │  ResourceRepository        │───┼──►(Driven)
                    │  │  ResourceStorage           │   │
                    │  │  ExtractionJobRepository   │   │
                    │  │  ContentExtractor          │   │
                    │  │  EventPublisher            │   │
                    │  └─────────────────────────────┘   │
                    └─────────────────────────────────────┘
```

**Ports (Interfaces):**
- `SourceRepository` - Persistencia de fuentes
- `ResourceRepository` - Persistencia de recursos
- `ResourceStorage` - Upload/delete de archivos
- `ExtractionJobRepository` - Persistencia de jobs
- `ContentExtractor` - Extracción de contenido
- `EventPublisher` - Publicación de eventos

**Adapters:**
- `InMemorySourceRepository` / `IndexedDBSourceRepository` / `NeDBSourceRepository`
- `InMemoryResourceRepository` / `IndexedDBResourceRepository` / `NeDBResourceRepository`
- `InMemoryResourceStorage` / `LocalFileResourceStorage`
- `TextContentExtractor` / `BrowserPdfContentExtractor` / `ServerPdfContentExtractor`
- `InMemoryEventPublisher`

### 3.3 Result Pattern (Functional Error Handling)

```typescript
// Use case retorna Result en lugar de lanzar excepciones
async execute(command): Promise<Result<SourceError, Source>> {
  if (!command.name) {
    return Result.fail(new SourceNameRequiredError());
  }
  // ...
  return Result.ok(source);
}

// Consumidor maneja el resultado de forma funcional
const result = await useCase.execute(command);
if (result.isFail()) {
  return Result.fail(result.error);
}
```

### 3.4 Factory Pattern

Dos niveles de factories:

```typescript
// Nivel 1: Factory de módulo — compone un módulo individual
const { useCases, infra } = await sourceFactory({
  provider: "server",
  dbPath: "./data",
});

// Nivel 2: Factory de contexto — compone todos los módulos y crea el Service
const service = await createSourceIngestionService({
  provider: "server",
  dbPath: "./data",
});
```

### 3.5 Strategy Pattern

```typescript
// ExtractorMap: estrategias de extracción por MIME type
type ExtractorMap = Map<string, ContentExtractor>;

// Selección dinámica de estrategia
const extractor = extractors.get(mimeType);
if (!extractor) {
  return Result.fail(new UnsupportedMimeTypeError(mimeType, supportedTypes));
}
const result = await extractor.extract(source);
```

### 3.6 Composition Pattern

La composición resuelve infraestructura dinámicamente según policies declarativas. Existe a dos niveles:

**Nivel módulo** (`[module]/composition/factory.ts`):
```typescript
// Resuelve infraestructura de un módulo individual
export async function sourceFactory(policy: SourceInfrastructurePolicy) {
  const repository = resolveRepository(policy);
  const eventPublisher = resolveEventPublisher(policy);
  return { useCases: { ... }, infra: { repository, eventPublisher } };
}
```

**Nivel contexto** (`composition/factory.ts`):
```typescript
// Orquesta las factories de todos los módulos
export async function resolveSourceIngestionModules(
  policy: SourceIngestionServicePolicy,
): Promise<ResolvedSourceIngestionModules> {
  const [sourceResult, extractionResult, resourceResult] = await Promise.all([
    sourceFactory(sourcePolicy),
    extractionFactory(extractionPolicy),
    resourceFactory(resourcePolicy),
  ]);
  return { extraction, sourceRepository, resourceStorage, ... };
}
```

### 3.7 Application Service Pattern

```typescript
// Service coordina los módulos del contexto
class SourceIngestionService {
  constructor(modules: ResolvedSourceIngestionModules) { ... }

  async registerSource(params): Promise<Result<DomainError, RegisterSourceSuccess>>
  async extractSource(params): Promise<Result<DomainError, ExtractSourceSuccess>>
  async ingestAndExtract(params): Promise<Result<DomainError, IngestAndExtractSuccess>>
  async ingestFile(params): Promise<Result<DomainError, IngestFileSuccess>>
  async batchRegister(sources): Promise<BatchResult[]>
  async batchIngestAndExtract(sources): Promise<BatchResult[]>
}
```

---

## 4. Decisiones de Diseño Clave

### 4.1 Tres Módulos Independientes

**Decisión:** Separar el contexto en tres módulos con responsabilidades distintas.

**Razón:**
- `Source` solo almacena referencias y metadata (no contenido)
- `Resource` gestiona archivos físicos y storage providers
- `ExtractionJob` gestiona la extracción real de texto
- Permite múltiples extracciones de la misma fuente
- Cada módulo tiene su propio ciclo de vida

```
Source (referencia lógica)        Resource (archivo físico)         ExtractionJob (contenido)
├── name: "Manual.pdf"            ├── originalName: "Manual.pdf"   ├── extractedText: "..."
├── uri: "/docs/manual.pdf"       ├── mimeType: "application/pdf"  ├── contentHash: "abc123"
├── type: Pdf                     ├── sizeBytes: 1024000           ├── metadata: {...}
└── versions: [v1, v2]           └── status: Stored               └── status: Completed
```

### 4.2 Versionado por Hash

**Decisión:** Detectar cambios comparando hashes SHA-256 del contenido.

**Razón:**
- No almacenar contenido duplicado en Source
- Detección eficiente de cambios
- Auditoría del historial de versiones

```typescript
recordExtraction(contentHash: string): boolean {
  if (this._currentVersion && !this._currentVersion.hasChanged(contentHash)) {
    return false; // Sin cambios
  }
  const newVersion = this._currentVersion
    ? this._currentVersion.next(contentHash)
    : SourceVersion.initial(contentHash);
  // ...
  return true; // Hubo cambios
}
```

### 4.3 Result Pattern sobre Excepciones

**Decisión:** Los use cases retornan `Result<Error, Value>` en lugar de lanzar excepciones.

**Razón:**
- Manejo explícito de errores en el type system
- Composición funcional de operaciones
- Mejor documentación de posibles errores
- Evita try/catch anidados

### 4.4 Políticas de Infraestructura

**Decisión:** Usar políticas declarativas para configurar infraestructura.

**Razón:**
- Configuración centralizada
- Fácil cambiar entre entornos (browser/server/in-memory)
- No modificar código de negocio
- Permite overrides granulares por módulo

```typescript
// Configuración simple
createSourceIngestionService({ provider: "server", dbPath: "./data" })

// Configuración con overrides por módulo
createSourceIngestionService({
  provider: "browser",
  overrides: {
    extraction: { provider: "server", dbPath: "./extractions" }
  }
})
```

### 4.5 ExtractorMap vs CompositeExtractor

**Decisión:** Usar `Map<string, ContentExtractor>` en lugar de un extractor compuesto.

**Razón:**
- Transparencia: el use case ve exactamente qué extractores hay
- Control: selección explícita por MIME type
- Extensibilidad: agregar extractores sin modificar código existente

### 4.6 Composición a dos niveles

**Decisión:** Separar la composición en nivel módulo y nivel contexto.

**Razón:**
- Nivel módulo: cada `[module]/composition/factory.ts` resuelve la infraestructura del módulo
- Nivel contexto: `composition/factory.ts` orquesta las factories de módulos y define la `ServicePolicy`
- El Service solo recibe dependencias resueltas (constructor injection puro)
- Single Responsibility: composición separada de lógica de negocio

---

## 5. Jerarquía de Errores de Dominio

```
DomainError (abstract)
├── NotFoundError (abstract)
│   ├── SourceNotFoundError
│   ├── ResourceNotFoundError
│   └── ExtractionJobNotFoundError
├── AlreadyExistsError (abstract)
│   ├── SourceAlreadyExistsError
│   └── ResourceAlreadyExistsError
├── ValidationError (abstract)
│   ├── SourceNameRequiredError
│   ├── SourceUriRequiredError
│   ├── SourceInvalidTypeError
│   ├── ResourceInvalidNameError
│   ├── ResourceInvalidMimeTypeError
│   └── ExtractionSourceIdRequiredError
├── InvalidStateError (abstract)
│   ├── ExtractionCannotStartError
│   ├── ExtractionCannotCompleteError
│   └── ExtractionCannotFailError
└── OperationError (abstract)
    ├── ExtractionFailedError
    ├── UnsupportedMimeTypeError
    ├── ResourceStorageFailedError
    └── ContentHashingError
```

---

## 6. Flujo de Datos

### 6.1 Registro de Source

```
┌─────────┐     ┌──────────────────┐     ┌────────────────┐     ┌────────────┐
│ Cliente │────►│ Service          │────►│ RegisterSource │────►│ Repository │
└─────────┘     │ registerSource() │     │ execute()      │     │ save()     │
                └──────────────────┘     └────────────────┘     └────────────┘
                                                │
                                                ▼
                                         ┌────────────────┐
                                         │ EventPublisher │
                                         │ publishAll()   │
                                         └────────────────┘
```

### 6.2 Extracción de Contenido

```
┌─────────┐     ┌──────────────────┐     ┌───────────────────┐
│ Cliente │────►│ Service          │────►│ SourceRepository  │
└─────────┘     │ extractSource()  │     │ findById()        │
                └────────┬─────────┘     └───────────────────┘
                         │
                         ▼
                ┌──────────────────┐     ┌─────────────────┐
                │ ExecuteExtraction│────►│ ExtractorMap    │
                │ execute()        │     │ get(mimeType)   │
                └────────┬─────────┘     └─────────────────┘
                         │
                         ▼
                ┌─────────────────┐
                │ ContentExtractor│
                │ extract()       │
                └────────┬────────┘
                         │
                         ▼
                ┌──────────────────────┐     ┌────────────────┐
                │ ExtractionJobRepo    │     │ EventPublisher │
                │ save(job)            │────►│ publishAll()   │
                └──────────────────────┘     └────────────────┘
                         │
                         ▼
                ┌──────────────────┐
                │ UpdateSource     │
                │ execute()        │
                └──────────────────┘
```

### 6.3 Ingesta de Archivo

```
┌─────────┐     ┌──────────────────┐
│ Cliente │────►│ Service          │
└─────────┘     │ ingestFile()     │
                └────────┬─────────┘
                         │
            ┌────────────┼────────────┐
            ▼            ▼            ▼
   ┌────────────┐ ┌────────────┐ ┌────────────┐
   │ 1. Store   │ │ 2. Register│ │ 3. Extract │
   │ Resource   │→│ Source     │→│ Content    │
   └────────────┘ └────────────┘ └────────────┘
```

---

## 7. Eventos de Dominio

| Evento | Trigger | Payload |
|--------|---------|---------|
| `SourceRegistered` | `Source.register()` | `{name, type, uri}` |
| `SourceUpdated` | `Source.recordExtraction()` | `{version, contentHash}` |
| `SourceExtracted` | `Source.recordExtraction()` | `{sourceId, contentHash}` |
| `ResourceStored` | `Resource.store()` | `{originalName, mimeType, storageLocation}` |
| `ResourceDeleted` | `Resource.delete()` | `{resourceId}` |
| `ExtractionCompleted` | `ExtractionJob.complete()` | `{sourceId, contentHash}` |
| `ExtractionFailed` | `ExtractionJob.fail()` | `{sourceId, error}` |

---

## 8. Tipos MIME Soportados

| SourceType | MIME Type | Extractor |
|------------|-----------|-----------|
| `PlainText` | `text/plain` | `TextContentExtractor` |
| `Markdown` | `text/markdown` | `TextContentExtractor` |
| `Csv` | `text/csv` | `TextContentExtractor` |
| `Json` | `application/json` | `TextContentExtractor` |
| `Web` | `text/html` | `TextContentExtractor` |
| `Pdf` | `application/pdf` | `BrowserPdfContentExtractor` / `ServerPdfContentExtractor` |

---

## 9. Configuración de Infraestructura

### 9.1 Opciones de Persistencia

| Provider | Repositorio | Uso |
|----------|-------------|-----|
| `in-memory` | `InMemory*Repository` | Testing, desarrollo |
| `browser` | `IndexedDB*Repository` | Aplicación web |
| `server` | `NeDB*Repository` | Aplicación Node.js |

### 9.2 Ejemplos de Configuración

```typescript
// Testing
const service = await createSourceIngestionService({ provider: "in-memory" });

// Browser app
const service = await createSourceIngestionService({
  provider: "browser",
  dbName: "knowledge-platform",
});

// Server app
const service = await createSourceIngestionService({
  provider: "server",
  dbPath: "./data",
});

// Híbrido (overrides por módulo)
const service = await createSourceIngestionService({
  provider: "browser",
  overrides: {
    extraction: { provider: "server", dbPath: "./extractions" },
  },
});
```

---

## 10. Extensibilidad

### 10.1 Agregar Nuevo Extractor

```typescript
// 1. Implementar interfaz ContentExtractor
class DocxContentExtractor implements ContentExtractor {
  canExtract(mimeType: string): boolean {
    return mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }

  async extract(source: ExtractionSource): Promise<ExtractionResult> {
    // Implementación...
  }
}

// 2. Registrar en la factory de extracción
```

### 10.2 Agregar Nuevo Repositorio

```typescript
// 1. Implementar interfaz SourceRepository
class PostgresSourceRepository implements SourceRepository {
  // Implementación...
}

// 2. Agregar caso en la factory de composición del módulo source
```

---

## 11. Testing

### 11.1 Test E2E Incluido

El archivo `__tests__/e2e.test.ts` valida:

1. Creación de Service
2. Registro de Source
3. Extracción de contenido
4. Flujo completo (ingest + extract)
5. Detección de cambios
6. Operaciones batch
7. Extracción de PDF real

### 11.2 Ejecutar Tests

```bash
pnpm --filter @klay/core test:source-ingestion

# Con PDF personalizado
pnpm --filter @klay/core test:source-ingestion -- /ruta/al/documento.pdf
```

---

## 12. Dependencias

### 12.1 Producción

| Dependencia | Uso |
|-------------|-----|
| `pdfjs-dist` | Extracción PDF en browser |
| `pdf-extraction` | Extracción PDF en server |
| `nedb-promises` | Persistencia en server |

### 12.2 Compartidas (shared/)

| Módulo | Propósito |
|--------|-----------|
| `Entity`, `AggregateRoot` | Clases base de dominio |
| `ValueObject`, `UniqueId` | Value objects base |
| `Result` | Patrón Result funcional |
| `DomainError` | Errores de dominio base |
| `EventPublisher` | Publicación de eventos |

---

*Documento generado para el proyecto klay+ - Knowledge Platform*
*Última actualización: Febrero 2026*
