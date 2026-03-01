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

After each sub-agent completes, track:
- Change name
- Which artifacts exist (proposal ✓, specs ✓, design ✗, tasks ✗)
- Which tasks are complete (if in apply phase)
- Any issues or blockers reported

## Fast-Forward (/sdd-ff)

Launch sub-agents in sequence: sdd-propose → sdd-spec → sdd-design → sdd-tasks.
Show user a summary after ALL are done, not between each one.

## Apply Strategy

For large task lists, batch tasks to sub-agents (e.g., "implement Phase 1, tasks 1.1-1.3").
Do NOT send all tasks at once — break into manageable batches.
After each batch, show progress to user and ask to continue.
