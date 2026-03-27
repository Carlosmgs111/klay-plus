# klay+

Plataforma de conocimiento semantico. Transforma documentos en conocimiento buscable por similitud vectorial.

**Pipeline**: Ingesta → Extraccion → Chunking → Embeddings → Busqueda semantica

## Que hace

- Ingesta documentos (PDF, texto, markdown, CSV, JSON)
- Extrae y segmenta el contenido en chunks semanticos
- Genera embeddings vectoriales (hash local, HuggingFace ONNX, OpenAI, Cohere)
- Almacena en vector store (IndexedDB en browser, NeDB en servidor)
- Busqueda por similitud semantica con ranking configurable (dense, MMR, cross-encoder)
- Organiza fuentes en contextos con perfiles de procesamiento versionados
- Funciona 100% en el navegador o como servidor Node.js

## Stack

| Capa | Tecnologia |
|------|-----------|
| Core | TypeScript, DDD (4 bounded contexts), dual runtime |
| Web | Astro SSR, React 19, TailwindCSS |
| Persistencia | IndexedDB (browser), NeDB (server), InMemory (test) |
| Embeddings | Hash (offline), @huggingface/transformers (ONNX), AI SDK (OpenAI/Cohere) |

## Puesta en marcha

### Requisitos

- Node.js >= 18
- pnpm >= 8

### Instalacion

```bash
git clone https://github.com/Carlosmgs111/klay-plus.git
cd klay-plus
pnpm install
```

### Desarrollo

```bash
pnpm dev
```

Abre `http://localhost:4321`. La app inicia en **browser mode** por defecto (IndexedDB + hash embeddings, sin configuracion adicional).

### Tests

```bash
pnpm test:core    # 313 tests (vitest)
```

### Build produccion

```bash
pnpm build
```

## Modos de ejecucion

| Modo | Persistencia | Embeddings | Uso |
|------|-------------|------------|-----|
| **Browser** | IndexedDB | Hash (default), HuggingFace ONNX (descargable) | Demo, desarrollo, Vercel |
| **Server** | NeDB (filesystem) | Hash, HuggingFace, OpenAI, Cohere | Produccion local |

El toggle de modo esta en **Settings**. En deployments cloud (Vercel), el modo se bloquea automaticamente a browser.

## Variables de entorno (opcionales)

Solo necesarias si usas embeddings externos en modo servidor:

```env
OPENAI_API_KEY=sk-...
COHERE_API_KEY=...
HUGGINGFACE_API_KEY=hf_...
```

## Estructura del proyecto

```
klay-plus/
  packages/core/     @klay/core — DDD domain library
  apps/web/          @klay/web  — Astro dashboard
```

### Arquitectura core

```
src/
  index.ts           API publica
  composition/       Factory (resolveConfig → coreWiring → KnowledgeApplication)
  pipelines/         Pipeline cross-context (ProcessKnowledge)
  contexts/
    source-ingestion/        Ingesta + extraccion de texto
    context-management/      Agrupacion de fuentes + lineage
    semantic-processing/     Chunking + embeddings + vector store
    knowledge-retrieval/     Busqueda semantica
  config/            Perfiles de infraestructura, config store
  shared/            DDD building blocks
```

## Licencia

[Apache 2.0](LICENSE)
