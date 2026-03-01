# Product Requirements Document — klay+

**Version**: 0.1.0
**Status**: Living document
**Last updated**: 2026-03-01

---

## 1. Problem Statement

### What problem exists today?

People accumulate documents (notes, PDFs, articles, code docs) across tools and formats. When they need to find something, they depend on exact keyword search or their own memory. The information is there — they just can't reach it by *meaning*.

### Who has this problem?

| Persona              | Description                                          | Current workaround                       |
| -------------------- | ---------------------------------------------------- | ---------------------------------------- |
| **Knowledge worker** | Manages tens to hundreds of reference documents      | Manual folder organization + Ctrl+F      |
| **Researcher**       | Collects papers, notes, and data from diverse sources| Tagging systems, citation managers        |
| **Developer**        | Wants semantic search in their own applications      | Build from scratch with raw embeddings   |

### What happens if we don't solve it?

Knowledge stays siloed in files. Finding related information requires remembering where it is or guessing the right keywords. Connections between documents are invisible. Time is wasted re-reading instead of retrieving.

---

## 2. Product Vision

### One-liner

> **klay+** enables knowledge workers to transform documents into a semantically searchable knowledge base so they can find information by meaning, not by exact words.

### Success looks like

A user drops a PDF into the system. Minutes later, they type a natural language question and get back the relevant passages — ranked by semantic similarity — regardless of the exact wording used in the original document. The system runs locally without sending data to external services.

---

## 3. Functional Requirements

### 3.1 Content Ingestion

| ID    | Requirement                                            | Priority     | Notes                              |
| ----- | ------------------------------------------------------ | ------------ | ---------------------------------- |
| FR-01 | Ingest plain text documents                            | Must have    | UTF-8 encoded                      |
| FR-02 | Ingest Markdown documents                              | Must have    | Preserves structure metadata       |
| FR-03 | Ingest PDF documents                                   | Must have    | Via PDF.js (browser) or server lib |
| FR-04 | Register external resources by URI                     | Must have    | URLs, file paths                   |
| FR-05 | Upload files directly                                  | Must have    | With storage management            |
| FR-06 | Batch ingestion of multiple documents                  | Should have  |                                    |
| FR-07 | Ingest CSV and JSON                                    | Nice to have | Types defined, extraction pending  |
| FR-08 | Ingest web pages by URL                                | Nice to have | Type defined, scraping pending     |

### 3.2 Semantic Processing

| ID    | Requirement                                            | Priority     | Notes                              |
| ----- | ------------------------------------------------------ | ------------ | ---------------------------------- |
| FR-09 | Split content into chunks using configurable strategies| Must have    | Recursive, sentence, fixed-size    |
| FR-10 | Generate vector embeddings for each chunk              | Must have    | Hash (local) or OpenAI (API)       |
| FR-11 | Store vectors for similarity search                    | Must have    | NeDB (server) or IndexedDB (browser)|
| FR-12 | Create and manage processing profiles                  | Must have    | Declarative strategy selection     |
| FR-13 | Support in-browser embedding via WebLLM                | Should have  | No API key, runs on WebGPU         |
| FR-14 | Deprecate profiles without deleting them               | Should have  | Prevents use in new processing     |

### 3.3 Knowledge Management

| ID    | Requirement                                            | Priority     | Notes                              |
| ----- | ------------------------------------------------------ | ------------ | ---------------------------------- |
| FR-15 | Create semantic units from ingested content            | Must have    | Hub model — one unit, many sources |
| FR-16 | Add multiple sources to a single semantic unit         | Must have    | Each source maintains ownership    |
| FR-17 | Automatic versioning on every mutation                 | Must have    | Immutable snapshots                |
| FR-18 | Rollback to a previous version                         | Must have    | Non-destructive pointer move       |
| FR-19 | Remove a source from a semantic unit                   | Must have    | Creates new version without it     |
| FR-20 | Track transformation lineage                           | Should have  | Audit trail of all changes         |
| FR-21 | Link semantic units with named relationships           | Should have  | Bidirectional graph edges          |
| FR-22 | Deprecate and archive semantic units                   | Should have  | Lifecycle state machine            |

### 3.4 Search and Retrieval

| ID    | Requirement                                            | Priority     | Notes                              |
| ----- | ------------------------------------------------------ | ------------ | ---------------------------------- |
| FR-23 | Search by natural language query                       | Must have    | Cosine similarity on embeddings    |
| FR-24 | Configure topK and minimum relevance score             | Must have    |                                    |
| FR-25 | Return content snippets with relevance scores          | Must have    |                                    |
| FR-26 | Batch queries                                          | Nice to have |                                    |
| FR-27 | Filter results by metadata, tags, or source type       | Nice to have | Port defined, not yet implemented  |

### 3.5 Web Dashboard

| ID    | Requirement                                            | Priority     | Notes                              |
| ----- | ------------------------------------------------------ | ------------ | ---------------------------------- |
| FR-28 | Dashboard with ingestion metrics and pipeline status   | Must have    |                                    |
| FR-29 | Document ingestion form                                | Must have    |                                    |
| FR-30 | Search interface with results display                  | Must have    |                                    |
| FR-31 | Knowledge base browser (list semantic units)           | Must have    |                                    |
| FR-32 | Processing profile management UI                       | Must have    |                                    |
| FR-33 | Settings page with runtime mode toggle                 | Must have    | Server ↔ Browser switch            |
| FR-34 | Theme selection (light/dark/system)                    | Should have  |                                    |

### 3.6 Dual Runtime

| ID    | Requirement                                            | Priority     | Notes                              |
| ----- | ------------------------------------------------------ | ------------ | ---------------------------------- |
| FR-35 | Server mode: Astro SSR + NeDB + fetch-based APIs      | Must have    |                                    |
| FR-36 | Browser mode: IndexedDB + direct imports, no server    | Must have    | Privacy-first, offline capable     |
| FR-37 | Same domain logic runs in both modes                   | Must have    | Core library is runtime-agnostic   |
| FR-38 | Runtime switchable from the UI without restart         | Should have  |                                    |

---

## 4. Non-Functional Requirements

| Area             | Requirement                                          | Target                                   |
| ---------------- | ---------------------------------------------------- | ---------------------------------------- |
| **Performance**  | Search response time                                 | < 500ms for 10K chunks                   |
| **Performance**  | Document ingestion (text)                            | < 2s for a 10-page document              |
| **Scalability**  | Documents per knowledge base                         | Hundreds (current), thousands (target)    |
| **Security**     | No data leaves the machine in browser mode           | Zero external API calls with hash embeddings |
| **Security**     | API keys stored server-side only                     | Never exposed to browser                  |
| **Compatibility**| Browser support                                      | Chrome, Firefox, Edge (WebGPU for WebLLM) |
| **Compatibility**| Node.js                                              | 18+                                       |
| **Data**         | No data loss on server restart                       | NeDB persists to disk                     |
| **Data**         | Browser data persists across sessions                | IndexedDB (until browser clear)           |

---

## 5. User Workflows

### Workflow 1: Ingest and Search

```
1. User navigates to /documents
2. Fills in: document name, URI/file, source type, language
3. Clicks "Ingest"
4. System: extracts text → creates semantic unit → chunks → embeds → stores vectors
5. User navigates to /search
6. Types natural language query (e.g., "how does authentication work?")
7. System: embeds query → finds nearest vectors → ranks results
8. User sees ranked passages with relevance scores
```

**Entry point**: /documents
**Success state**: Relevant passages appear in search results
**Error states**: Extraction failure (unsupported format), processing failure (embedding provider unavailable)

### Workflow 2: Custom Processing

```
1. User navigates to /profiles
2. Creates profile: "Detailed Analysis" — Sentence chunking + OpenAI embeddings
3. Navigates to /documents
4. Ingests document selecting the new profile
5. System processes with sentence-level chunks and high-dimensional embeddings
6. Search results are more precise for that document
```

**Entry point**: /profiles
**Success state**: Document processed with the custom profile
**Error states**: Invalid strategy combination, missing API key for OpenAI

### Workflow 3: Offline / Privacy Mode

```
1. User navigates to /settings
2. Switches to Browser Mode
3. System reinitializes with IndexedDB + Hash embeddings
4. User ingests documents — all data stays in browser
5. User searches — no network requests made
6. Closing browser preserves data in IndexedDB
```

**Entry point**: /settings
**Success state**: Full pipeline works without network access
**Error states**: IndexedDB quota exceeded, WebGPU not supported (for WebLLM)

---

## 6. Scope

### In scope (Phase 1 — current)

- [x] Text, Markdown, and PDF ingestion
- [x] Configurable chunking (recursive, sentence, fixed-size)
- [x] Configurable embeddings (hash, OpenAI, WebLLM)
- [x] Semantic search with relevance scoring
- [x] Processing profile management
- [x] Web dashboard with 6 pages
- [x] Dual runtime (server + browser)
- [x] Immutable versioning and rollback
- [x] Lineage tracking

### Out of scope (explicitly excluded)

- User authentication — single-user system for now
- Multi-tenancy — one knowledge base per instance
- Real-time collaboration — no concurrent editing
- Document editing — ingest-only, source documents are immutable
- Custom ML model training — uses pre-trained embeddings only

### Future phases

| Phase   | Capabilities                                           | Trigger to start                    |
| ------- | ------------------------------------------------------ | ----------------------------------- |
| Phase 2 | Auth, batch operations, advanced search filters, deletion/reindexing | Phase 1 stable + user feedback |
| Phase 3 | Collaboration, graph visualization, webhooks, analytics | Multi-user demand                  |

---

## 7. Constraints

| Constraint       | Description                                              | Impact                                     |
| ---------------- | -------------------------------------------------------- | ------------------------------------------ |
| **Technical**    | NeDB is file-based, not a production database            | Limits scale to hundreds of documents       |
| **Technical**    | Hash embeddings are low-dimensional (128d)               | Lower search quality than neural embeddings |
| **Technical**    | WebLLM requires WebGPU support                           | Not available in all browsers               |
| **Budget**       | OpenAI API calls have cost                               | Hash embedding as free default              |
| **Dependencies** | PDF extraction quality varies by document complexity     | Some PDFs may extract poorly                |

---

## 8. Success Metrics

| Metric                              | Target            | How to measure                               |
| ----------------------------------- | ----------------- | -------------------------------------------- |
| Document ingestion success rate     | > 95%             | Completed pipelines / total attempts          |
| Search relevance (top-5 precision)  | > 70%             | Manual evaluation on test queries             |
| Search response time                | < 500ms           | Measured at API level                         |
| Pipeline end-to-end time            | < 5s per document | From ingest to searchable                     |
| Zero data loss                      | 100%              | All ingested documents retrievable after restart |

---

## 9. Assumptions and Risks

### Assumptions

| #  | Assumption                                                  | If wrong, then...                                   |
| -- | ----------------------------------------------------------- | --------------------------------------------------- |
| 1  | Hash embeddings provide acceptable baseline search quality  | Users won't find results useful without OpenAI/WebLLM |
| 2  | Users have documents in text, markdown, or PDF format       | Need to add more extractors sooner                   |
| 3  | Single-user is sufficient for Phase 1                       | Need auth before any real deployment                 |
| 4  | NeDB handles the expected document volume                   | Need to migrate to SQLite or similar                 |

### Risks

| #  | Risk                                          | Probability | Impact | Mitigation                         |
| -- | --------------------------------------------- | ----------- | ------ | ---------------------------------- |
| 1  | OpenAI API changes or pricing increases       | Medium      | Medium | Hash embedding as fallback         |
| 2  | WebLLM browser support remains limited        | Medium      | Low    | Hash as universal default          |
| 3  | PDF extraction quality for complex layouts    | High        | Medium | Document supported formats clearly |
| 4  | IndexedDB quota limits for large knowledge bases | Low      | High   | Warn user, suggest server mode     |

---

## 10. Glossary

| Term                    | Definition                                                                                |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| **Semantic Unit**       | The central knowledge entity — a hub where multiple sources contribute content             |
| **Source**              | A reference to an external document (file, URL) with extracted text                        |
| **Projection**          | The vectorized representation of a semantic unit's content (embeddings)                    |
| **Processing Profile**  | A declarative configuration that defines which chunking and embedding strategies to use    |
| **Chunk**              | A segment of text produced by splitting a document according to a chunking strategy         |
| **Embedding**          | A numerical vector representation of text that captures semantic meaning                    |
| **Version**            | An immutable snapshot of a semantic unit's state at a point in time                         |
| **Lineage**            | The audit trail of all transformations applied to a semantic unit                           |
| **Rollback**           | Reverting a semantic unit to a previous version by moving a pointer (non-destructive)       |
| **Pipeline**           | The orchestrated flow: Ingest → Create Unit → Add Source → Process → Store                  |
| **Vector Store**       | The persistence layer for embeddings, enabling similarity search                            |
| **Cosine Similarity**  | The mathematical measure used to rank search results by semantic closeness (0 to 1)         |
| **Hub Model**          | The architectural pattern where SemanticUnit acts as a convergence point for multiple sources|

---

## Revision History

| Date       | Author | Changes       |
| ---------- | ------ | ------------- |
| 2026-03-01 |        | Initial draft |
