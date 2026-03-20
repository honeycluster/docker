# Agent Definitions

This directory contains reusable agent definitions for the Claude agent orchestration system.

## Agent Definition Format

Each agent is defined as a **Markdown file with YAML frontmatter**. The Markdown body contains the agent's instructions, and the YAML frontmatter defines metadata and configuration.

### YAML Frontmatter Schema

```yaml
---
name: string          # Unique identifier for the agent role (e.g., "implementer")
role: string          # Human-readable role title (e.g., "Code Implementer")
description: string   # Brief description of what this agent does
tools: string[]       # List of tools the agent can use (e.g., ["Read", "Write", "Bash", "Grep", "Glob"])
context: string[]     # Glob patterns for files to auto-include as context (e.g., ["**/CLAUDE.md"])
memory_dir: string    # Path to the agent's memory directory (e.g., ".claude/memory/shared")
stop_condition: string # Regex pattern that signals the agent should stop (e.g., "<promise>COMPLETE</promise>")
---
```

### Field Details

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `name` | Yes | `string` | Unique identifier for the agent role. Used in orchestration state tracking. |
| `role` | Yes | `string` | Human-readable title describing the agent's function. |
| `description` | Yes | `string` | Brief description of the agent's purpose and capabilities. |
| `tools` | No | `string[]` | Tools the agent is allowed to use. If omitted, all tools are available. |
| `context` | No | `string[]` | Glob patterns for files that should be loaded into the agent's context at startup. |
| `memory_dir` | No | `string` | Path (relative to repo root) where the agent reads/writes persistent memory files. |
| `stop_condition` | No | `string` | Regex pattern. When the agent's output matches this, the orchestrator knows it has finished. |

### Minimal Example

```markdown
---
name: implementer
role: Code Implementer
description: Autonomous agent that implements user stories from a PRD, one at a time.
tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
context:
  - "**/CLAUDE.md"
  - "scripts/ralph/prd.json"
  - "scripts/ralph/progress.txt"
memory_dir: ".claude/memory/shared"
stop_condition: "<promise>COMPLETE</promise>"
---

# Implementer Agent Instructions

You are an autonomous coding agent. Your job is to implement user stories
from a PRD (prd.json), one story per iteration.

## Iteration Protocol

1. Read the PRD and progress log
2. Pick the highest-priority story where `passes: false`
3. Implement the story
4. Run quality checks
5. Commit changes
6. Update progress

## Stop Condition

When all stories pass, output: <promise>COMPLETE</promise>
```

## PRD Story Dependencies (`dependsOn`)

Stories in `prd.json` support an optional `dependsOn` field that declares prerequisite stories.

### Format

```json
{
  "id": "US-003",
  "title": "Build the widget",
  "dependsOn": ["US-001", "US-002"],
  "passes": false
}
```

- **`dependsOn`**: `string[]` — Array of story IDs that must have `passes: true` before this story can be started.
- Stories without `dependsOn` (or with an empty array) have no prerequisites.
- **Cross-PRD dependencies** use the format `<prd-name>:US-XXX` (e.g., `"agent-foundation:US-001"`). The agent should check the referenced PRD's story status before proceeding.

### Agent Behavior

- Before picking the next story, the agent checks the `dependsOn` array.
- If any dependency has `passes: false`, the story is **skipped** (not blocked — the agent moves to the next eligible story).
- If no eligible stories remain and unfinished stories exist, the agent should escalate.

## Escalation Format

When an agent encounters unresolvable issues (e.g., blocked on 2+ consecutive stories), it writes an escalation entry to `.claude/orchestration/escalations.json`.

### Schema

```json
[
  {
    "agent_id": "implementer-branch-name",
    "story_id": "US-003",
    "error": "TypeScript compilation failed: Cannot find module '@honeycluster/xrpl-db'",
    "attempted_fixes": [
      "Added missing dependency to package.json",
      "Ran pnpm install to resolve workspace links"
    ],
    "timestamp": "2026-03-12T14:30:00Z"
  }
]
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `agent_id` | `string` | Identifier for the agent instance (typically `<role>-<branch>`). |
| `story_id` | `string` | The story ID that the agent was blocked on. |
| `error` | `string` | Description of the error or blocker. |
| `attempted_fixes` | `string[]` | List of approaches the agent tried before escalating. |
| `timestamp` | `string` | ISO 8601 timestamp of when the escalation was created. |

## Shared State File

The orchestrator tracks all active agents in `.claude/orchestration/state.json`.

### Schema

```json
{
  "agents": [
    {
      "agent_id": "implementer-ralph-agent-foundation",
      "branch": "ralph/agent-foundation",
      "prd": "scripts/ralph/prd.json",
      "current_story": "US-001",
      "status": "running",
      "completed_stories": [],
      "files_modified": [".claude/agents/README.md"],
      "last_updated": "2026-03-12T14:00:00Z"
    }
  ]
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `agent_id` | `string` | Unique identifier for this agent instance. |
| `branch` | `string` | Git branch the agent is working on. |
| `prd` | `string` | Path to the PRD file the agent is executing. |
| `current_story` | `string \| null` | Story ID currently being worked on, or `null` if idle. |
| `status` | `string` | One of: `running`, `completed`, `blocked`, `escalated`. |
| `completed_stories` | `string[]` | Array of story IDs that have been completed. |
| `files_modified` | `string[]` | List of files the agent has created or modified. |
| `last_updated` | `string` | ISO 8601 timestamp of the last state update. |

## Directory Structure

```
.claude/
├── agents/                      # Agent definitions (*.md files)
│   ├── README.md                # This file — schema documentation
│   ├── ralph-implementer.md     # Implements PRD user stories
│   ├── ralph-tester.md          # Writes Vitest tests
│   ├── ralph-planner.md         # Implementation planning
│   ├── ralph-reviewer.md        # Code review against acceptance criteria
│   ├── ralph-build-fixer.md     # Fixes build/typecheck/test errors
│   ├── ralph-security-reviewer.md # Security audit
│   └── ralph-merger.md          # Merge conflict resolution
├── commands/                    # Slash command definitions
│   ├── tdd.md                   # /tdd — TDD workflow
│   ├── plan.md                  # /plan — Implementation planning
│   ├── review.md                # /review — Code review
│   └── build-fix.md             # /build-fix — Fix build errors
├── rules/                       # Coding rules and guidelines
│   ├── common/                  # Language-agnostic rules
│   │   ├── coding-style.md
│   │   ├── testing.md
│   │   ├── security.md
│   │   └── patterns.md
│   └── typescript/              # TypeScript-specific rules
│       └── coding-style.md
├── skills/                      # Domain-specific knowledge
│   ├── tdd-workflow/SKILL.md
│   ├── docker-patterns/SKILL.md
│   └── config-gen/SKILL.md
├── hooks.json                   # Quality gate hooks
├── mcp-servers.json             # MCP server configuration
├── memory/
│   ├── shared/                  # Cross-agent persistent memory
│   │   ├── patterns.md
│   │   └── gotchas.md
│   ├── reviewer/
│   └── merge-resolver/
└── orchestration/
    ├── state.json               # Active agent state tracking
    └── escalations.json         # Agent escalation log
```

## Usage with Ralph Scripts

```bash
# Single agent (default: implementer)
bash scripts/ralph/ralph.sh --agent implementer

# Specific agent
bash scripts/ralph/ralph.sh --agent tester
bash scripts/ralph/ralph.sh --agent planner

# Phase pipeline (runs multiple agents in sequence)
bash scripts/ralph/ralph.sh --phase full     # plan → implement → test → review
bash scripts/ralph/ralph.sh --phase review   # reviewer + security-reviewer

# Parallel execution with agent
bash scripts/ralph/ralph-parallel.sh --agent tester --dir scripts/ralph/prds/
```
