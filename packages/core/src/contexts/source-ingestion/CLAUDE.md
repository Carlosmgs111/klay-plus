# Source Ingestion — Bounded Context

## Subdominio

Adquisicion de contenido y extraccion de texto. Puerta de entrada del sistema: recibe contenido desde diversas fuentes externas y produce texto extraido listo para procesamiento semantico.

### Composicion

El contexto no tiene service layer — su API publica es el resultado del wiring.

```
Module-level wirings:
  source/composition/
    factory.ts   → sourceFactory(policy) → { infra: { repository, eventPublisher } }
    wiring.ts    → sourceWiring(policy, deps) → use cases (needs extraction + resource deps)
  resource/composition/
    factory.ts   → resourceFactory(policy) → { infra }
    wiring.ts    → resourceWiring(policy) → use cases (self-contained)
  extraction/composition/
    factory.ts   → extractionFactory(policy) → { useCases, infra }
    wiring.ts    → extractionWiring(policy) → { executeExtraction, extractionJobRepository }

Context-level wiring (source-ingestion/index.ts):
  sourceIngestionWiring(policy) → calls extraction → resource → source wirings, resolves intra-context deps
```

---

## Module: Source (`source/`)

Representa una referencia logica a una fuente de contenido externo. **No almacena contenido** — solo metadata, tipo y tracking de versiones via content hash.

**Aggregate Root**: `Source` — Constructor privado + `create()` / `reconstitute()`
- Propiedades: name, uri, type (`SourceType`), currentVersion (`SourceVersion | null`), versions[], registeredAt, hasBeenExtracted (getter)
- Ciclo de vida: Registrado (sin extraccion) → Extraido (con content hash)

**Value Objects**: `SourceId`, `SourceType` (PDF, WEB, API, PLAIN_TEXT, MARKDOWN, CSV, JSON), `SourceVersion`

**Eventos**:
| Evento | Significado |
|--------|-------------|
| `SourceRegistered` | Nueva referencia de source creada |
| `SourceUpdated` | Content hash cambio (nueva extraccion detectada) |
| `SourceExtracted` | Extraccion completada para este source |

**Use Cases**: `RegisterSource`, `UpdateSource`

**Port**: `SourceRepository` — `save`, `findById`, `delete`, `findByUri`, `exists`

**Repos**: InMemory (test), IndexedDB (browser), NeDB (server)

**Nota de diseno**: Source es un aggregate de referencia pura. El texto extraido vive en `ExtractionJob` (modulo extraction). Source solo trackea *que* se extrajo via content hash en `SourceVersion`.

---

## Module: Resource (`resource/`)

Representa un archivo fisico o referencia externa. Gestiona upload a storage providers y el ciclo de vida del recurso.

**Aggregate Root**: `Resource` — Factories: `Resource.store()`, `Resource.reference()`, `Resource.reconstitute()`
- Propiedades: originalName, mimeType, size, status (`ResourceStatus`), storageLocation (`StorageLocation | null`), createdAt
- Ciclo de vida: `Pending` → `Stored` / `Failed` / `Deleted`

**Value Objects**: `ResourceId`, `ResourceStatus` (Pending, Stored, Failed, Deleted), `StorageLocation` (uri + provider)

**Eventos**: `ResourceStored`, `ResourceDeleted`

**Use Cases**: `StoreResource`, `RegisterExternalResource`, `DeleteResource`, `GetResource`

**Ports**: `ResourceRepository` (CRUD + `findByStatus`, `exists`), `ResourceStorage` (`upload`, `delete`, `exists`)

**Storage impls**: `InMemoryResourceStorage` (test), `LocalFileResourceStorage` (server)
**Repos**: InMemory (test), IndexedDB (browser), NeDB (server)

---

## Module: Extraction (`extraction/`)

Ejecuta la extraccion real de texto desde el contenido de un source. Delega a content extractors pluggables por MIME type.

**Aggregate Root**: `ExtractionJob` — Constructor privado + `create()` / `reconstitute()`
- Propiedades: sourceId, status (`ExtractionStatus`), extractedText, contentHash, metadata, error, startedAt, completedAt, createdAt
- Ciclo de vida: `Pending` → `Running` → `Completed` / `Failed`
- Maquina de estados: `create()` → `start()` → `complete(result)` / `fail(error)`

**Value Objects**: `ExtractionJobId`, `ExtractionStatus` (Pending, Running, Completed, Failed)

**Eventos**: `ExtractionCompleted` (sourceId, contentHash), `ExtractionFailed` (sourceId, error)

**Use Cases**: `ExecuteExtraction`

**Ports**: `ExtractionJobRepository` (CRUD), `ContentExtractor` (pluggable por MIME type)

**ContentExtractor interface**:
```typescript
interface ContentExtractor {
  canExtract(mimeType: string): boolean;
  extract(source: { uri: string; content?: ArrayBuffer; mimeType: string }):
    Promise<{ text: string; contentHash: string; metadata: Record }>;
}
```

**Extractors**: `TextContentExtractor` (PLAIN_TEXT, MARKDOWN, CSV, JSON), `BrowserPdfContentExtractor` (PDF via pdfjs-dist), `ServerPdfContentExtractor` (PDF via pdf-extraction)
**Repos**: InMemory (test), IndexedDB (browser), NeDB (server)

---

## Tipos de Source Soportados

| SourceType | Extractor | Estado |
|------------|-----------|--------|
| `PLAIN_TEXT` | TextContentExtractor | Implementado |
| `MARKDOWN` | TextContentExtractor | Implementado |
| `CSV` | TextContentExtractor | Implementado |
| `JSON` | TextContentExtractor | Implementado |
| `PDF` | BrowserPdf / ServerPdf (segun environment) | Implementado |
| `WEB` | (pendiente) | Pendiente |
| `API` | (pendiente) | Pendiente |
