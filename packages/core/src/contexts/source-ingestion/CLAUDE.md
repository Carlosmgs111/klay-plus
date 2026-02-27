# Source Ingestion — Bounded Context

## Subdominio

Adquisicion de contenido y extraccion de texto. Este contexto es la puerta de entrada del sistema: recibe contenido desde diversas fuentes externas y produce texto extraido listo para procesamiento semantico.

## Service: `SourceIngestionService`

Punto de entrada unico del contexto. Coordina los 3 modulos internos.

### Capacidades expuestas

| Operacion | Descripcion | Modulos involucrados |
|-----------|-------------|---------------------|
| `registerSource` | Registra una referencia a source sin extraccion | source |
| `extractSource` | Extrae texto de un source ya registrado | source, extraction |
| `ingestAndExtract` | Registra + extrae en una llamada | source, extraction |
| `ingestExtractAndReturn` | Registra + extrae + retorna texto completo | source, extraction |
| `ingestFile` | Sube archivo → registra source → extrae | resource, source, extraction |
| `ingestExternalResource` | Registra referencia externa → registra source → extrae | resource, source, extraction |
| `batchRegister` | Registro paralelo de multiples sources | source |
| `batchIngestAndExtract` | Ingesta + extraccion paralela de multiples sources | source, extraction |

### Composicion

La composicion vive en `composition/` a nivel raiz del contexto (no dentro de `service/`):

```
composition/
├── factory.ts    → SourceIngestionServicePolicy + resolveSourceIngestionModules()
└── index.ts      → re-exports

resolveSourceIngestionModules(policy)
├── sourceFactory(policy)      → { useCases: SourceUseCases, infra }
├── resourceFactory(policy)    → { useCases: ResourceUseCases, infra }
└── extractionFactory(policy)  → { useCases: ExtractionUseCases, infra }
```

El Service recibe las dependencias resueltas via constructor injection:
```
createSourceIngestionService(policy) → resolveModules(policy) → new SourceIngestionService(modules)
```

---

## Modulos

### 1. Source (`source/`) — [Ver detalle](source/CLAUDE.md)

**Responsabilidad**: Representa una referencia logica a una fuente de contenido. NO almacena contenido — solo metadata, tipo y tracking de versiones via content hash.

**Aggregate Root**: `Source`
- Constructor privado + `create()` / `reconstitute()`
- Campos: name, uri, type, contentHash, extractedAt, version

**Value Objects**: `SourceId`, `SourceType` (PDF, WEB, API, PLAIN_TEXT, MARKDOWN, CSV, JSON), `SourceVersion`

**Eventos**:
- `SourceRegistered` (`source-ingestion.source.registered`)
- `SourceUpdated` (`source-ingestion.source.updated`) — cuando la extraccion produce un nuevo content hash
- `SourceExtracted` (`source-ingestion.source.extracted`)

**Use Cases**: `RegisterSource`, `UpdateSource`

**Port**: `SourceRepository`

---

### 2. Resource (`resource/`) — [Ver detalle](resource/CLAUDE.md)

**Responsabilidad**: Representa un archivo fisico o referencia externa. Gestiona upload a storage providers y el ciclo de vida del recurso (Stored → Deleted).

**Aggregate Root**: `Resource`
- Campos: originalName, mimeType, sizeBytes, status, storageLocation

**Value Objects**: `ResourceId`, `ResourceStatus` (Stored / Failed / Deleted), `StorageLocation` (uri + provider)

**Eventos**:
- `ResourceStored` — archivo subido o referencia externa registrada
- `ResourceDeleted` — recurso eliminado

**Use Cases**: `StoreResource`, `RegisterExternalResource`, `DeleteResource`, `GetResource`

**Ports**: `ResourceRepository`, `ResourceStorage` (upload, delete, exists)

**Implementaciones de Storage**: `InMemoryResourceStorage`, `LocalFileResourceStorage`

---

### 3. Extraction (`extraction/`) — [Ver detalle](extraction/CLAUDE.md)

**Responsabilidad**: Ejecuta la extraccion real de texto desde el contenido de un source. Gestiona el ciclo de vida de extraction jobs (Pending → Running → Completed / Failed).

**Aggregate Root**: `ExtractionJob`
- Campos: sourceId, status, extractedText, contentHash, mimeType, metadata, error

**Value Objects**: `ExtractionJobId`, `ExtractionStatus` (Pending / Running / Completed / Failed)

**Eventos**:
- `ExtractionCompleted` — extraccion exitosa (lleva sourceId, contentHash)
- `ExtractionFailed` — extraccion fallida (lleva sourceId, error)

**Use Cases**: `ExecuteExtraction`

**Ports**: `ExtractionJobRepository`, `ContentExtractor` (pluggable por MIME type)

**Implementaciones de Extractor**:
- `TextContentExtractor` — texto plano, markdown, CSV, JSON
- `BrowserPdfContentExtractor` — PDF en browser (pdfjs-dist)
- `ServerPdfContentExtractor` — PDF en server (pdf-extraction)

---

## Tipos de Source Soportados

| SourceType | Descripcion | Extractor |
|------------|-------------|-----------|
| `PLAIN_TEXT` | Texto plano | TextContentExtractor |
| `MARKDOWN` | Markdown | TextContentExtractor |
| `CSV` | Datos tabulares | TextContentExtractor |
| `JSON` | Datos estructurados | TextContentExtractor |
| `PDF` | Documentos PDF | BrowserPdf / ServerPdf (segun environment) |
| `WEB` | Paginas web | (pendiente de implementacion) |
| `API` | Respuestas de API | (pendiente de implementacion) |
