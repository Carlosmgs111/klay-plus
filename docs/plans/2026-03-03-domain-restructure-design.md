# Domain Restructure: Source-Centric Projection Model

**Date**: 2026-03-03
**Status**: Approved
**Motivation**: Eliminate projection duplication across contexts, make sources self-sufficient

## Problem

In the current model, projections belong to SemanticUnits. When the same source appears in multiple units, its projections are generated N times — once per unit. This creates unnecessary processing costs (embeddings, chunking, API calls) and prevents sources from being queried independently.

## Design

### Entity Hierarchy

```
Source (self-sufficient aggregate)
  ├── immutable data (uri, type, extracted content)
  └── ProjectionHub (sub-entity, 1:1, auto-created)
       └── Projection[] (one per applied profile)
            ├── profileId
            ├── result (chunks, embeddings, etc.)
            └── generation metadata

Context (formerly SemanticUnit)
  ├── requiredProfileId (required projection profile)
  ├── sources[] (references to linked Sources)
  ├── versions[] (history of source add/remove)
  └── on source linking:
       ├── hub has projection with requiredProfileId? → link directly
       └── doesn't have it? → trigger processing → then link
```

### Bounded Contexts

| Context | Responsibility | Owns |
|---------|---------------|------|
| **source-ingestion** | Document ingestion and extraction | Source (registration, content extraction) |
| **source-knowledge** (new) | Per-source projection management | Source (full aggregate with ProjectionHub), Projection |
| **semantic-processing** | Processing strategy execution | ProcessingProfile, chunking/embedding logic |
| **context-management** (rename from semantic-knowledge) | Knowledge composition | Context (groups sources, declares required profile, versions) |
| **knowledge-retrieval** | Semantic search | Query (read-side) |

### Key Flows

**Flow A — Independent source (testing/exploration)**

1. User registers source + default profile
2. source-ingestion extracts content
3. source-knowledge creates ProjectionHub
4. semantic-processing generates projection with default profile
5. source-knowledge stores projection in hub
6. User queries that source's projections directly

**Flow B — Source linked to Context (production)**

1. User links source to Context (requiredProfileId = X)
2. Context checks if source's hub has projection with profile X
3. If YES: link, new Context version
4. If NO: trigger processing with profile X → store in hub → link, new Context version

**Flow C — Reuse**

1. Source A already has projection with profile X (generated for Context 1)
2. User links Source A to Context 2 (also requires profile X)
3. Verification: projection with profile X exists → direct link, zero processing

### Invariants

- Every source has exactly one ProjectionHub (1:1, inseparable)
- ProjectionHub is auto-created on source registration
- A Context declares a `requiredProfileId` at creation time
- Every source within a Context must have a projection matching the required profile
- Context versions reflect source history (add/remove), not projections
- Projections are immutable — same source + same profile = same result

### Migration from Current Model

| Before | After |
|--------|-------|
| Projection belongs to SemanticUnit | Projection belongs to Source.ProjectionHub |
| SemanticUnit manages sources + projections + profiles | Context only manages sources and declares required profile |
| Source cannot operate without SemanticUnit | Source is self-sufficient with its hub |
| Projections duplicated across units | Projections reused across Contexts |
| 4 bounded contexts | 5 bounded contexts (source-knowledge new) |
| SemanticUnit, UnitSource, UnitVersion, VersionSourceSnapshot | Context, ContextSource (ref), ContextVersion |

## Design Rationale

- **Source as base of the system**: Sources and their projection hubs are the foundation. They can operate independently for testing and exploration.
- **Context as composition layer**: Contexts compose sources into queryable knowledge bases without owning projections.
- **Reactive projection generation**: When a source is linked to a Context that requires a profile the source doesn't have yet, processing is triggered automatically. This enriches the source's projection library organically.
- **New bounded context (source-knowledge)**: Rather than overloading source-ingestion, a dedicated context cleanly owns the Source aggregate with its ProjectionHub and projections. Each bounded context stays isolated with clear responsibility.
