# UI–Core Alignment: Incremental Design

**Date:** 2026-03-07
**Goal:** Translate @klay/core capabilities into user-facing workflows across 4 incremental iterations.

## Context

The core exposes 5 bounded contexts, 3 orchestrators, and rich domain models. The current UI covers the happy path (ingest → search → manage sources) but hides lifecycle controls, relationships, advanced search, and metadata the core already tracks.

## Iteration 1: Context Lifecycle + Metadata Visible

### Explicit Context Creation (low friction)

- "New Context" button on `/contexts` page
- Form fields (all optional with smart defaults):
  - **Name**: auto-generated if empty (e.g. `Context-2026-03-07`)
  - **Description**: empty OK
  - **Language**: default `en`
  - **Processing Profile**: default to simplest available
- Created in `Active` state by default
- Existing implicit flow from Documents page unchanged

### Context States Visible and Actionable

- State badge (`Active`, `Archived`, `Deprecated`) on ContextCard and ContextDashboard
- Transition actions in context dashboard:
  - Active → Archive
  - Active → Deprecate (with reason)
  - Deprecated → Activate (restore)
  - Archived = terminal, read-only
- Archived/deprecated contexts hide mutation actions (Add Source, Reprocess)

### Metadata Visible

- **ContextSourcesPage**: source name, type (PDF/MD/TXT), contentHash, extraction date, size
- **ContextDashboard**: language, required profile, createdBy, creation date
- **ContextCard** (list): state + source count + profile name

### New API Routes

- `POST /api/lifecycle/create-context`
- `POST /api/lifecycle/archive-context`
- `POST /api/lifecycle/deprecate-context`
- `POST /api/lifecycle/activate-context`

---

## Iteration 2: Context Linking

### Related Contexts UI

- "Related Contexts" section in Context Dashboard
- "Link Context" button → context selector + relationship type
- Relationship types: `related`, `parent`, `child`, `depends-on`, `derived-from`
- Each relation shows: target context (name + state) + type + unlink button

### Context List Indicators

- ContextCard: link icon + count if context has relations
- No graph visualization in this iteration — flat list of connections

### API

- Already exist: `POST /api/lifecycle/link`, `POST /api/lifecycle/unlink`
- Only UI wiring needed

### Constraints

- Cannot link archived contexts
- Unlink requires confirmation
- Multiple relations per context allowed

---

## Iteration 3: Advanced Search

### Filter Panel

- Collapsible "Advanced Filters" below search input (both global and context-scoped)
- Filters:
  - **Context** — selector (global search only)
  - **Source** — sourceId autocomplete from manifests
  - **Status** — complete / partial / failed
  - **Top K** — numeric input (move from current position)
  - **Min Score** — slider 0–1 (move from current position)

### Enriched Results

- Each result shows: chunk content, score (visual bar), sourceId, contextId, embedding model
- Surface metadata already returned by `RetrievalItem`

### API

- No changes needed — `SearchKnowledgeInput.filters` already supports this

---

## Iteration 4: Polish + Data Visibility

### Manifest Inspector

- Expandable rows in ContextSourcesPage showing full manifest detail:
  resourceId, extractionJobId, projectionId, completedSteps (visual timeline),
  failedStep, contentHash, model, dimensions, chunks count

### Projections with Context

- ContextProjectionsPage: show profile name (not just ID), chunking/embedding strategy names, generation date
- Resolve profile via `listProfiles()` lookup

### Version Diffs

- ContextVersionsPage: show what changed vs previous version (sources added/removed)
- Diff computed from `ContextVersion.sources[]` snapshots

### Global Dashboard Improvements

- Context distribution by state (Active/Archived/Deprecated)
- Top contexts by source count
- Last pipeline error (if any failed)

---

## Summary

| Iter | Focus | New Endpoints | New Components |
|------|-------|---------------|----------------|
| 1 | Lifecycle + metadata | 4 | CreateContextForm, state badges, transition actions |
| 2 | Context linking | 0 (exist) | RelatedContexts section, LinkContextForm |
| 3 | Advanced search | 0 | FilterPanel, enriched results |
| 4 | Polish + visibility | 0 | Manifest inspector, version diffs, dashboard improvements |
