---
name: sdd-orchestrate
description: >
  SDD orchestration operational details — sub-agent launching patterns, dependency graph, state tracking, and execution strategies.
  Trigger: Invoked automatically by the orchestrator when starting any SDD workflow (new, continue, ff, apply, verify, archive).
license: MIT
metadata:
  author: gentleman-programming
  version: "1.0"
---

# SDD Orchestrator — Operational Guide

This skill contains the operational details for SDD orchestration. The core rules (delegate-only, triggers, commands) are in `.claude/CLAUDE.md`.

## Command → Skill Mapping

| Command | Skill to Invoke |
|---------|----------------|
| `/sdd-init` | sdd-init |
| `/sdd-explore` | sdd-explore |
| `/sdd-new` | sdd-explore → sdd-propose |
| `/sdd-continue` | Next needed from: sdd-spec, sdd-design, sdd-tasks |
| `/sdd-ff` | sdd-propose → sdd-spec → sdd-design → sdd-tasks (all in sequence) |
| `/sdd-apply` | sdd-apply |
| `/sdd-verify` | sdd-verify |
| `/sdd-archive` | sdd-archive |

## Sub-Agent Launching Pattern

When launching a sub-agent via Task tool:

```
Task(
  description: '{phase} for {change-name}',
  subagent_type: 'general',
  prompt: 'You are an SDD sub-agent. Read the skill file at ~/.claude/skills/sdd-{phase}/SKILL.md FIRST, then follow its instructions exactly.

  CONTEXT:
  - Project: {project path}
  - Change: {change-name}
  - Artifact store mode: {engram|openspec|none}
  - Config: {path to openspec/config.yaml}
  - Previous artifacts: {list of paths to read}

  TASK:
  {specific task description}

  Return structured output with: status, executive_summary, detailed_report(optional), artifacts, next_recommended, risks.'
)
```

## Dependency Graph

```
proposal → specs ──→ tasks → apply → verify → archive
              ↕
           design
```

- specs and design can be created in parallel (both depend only on proposal)
- tasks depends on BOTH specs and design
- verify is optional but recommended before archive

## State Tracking

After each sub-agent completes, update tracking state:

```
Change: {change-name}
Artifacts: proposal ✓ | specs ✓ | design ✗ | tasks ✗
Phase: {current phase}
Tasks completed: {N}/{total} (if in apply phase)
Blockers: {list or none}
```

Present this summary to the user between sub-agent calls. If using Engram, save state with key `sdd-state/{change-name}`.

## Fast-Forward (/sdd-ff)

Execute in strict sequence — do NOT parallelize:
1. Launch sdd-propose sub-agent → wait for completion
2. Launch sdd-spec sub-agent (pass proposal as context) → wait
3. Launch sdd-design sub-agent (pass proposal + specs) → wait
4. Launch sdd-tasks sub-agent (pass proposal + specs + design) → wait
5. Present consolidated summary to user (all 4 artifacts at once, not between each)

If any step fails, stop the chain and report to the user with completed artifacts.

## Apply Strategy

### Batching rules
- **Small changes** (1-5 tasks): launch one sub-agent for all tasks
- **Medium changes** (6-12 tasks): batch by phase (e.g., "Phase 1: tasks 1.1-1.3", "Phase 2: tasks 2.1-2.4")
- **Large changes** (13+ tasks): batch 3-5 tasks per sub-agent, ask user to continue between batches

### Per-batch sub-agent prompt
Include in each apply sub-agent:
- Which tasks to implement (by ID from tasks.md)
- Path to specs, design, and tasks artifacts
- Reminder to follow project coding conventions and user's installed skills (TDD, etc.)

### Progress tracking
After each batch completes, show:
```
Completed: tasks 1.1, 1.2, 1.3 ✓
Remaining: tasks 2.1, 2.2, 2.3, 2.4
Issues: {any blockers found}
Continue with next batch? (y/n)
```

## Error Recovery

### Sub-agent failure
If a sub-agent returns an error or incomplete result:
1. Report the failure to the user with the error details
2. Do NOT retry automatically — ask the user how to proceed
3. Options to present: retry the same phase, skip and continue, abort the workflow

### Missing prerequisite artifact
If a phase requires an artifact that doesn't exist (e.g., tasks needs specs but specs weren't created):
1. Inform the user which artifact is missing
2. Suggest running the missing phase first
3. Do NOT attempt to create the missing artifact inline

### Partial apply failure
If some tasks in a batch succeed but others fail:
1. Mark successful tasks as complete in tracking
2. Report which tasks failed and why
3. Ask user: retry failed tasks, skip them, or abort

## Engram Key Conventions

When saving to Engram, use these key patterns:
- `sdd-state/{change-name}` — current workflow state
- `proposal/{change-name}` — proposal artifact
- `specs/{change-name}` — specifications artifact
- `design/{change-name}` — design artifact
- `tasks/{change-name}` — task breakdown artifact
- `verify-report/{change-name}` — verification report
