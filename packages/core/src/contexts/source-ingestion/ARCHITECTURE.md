# Source Ingestion - Informe Arquitectónico

## 1. Visión General

El módulo **source-ingestion** es un Bounded Context que implementa el patrón de ingesta de contenido para la plataforma de conocimiento. Su responsabilidad principal es gestionar referencias a fuentes externas y extraer su contenido de forma controlada.

```
┌─────────────────────────────────────────────────────────────────┐
│                    SOURCE INGESTION CONTEXT                     │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐              ┌──────────────────────┐    │
│  │  Source Module   │              │  Extraction Module   │    │
│  │  ──────────────  │              │  ──────────────────  │    │
│  │  • Referencias   │              │  • Jobs de extracción│    │
│  │  • Metadata      │◄────────────►│  • Contenido extraído│    │
│  │  • Versiones     │              │  • Extractores       │    │
│  └──────────────────┘              └──────────────────────┘    │
│                          │                                      │
│                          ▼                                      │
│              ┌─────────────────────┐                           │
│              │ SourceIngestionFacade│                          │
│              │ (Punto de entrada)   │                          │
│              └─────────────────────┘                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Estructura del Módulo

```
source-ingestion/
├── index.ts                         # API pública del contexto
├── ARCHITECTURE.md                  # Este documento
├── __tests__/
│   └── e2e.test.ts                 # Pruebas end-to-end
│
├── application/
│   └── facade/
│       ├── SourceIngestionFacade.ts # Façade principal
│       ├── index.ts
│       └── composition/
│           ├── SourceIngestionFacadeComposer.ts
│           └── infra-policies.ts
│
├── source/                          # Módulo de Source
│   ├── index.ts
│   ├── domain/
│   │   ├── Source.ts               # Aggregate Root
│   │   ├── SourceId.ts             # Value Object
│   │   ├── SourceType.ts           # Enum
│   │   ├── SourceVersion.ts        # Value Object
│   │   ├── SourceRepository.ts     # Port (interfaz)
│   │   ├── errors/                 # Errores de dominio
│   │   │   ├── SourceErrors.ts
│   │   │   └── index.ts
│   │   └── events/
│   │       ├── SourceRegistered.ts
│   │       ├── SourceUpdated.ts
│   │       └── SourceExtracted.ts
│   ├── application/
│   │   ├── RegisterSource.ts       # Use Case
│   │   ├── UpdateSource.ts         # Use Case
│   │   └── index.ts
│   ├── infrastructure/
│   │   └── persistence/
│   │       ├── InMemorySourceRepository.ts
│   │       ├── indexeddb/
│   │       │   └── IndexedDBSourceRepository.ts
│   │       └── nedb/
│   │           └── NeDBSourceRepository.ts
│   └── composition/
│       ├── SourceComposer.ts
│       ├── source.factory.ts
│       └── infra-policies.ts
│
└── extraction/                      # Módulo de Extraction
    ├── index.ts
    ├── domain/
    │   ├── ExtractionJob.ts        # Aggregate Root
    │   ├── ExtractionJobId.ts      # Value Object
    │   ├── ExtractionStatus.ts     # Enum
    │   ├── ContentExtractor.ts     # Port (interfaz)
    │   ├── ExtractionJobRepository.ts
    │   ├── errors/                 # Errores de dominio
    │   │   ├── ExtractionErrors.ts
    │   │   └── index.ts
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
    │       └── nedb/
    └── composition/
        ├── ExtractionComposer.ts
        ├── extraction.factory.ts
        └── infra-policies.ts
```

---

## 3. Patrones de Diseño Implementados

### 3.1 Domain-Driven Design (DDD)

El módulo implementa los building blocks tácticos de DDD:

| Patrón | Implementación |
|--------|----------------|
| **Aggregate Root** | `Source`, `ExtractionJob` |
| **Value Object** | `SourceId`, `SourceVersion`, `ExtractionJobId`, `ExtractionStatus` |
| **Domain Events** | `SourceRegistered`, `SourceUpdated`, `ExtractionCompleted`, `ExtractionFailed` |
| **Repository** | `SourceRepository`, `ExtractionJobRepository` (interfaces) |
| **Domain Errors** | `SourceError`, `ExtractionError` (jerarquía de errores) |

### 3.2 Arquitectura Hexagonal (Ports & Adapters)

```
                    ┌─────────────────────────────────────┐
                    │           APPLICATION               │
                    │  ┌───────────────────────────────┐  │
   Primary          │  │         USE CASES             │  │
   Adapters         │  │  RegisterSource, UpdateSource │  │
   (Driving)        │  │     ExecuteExtraction         │  │
       │            │  └───────────────────────────────┘  │
       │            │               │                     │
       ▼            │  ┌────────────┴────────────┐       │
   ┌────────┐       │  │         DOMAIN          │       │
   │ Facade │──────►│  │  Source, ExtractionJob  │       │
   └────────┘       │  │    Value Objects        │       │
                    │  │    Domain Events        │       │
                    │  └─────────────────────────┘       │
                    │               │                     │
                    │               ▼                     │
                    │  ┌─────────────────────────────┐   │
                    │  │          PORTS              │   │  Secondary
                    │  │  SourceRepository          │   │  Adapters
                    │  │  ExtractionJobRepository   │───┼──►(Driven)
                    │  │  ContentExtractor          │   │
                    │  │  EventPublisher            │   │
                    │  └─────────────────────────────┘   │
                    └─────────────────────────────────────┘
```

**Ports (Interfaces):**
- `SourceRepository` - Persistencia de fuentes
- `ExtractionJobRepository` - Persistencia de jobs
- `ContentExtractor` - Extracción de contenido
- `EventPublisher` - Publicación de eventos

**Adapters:**
- `InMemorySourceRepository` / `IndexedDBSourceRepository` / `NeDBSourceRepository`
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
result.match({
  ok: (source) => console.log(`Created: ${source.id}`),
  fail: (error) => console.error(`Error: ${error.message}`),
});
```

### 3.4 Factory Pattern

```typescript
// Factory compone el módulo completo
const { useCases, infra } = await sourceFactory({
  type: "server",
  dbPath: "./data",
});

// Factory de facade compone todos los módulos
const facade = await createSourceIngestionFacade({
  type: "browser",
  dbName: "my-app",
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

### 3.6 Composer Pattern

```typescript
// Composer resuelve infraestructura dinámicamente
class SourceComposer {
  static async resolve(policy: SourceInfrastructurePolicy): Promise<ResolvedSourceInfra> {
    const repository = await this.resolveRepository(policy);
    const eventPublisher = this.resolveEventPublisher(policy);
    return { repository, eventPublisher };
  }
}
```

### 3.7 Façade Pattern

```typescript
// Facade simplifica la interacción con el contexto
class SourceIngestionFacade {
  async registerSource(params): Promise<Result<DomainError, RegisterSourceSuccess>>
  async extractSource(params): Promise<Result<DomainError, ExtractSourceSuccess>>
  async ingestAndExtract(params): Promise<Result<DomainError, IngestAndExtractSuccess>>
  async batchRegister(sources): Promise<BatchResult[]>
  async batchIngestAndExtract(sources): Promise<BatchResult[]>
}
```

---

## 4. Decisiones de Diseño Clave

### 4.1 Separación Source / Extraction

**Decisión:** Separar el módulo en dos sub-módulos con responsabilidades distintas.

**Razón:**
- `Source` solo almacena referencias y metadata (no contenido)
- `ExtractionJob` almacena el contenido extraído
- Permite múltiples extracciones de la misma fuente
- Reduce duplicación de datos
- Facilita el versionado independiente

```
Source (referencia)                ExtractionJob (contenido)
├── name: "Manual.pdf"             ├── extractedText: "..."
├── uri: "/docs/manual.pdf"        ├── contentHash: "abc123"
├── type: Pdf                      ├── metadata: {...}
└── versions: [                    └── status: Completed
      {version: 1, hash: "abc123"},
      {version: 2, hash: "def456"}
    ]
```

### 4.2 Versionado por Hash

**Decisión:** Detectar cambios comparando hashes SHA-256 del contenido.

**Razón:**
- No almacenar contenido duplicado en Source
- Detección eficiente de cambios
- Auditoría del historial de versiones
- Bajo costo de almacenamiento

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
- Facilita el testing

```typescript
// Antes (excepciones)
try {
  const source = await registerSource.execute(cmd);
  const extraction = await executeExtraction.execute(cmd2);
} catch (e) {
  // ¿Qué tipo de error?
}

// Después (Result)
const sourceResult = await registerSource.execute(cmd);
if (sourceResult.isFail()) {
  return Result.fail(sourceResult.error);
}
const extractionResult = await executeExtraction.execute(cmd2);
// Cada error tiene su tipo específico
```

### 4.4 Políticas de Infraestructura

**Decisión:** Usar políticas declarativas para configurar infraestructura.

**Razón:**
- Configuración centralizada
- Fácil cambiar entre entornos (browser/server)
- No modificar código de negocio
- Permite overrides granulares

```typescript
// Configuración simple
createSourceIngestionFacade({ type: "server", dbPath: "./data" })

// Configuración mixta
createSourceIngestionFacade({
  type: "browser",
  overrides: {
    extraction: { type: "server", dbPath: "./extractions" }
  }
})
```

### 4.5 ExtractorMap vs CompositeExtractor

**Decisión:** Usar `Map<string, ContentExtractor>` en lugar de un extractor compuesto.

**Razón:**
- Transparencia: el use case ve exactamente qué extractores hay
- Control: selección explícita por MIME type
- Debugging: fácil identificar qué extractor se usa
- Extensibilidad: agregar extractores sin modificar código existente

```typescript
// Registro explícito de extractores
const extractors: ExtractorMap = new Map();
extractors.set("text/plain", textExtractor);
extractors.set("application/pdf", pdfExtractor);
extractors.set("text/markdown", textExtractor);

// Selección directa en use case
const extractor = extractors.get(command.mimeType);
if (!extractor) {
  return Result.fail(new UnsupportedMimeTypeError(...));
}
```

### 4.6 Composer dedicado por aspecto

**Decisión:** Métodos dedicados en Composer para resolver cada aspecto de infraestructura.

**Razón:**
- Single Responsibility: cada método resuelve un aspecto
- Testeable: se pueden testear resoluciones individuales
- Extensible: fácil agregar nuevos aspectos
- Claro: intención explícita

```typescript
class ExtractionComposer {
  private static async resolveRepository(policy): Promise<ExtractionJobRepository>
  private static resolveExtractors(policy): Promise<ExtractorMap>
  private static resolveEventPublisher(policy): EventPublisher

  static async resolve(policy): Promise<ResolvedExtractionInfra> {
    return {
      repository: await this.resolveRepository(policy),
      extractors: await this.resolveExtractors(policy),
      eventPublisher: this.resolveEventPublisher(policy),
    };
  }
}
```

---

## 5. Jerarquía de Errores de Dominio

```
DomainError (abstract)
├── NotFoundError (abstract)
│   ├── SourceNotFoundError
│   └── ExtractionJobNotFoundError
├── AlreadyExistsError (abstract)
│   └── SourceAlreadyExistsError
├── ValidationError (abstract)
│   ├── SourceNameRequiredError
│   ├── SourceUriRequiredError
│   ├── SourceInvalidUriError
│   ├── SourceInvalidTypeError
│   └── ExtractionSourceIdRequiredError
├── InvalidStateError (abstract)
│   ├── ExtractionCannotStartError
│   ├── ExtractionCannotCompleteError
│   └── ExtractionCannotFailError
└── OperationError (abstract)
    ├── ExtractionFailedError
    ├── UnsupportedMimeTypeError
    └── ContentHashingError
```

Cada error incluye:
- `code`: Código único para identificación programática
- `message`: Mensaje descriptivo
- `context`: Metadata adicional
- `timestamp`: Momento del error
- `toJSON()`: Serialización para logging/API

---

## 6. Flujo de Datos

### 6.1 Registro de Source

```
┌─────────┐     ┌─────────────────┐     ┌────────────────┐     ┌────────────┐
│ Cliente │────►│ Facade          │────►│ RegisterSource │────►│ Repository │
└─────────┘     │ registerSource()│     │ execute()      │     │ save()     │
                └─────────────────┘     └────────────────┘     └────────────┘
                                               │
                                               ▼
                                        ┌────────────────┐
                                        │ EventPublisher │
                                        │ publishAll()   │
                                        └────────────────┘
```

### 6.2 Extracción de Contenido

```
┌─────────┐     ┌─────────────────┐     ┌───────────────────┐
│ Cliente │────►│ Facade          │────►│ SourceRepository  │
└─────────┘     │ extractSource() │     │ findById()        │
                └────────┬────────┘     └───────────────────┘
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

---

## 7. Eventos de Dominio

| Evento | Trigger | Payload |
|--------|---------|---------|
| `SourceRegistered` | `Source.register()` | `{name, type, uri}` |
| `SourceUpdated` | `Source.recordExtraction()` | `{version, contentHash}` |
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

| Política | Repositorio | Uso |
|----------|-------------|-----|
| `in-memory` | `InMemorySourceRepository` | Testing, desarrollo |
| `browser` | `IndexedDBSourceRepository` | Aplicación web |
| `server` | `NeDBSourceRepository` | Aplicación Node.js |

### 9.2 Ejemplos de Configuración

```typescript
// Testing
const facade = await createSourceIngestionFacade({ type: "in-memory" });

// Browser app
const facade = await createSourceIngestionFacade({
  type: "browser",
  dbName: "knowledge-platform",
});

// Server app
const facade = await createSourceIngestionFacade({
  type: "server",
  dbPath: "./data/source-ingestion",
});

// Híbrido (overrides)
const facade = await createSourceIngestionFacade({
  type: "browser",
  overrides: {
    extraction: { type: "server", dbPath: "./extractions" },
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

// 2. Registrar en política de extracción
const facade = await createSourceIngestionFacade({
  type: "server",
  overrides: {
    extraction: {
      customExtractors: new Map([
        ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", new DocxContentExtractor()],
      ]),
    },
  },
});
```

### 10.2 Agregar Nuevo Repositorio

```typescript
// 1. Implementar interfaz SourceRepository
class PostgresSourceRepository implements SourceRepository {
  // Implementación...
}

// 2. Agregar caso en SourceComposer
private static async resolveRepository(policy): Promise<SourceRepository> {
  switch (policy.type) {
    case "postgres":
      return new PostgresSourceRepository(policy.connectionString);
    // ... otros casos
  }
}
```

---

## 11. Testing

### 11.1 Test E2E Incluido

El archivo `__tests__/e2e.test.ts` valida:

1. ✅ Creación de Facade
2. ✅ Registro de Source
3. ✅ Extracción de contenido
4. ✅ Flujo completo (ingest + extract)
5. ✅ Detección de cambios
6. ✅ Operaciones batch
7. ✅ Extracción de PDF real

### 11.2 Ejecutar Tests

```bash
npm run test:source-ingestion

# Con PDF personalizado
npm run test:source-ingestion -- /ruta/al/documento.pdf
```

---

## 12. Dependencias

### 12.1 Producción

| Dependencia | Uso |
|-------------|-----|
| `pdfjs-dist` | Extracción PDF en browser |
| `pdf-extraction` | Extracción PDF en server |
| `nedb` | Persistencia en server |

### 12.2 Compartidas (shared/)

| Módulo | Propósito |
|--------|-----------|
| `Entity`, `AggregateRoot` | Clases base de dominio |
| `ValueObject`, `UniqueId` | Value objects base |
| `Result` | Patrón Result funcional |
| `DomainError` | Errores de dominio base |
| `EventPublisher` | Publicación de eventos |

---

## 13. Próximos Pasos Sugeridos

1. **Integración con otros contextos**: Conectar con Semantic Processing
2. **Event Bus distribuido**: Reemplazar InMemoryEventPublisher con Redis/Kafka
3. **Más extractores**: Audio, video, imágenes (OCR)
4. **Caching**: Caché de contenido extraído
5. **Retry policies**: Reintentos en extracción fallida
6. **Métricas**: Observabilidad del pipeline

---

*Documento generado para el proyecto klay+ - Knowledge Platform*
*Última actualización: Febrero 2025*
