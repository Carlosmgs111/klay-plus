# Extraction — Module

## Responsabilidad

Ejecuta la extraccion real de texto desde el contenido de un source. Gestiona el ciclo de vida de extraction jobs y delega la extraccion a content extractors pluggables por MIME type.

## Aggregate Root: `ExtractionJob`

Constructor privado + `create()` / `reconstitute()`.

**Propiedades**:
- `sourceId` — referencia al source que se extrae
- `status` — `ExtractionStatus`
- `extractedText` — texto extraido (`string | null`)
- `contentHash` — hash para deteccion de cambios (`string | null`)
- `metadata` — metadata adicional de la extraccion (`Record | null`)
- `error` — mensaje de error (`string | null`)
- `startedAt`, `completedAt` — timestamps de ejecucion
- `createdAt` — timestamp de creacion

**Ciclo de vida**: `Pending` → `Running` → `Completed` / `Failed`

**Maquina de estados**:
- `create()` — nuevo job en Pending
- `start()` — transiciona a Running
- `complete(result)` — transiciona a Completed, registra texto + hash + metadata, emite evento
- `fail(error)` — transiciona a Failed, registra error, emite evento

## Value Objects

| Value Object | Descripcion |
|-------------|-------------|
| `ExtractionJobId` | Identidad unica |
| `ExtractionStatus` | Enum: `Pending`, `Running`, `Completed`, `Failed` |

## Eventos de Dominio

| Evento | Significado |
|--------|-------------|
| `ExtractionCompleted` | Extraccion exitosa (lleva sourceId, contentHash) |
| `ExtractionFailed` | Extraccion fallida (lleva sourceId, error) |

## Use Cases

| Use Case | Descripcion |
|----------|-------------|
| `ExecuteExtraction` | Orquestador principal de extraccion |

## Ports

| Port | Responsabilidad |
|------|----------------|
| `ExtractionJobRepository` | CRUD de jobs |
| `ContentExtractor` | Extraccion pluggable por MIME type |

### Interfaz ContentExtractor

```typescript
interface ContentExtractor {
  canExtract(mimeType: string): boolean;
  extract(source: { uri: string; content?: ArrayBuffer; mimeType: string }):
    Promise<{ text: string; contentHash: string; metadata: Record }>;
}
```

## Implementaciones de Extractor

| Implementacion | Tipos soportados | Entorno |
|---------------|-----------------|---------|
| `TextContentExtractor` | PLAIN_TEXT, MARKDOWN, CSV, JSON | Cualquiera |
| `BrowserPdfContentExtractor` | PDF (via pdfjs-dist) | Browser |
| `ServerPdfContentExtractor` | PDF (via pdf-extraction) | Server |

## Implementaciones de Repository

| Implementacion | Entorno |
|---------------|---------|
| `InMemoryExtractionJobRepository` | Testing/desarrollo |
| `IndexedDBExtractionJobRepository` | Browser |
| `NeDBExtractionJobRepository` | Server |
