# Domain Mapping Framework

A lightweight, 4-step framework for mapping a problem domain before writing code.
Designed for solo developers and small teams. ~1 hour from zero to actionable architecture.

---

## Step 1 — The Problem in One Sentence

> "I need a system that **[core transformation]** so that **[actor]** can **[expected outcome]**"

Fill in:

| Element              | Value |
| -------------------- | ----- |
| **Core transformation** |       |
| **Primary actor**       |       |
| **Expected outcome**    |       |

### Validation checklist

- [ ] The transformation describes a *change of state*, not a feature list
- [ ] The actor is concrete (user, admin, external system), not abstract
- [ ] The outcome describes *value delivered*, not technical implementation

---

## Step 2 — The Transformation Chain

> What happens to the input from the moment it enters until it becomes the output?

```
[Input] --> Verb_1 --> Verb_2 --> Verb_3 --> ... --> [Output]
```

Fill in:

```
[          ] -->           -->           -->           --> [          ]
```

Each verb is a **candidate bounded context**.

### Guidelines

- Use domain verbs, not technical ones ("Acquire" not "POST to API")
- 3-5 verbs is the sweet spot. Less than 3 = probably a CRUD app. More than 5 = probably over-decomposed
- Order matters: the chain should read as a natural narrative
- If a verb is trivial (no real logic), merge it with its neighbor
- If a verb is too complex (does multiple unrelated things), split it

### Context viability check

For each verb, ask: *Does this have its own language, its own rules, its own reason to change?*

| Verb | Own language? | Own rules? | Own reason to change? | Keep as context? |
| ---- | ------------- | ---------- | --------------------- | ---------------- |
|      |               |            |                       |                  |
|      |               |            |                       |                  |
|      |               |            |                       |                  |
|      |               |            |                       |                  |

---

## Step 3 — Actors, Capabilities, Events, and Ports per Stage

Fill one table per bounded context identified in Step 2.

### Context: _______________

| Aspect                                   | Value |
| ---------------------------------------- | ----- |
| **Who acts?** (human, system, automated) |       |
| **What can they do?** (capabilities)     |       |
| **What happens?** (domain events)        |       |
| **What does it need from outside?** (ports) |    |

### Naming conventions

- **Capabilities** = imperative verbs: "Register source", "Process content"
- **Events** = past participle: `SourceRegistered`, `ContentProcessed`
- **Ports** = noun describing the need: `ContentExtractor`, `VectorStore`

### Port identification questions

Ask for each context:
1. Does it need to **persist** something? --> Repository port
2. Does it need to **communicate** with an external system? --> Gateway port
3. Does it need a **pluggable behavior** (algorithm, strategy)? --> Strategy port
4. Does it need to **notify** other contexts? --> EventPublisher port

---

## Step 4 — The Central Concept (Aggregate Root)

> For each context, ask: *What does everything revolve around?*

Fill one card per bounded context.

### Context: _______________

```
ConceptName
  |-- key property 1
  |-- key property 2
  |-- state: State_A --> State_B --> State_C
  |
  |  Satellites: RelatedConcept1, RelatedConcept2
```

### Aggregate design rules

- **One aggregate root per context** is the starting point. Add more only when you find independent invariants
- The aggregate **protects its invariants** (validation rules that must always be true)
- External contexts reference aggregates **by ID only**, never by direct object
- If a satellite can exist independently, it might be its own aggregate

### Invariant checklist

| Invariant (rule that must always be true) | Enforced by |
| ----------------------------------------- | ----------- |
|                                           |             |
|                                           |             |

---

## Output: The Domain Map

Once you complete steps 1-4, you have a full map. Summarize it here.

### Actors --> Chain --> Central Concepts

```
ACTORS                  CHAIN                     CENTRAL CONCEPT
------                  -----                     ---------------
                  -->  [Verb_1]  -- Concept_1 -->
                  -->  [Verb_2]  -- Concept_2 -->
                  -->  [Verb_3]  -- Concept_3 -->
```

### Ports Map (what each context needs from outside)

```
Context_1:  Port_A, Port_B
Context_2:  (self-sufficient)
Context_3:  Port_C, Port_D
```

### Cross-Context Data Flow

> What data flows between contexts? Only IDs and primitive values should cross boundaries.

| From | To | Data transferred |
| ---- | -- | ---------------- |
|      |    |                  |
|      |    |                  |

---

## Decision Log

Record key decisions made during domain mapping. These inform future developers.

| # | Decision | Alternatives considered | Reason |
| - | -------- | ----------------------- | ------ |
| 1 |          |                         |        |
| 2 |          |                         |        |

---

## What Comes Next

After completing this map:

1. **Prioritize**: Which context is the core domain? Start there
2. **Scaffold**: Create the directory structure matching your contexts
3. **Implement one vertical slice**: Pick the simplest capability in the core context and implement it end-to-end (domain --> application --> infrastructure)
4. **Iterate**: Add capabilities one at a time, referencing this map

### Recommended directory structure

```
src/
  contexts/
    {context-1}/
      {module}/
        domain/           # Entities, value objects, events, ports
        application/      # Use cases
        infrastructure/   # Adapters, persistence
      service/            # Context's public API
      composition/        # Factory, dependency wiring
    {context-2}/
      ...
  shared/
    domain/               # AggregateRoot, Entity, ValueObject, Result, DomainError
  application/            # Orchestrators (cross-context coordination)
```

---

## Appendix: Reference Example (klay+)

<details>
<summary>Step 1 — Problem</summary>

> "I need a system that **converts documents into semantically searchable knowledge** so that **a user** can **find information by meaning, not exact keywords**"

| Element              | Value                                              |
| -------------------- | -------------------------------------------------- |
| **Core transformation** | Documents --> Semantically searchable knowledge |
| **Primary actor**       | User                                            |
| **Expected outcome**    | Find information by semantic meaning            |

</details>

<details>
<summary>Step 2 — Transformation Chain</summary>

```
[Document] --> Acquire --> Represent --> Vectorize --> Query --> [Search Result]
```

| Verb      | Own language?         | Own rules?               | Own reason to change?     | Context            |
| --------- | --------------------- | ------------------------ | ------------------------- | ------------------ |
| Acquire   | source, resource, extraction | MIME types, storage | New document formats      | Source Ingestion   |
| Represent | unit, version, source, lineage | Hub model, versioning | Knowledge model evolution | Semantic Knowledge |
| Vectorize | projection, profile, chunk, embedding | Strategy selection, profiling | New ML models | Semantic Processing |
| Query     | query, result, score  | Ranking, filtering       | Search UX improvements    | Knowledge Retrieval |

</details>

<details>
<summary>Step 3 — Capabilities per Context</summary>

**Source Ingestion**

| Aspect       | Value                                                                 |
| ------------ | --------------------------------------------------------------------- |
| **Who acts?**   | User (uploads file), External system (API)                         |
| **Capabilities** | Register source, Upload file, Extract content, Register external resource |
| **Events**      | `SourceRegistered`, `ResourceStored`, `ExtractionCompleted`, `ExtractionFailed` |
| **Ports**       | `ResourceStorage`, `ContentExtractor`                              |

**Semantic Knowledge**

| Aspect       | Value                                                                 |
| ------------ | --------------------------------------------------------------------- |
| **Who acts?**   | Pipeline (automatic), User (manual management)                    |
| **Capabilities** | Create unit, Add source, Remove source, Reprocess, Rollback, Link units, Deprecate |
| **Events**      | `UnitCreated`, `SourceAdded`, `SourceRemoved`, `UnitVersioned`, `UnitRolledBack`, `UnitDeprecated` |
| **Ports**       | (self-sufficient -- core domain)                                   |

**Semantic Processing**

| Aspect       | Value                                                                 |
| ------------ | --------------------------------------------------------------------- |
| **Who acts?**   | Pipeline (automatic)                                               |
| **Capabilities** | Process content, Create/update/deprecate processing profile       |
| **Events**      | `ProjectionGenerated`, `ProjectionFailed`, `ProfileCreated`, `ProfileUpdated`, `ProfileDeprecated` |
| **Ports**       | `ChunkingStrategy`, `EmbeddingStrategy`, `VectorWriteStore`        |

**Knowledge Retrieval**

| Aspect       | Value                                                                 |
| ------------ | --------------------------------------------------------------------- |
| **Who acts?**   | User (searches)                                                    |
| **Capabilities** | Semantic search                                                   |
| **Events**      | (none -- read-only)                                                |
| **Ports**       | `QueryEmbedder`, `VectorReadStore`, `RankingStrategy`              |

</details>

<details>
<summary>Step 4 — Central Concepts</summary>

**Acquire --> Source**
```
Source
  |-- name, uri, type (PDF|WEB|MARKDOWN|CSV|JSON|API)
  |-- contentHash
  |-- Lifecycle: Registered --> Extracted
  |
  |  Satellites: Resource (physical file), ExtractionJob (extraction process)
```

**Represent --> SemanticUnit (hub)**
```
SemanticUnit
  |-- name, description, language
  |-- state: Draft --> Active <--> Deprecated --> Archived
  |-- sources[] (pool of all added sources)
  |-- versions[] (immutable snapshots)
  |     |-- UnitVersion { version#, profileId, sourceSnapshots[] }
  |-- currentVersionNumber (pointer, rollback = move pointer)
  |
  |  Satellites: KnowledgeLineage (transformation audit trail)
```

**Vectorize --> SemanticProjection + ProcessingProfile**
```
ProcessingProfile (declarative config)
  |-- chunkingStrategyId, embeddingStrategyId
  |-- version (auto-increments)
  |-- status: Active --> Deprecated

SemanticProjection (processing result)
  |-- semanticUnitId, sourceId
  |-- status: Pending --> Processing --> Completed|Failed
  |-- result: { chunks, dimensions, model }
```

**Query --> Query (stateless)**
```
Query (transient value)
  |-- text, topK, minScore, filters
  |-- --> RetrievalResult { items[], totalFound }
```

</details>

<details>
<summary>Domain Map Summary</summary>

```
ACTORS                    CHAIN                         CENTRAL CONCEPT
------                    -----                         ---------------
User, ExtSystem ---> [Acquire]     -- Source ----------> extractedText
Pipeline (auto) ---> [Represent]   -- SemanticUnit ----> version + snapshots
Pipeline (auto) ---> [Vectorize]   -- Projection ------> vectors in store
User            ---> [Query]       -- Query -----------> ranked results
```

```
PORTS
-----
Acquire:    ResourceStorage, ContentExtractor
Represent:  (self-sufficient)
Vectorize:  ChunkingStrategy, EmbeddingStrategy, VectorWriteStore
Query:      QueryEmbedder, VectorReadStore, RankingStrategy
```

| From     | To        | Data transferred                          |
| -------- | --------- | ----------------------------------------- |
| Acquire  | Represent | sourceId, extractedText, contentHash      |
| Represent| Vectorize | unitId, version, content, profileId       |
| Vectorize| Query     | Shared vector store (write/read)          |

</details>
