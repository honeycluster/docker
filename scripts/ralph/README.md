# Ralph — Autonomous AI Agent Loop

Ralph is a long-running AI agent system that implements features from PRDs (Product Requirement Documents) autonomously. It works by iteratively picking the next unfinished user story from a PRD, implementing it, running quality checks, and committing — repeating until all stories pass.

For parallel workloads, Ralph spins up isolated git worktrees so multiple features can be developed simultaneously without conflicts.

## How It Works

```
PRD (JSON) → Ralph picks next story → AI agent implements → Quality checks → Commit → Repeat
```

Each iteration:

1. Reads `prd.json` for the list of user stories
2. Reads `progress.txt` for accumulated learnings (Codebase Patterns)
3. Picks the highest-priority story where `passes: false`
4. Implements the story, runs typecheck/lint/test
5. Commits with `feat: [Story ID] - [Story Title]`
6. Updates `prd.json` (`passes: true`) and appends to `progress.txt`
7. Stops when all stories pass or max iterations reached

## Quick Start

### 1. Create a PRD

Write a PRD using Claude Code's `/prd` command, then convert it to Ralph's JSON format with `/ralph`:

```bash
# In Claude Code:
/prd          # generates tasks/prd-<feature>.md
/ralph        # converts to ralph JSON format
```

### 2. Save the PRD

- **Single feature:** save as `scripts/ralph/prd.json`
- **Multiple features (parallel):** save as `scripts/ralph/prds/<feature>.json`

### 3. Run Ralph

```bash
# Single feature
bash scripts/ralph/ralph.sh

# Multiple features in parallel
bash scripts/ralph/ralph-parallel.sh scripts/ralph/prds/*.json
```

## PRD Format

```json
{
  "project": "my-feature",
  "branchName": "ralph/my-feature",
  "workingDir": "packages/generator",
  "description": "What this feature does and why",
  "userStories": [
    {
      "id": "US-001",
      "title": "Story title",
      "description": "As a user, I want...",
      "acceptanceCriteria": [
        "Criterion 1",
        "Criterion 2",
        "Typecheck passes"
      ],
      "priority": 1,
      "passes": false,
      "notes": "Optional implementation notes"
    },
    {
      "id": "US-002",
      "title": "Depends on US-001",
      "dependsOn": ["US-001"],
      "priority": 2,
      "passes": false
    }
  ]
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `project` | Yes | Feature name |
| `branchName` | Yes | Git branch (convention: `ralph/<feature>`) |
| `workingDir` | No | Subdirectory to `cd` into before running |
| `userStories` | Yes | Ordered list of stories to implement |
| `userStories[].id` | Yes | Unique story ID (e.g., `US-001`) |
| `userStories[].priority` | Yes | Execution order (lower = first) |
| `userStories[].passes` | Yes | Set to `false`; Ralph flips to `true` on completion |
| `userStories[].dependsOn` | No | Array of story IDs that must pass first |

## Scripts

### `ralph.sh` — Single Feature Runner

Runs Ralph in a loop on the current repo, one story per iteration.

```bash
./ralph.sh [OPTIONS] [max_iterations]

Options:
  --tool amp|claude     AI tool to use (default: claude)
  --agent <name>        Agent to use (default: implementer)
  --phase <name>        Run a phase pipeline: plan, implement, test, review, full
```

**Examples:**

```bash
# Default: claude + implementer agent, 10 iterations
bash scripts/ralph/ralph.sh

# Use amp with 15 iterations
bash scripts/ralph/ralph.sh --tool amp 15

# Run the full pipeline: plan → implement → test → review
bash scripts/ralph/ralph.sh --phase full

# Just the planning phase
bash scripts/ralph/ralph.sh --phase plan
```

### `ralph-parallel.sh` — Parallel Multi-Feature Runner

Spins up isolated git worktrees and runs a separate Ralph instance per PRD concurrently.

```bash
./ralph-parallel.sh [OPTIONS] <prd1.json> [prd2.json ...]
./ralph-parallel.sh [OPTIONS] --dir <directory-of-prd-jsons>

Options:
  --tool amp|claude       AI tool to use (default: claude)
  --iterations N          Max iterations per instance (default: 10)
  --agent <name>          Agent to use (default: implementer)
  --phase <name>          Phase pipeline: plan, implement, test, review, full
  --align-every N         Run cross-branch alignment check every N iterations
  --align-tool amp|claude Tool for alignment agent (default: same as --tool)
  --no-symlink            Copy node_modules instead of symlinking
```

**Examples:**

```bash
# Run two features in parallel
bash scripts/ralph/ralph-parallel.sh scripts/ralph/prds/offer.json scripts/ralph/prds/escrow.json

# Run all PRDs in a directory
bash scripts/ralph/ralph-parallel.sh --dir scripts/ralph/prds/

# With alignment checks every 3 iterations
bash scripts/ralph/ralph-parallel.sh --align-every 3 --dir scripts/ralph/prds/

# Full pipeline per feature
bash scripts/ralph/ralph-parallel.sh --phase full --dir scripts/ralph/prds/
```

**What happens:**

1. Validates all PRD files (checks `branchName` exists, no duplicates)
2. Creates a git worktree per feature at `.worktrees/<feature-name>`
3. Symlinks `node_modules` from the main repo (use `--no-symlink` to copy instead)
4. Launches `ralph.sh` in each worktree concurrently
5. Streams prefixed output: `[feature-name] ...` to the terminal
6. Writes raw logs to `.worktrees/<feature-name>.log`
7. Optionally runs cross-branch alignment checks at intervals
8. Runs a final alignment check before exiting

### `ralph-merge.sh` — Branch Merger

Merges completed Ralph branches back into the current branch with conflict resolution.

```bash
./ralph-merge.sh [OPTIONS] [branch ...]
./ralph-merge.sh                          # auto-detect from .worktrees/

Options:
  --tool amp|claude|manual   How to resolve complex conflicts (default: claude)
  --dry-run                  Show what would be merged without doing it
```

**Conflict resolution strategy:**

| File type | Resolution |
|-----------|------------|
| Additive files (`src/index.ts`, `src/commands/index.ts`) | Auto-resolve: keep both sides |
| Ralph working files (`prd.json`, `progress.txt`) | Auto-resolve: keep HEAD |
| Everything else | AI-assisted or manual |

**Examples:**

```bash
# Auto-detect and merge all branches from .worktrees/
bash scripts/ralph/ralph-merge.sh

# Merge specific branches
bash scripts/ralph/ralph-merge.sh ralph/offer ralph/escrow

# Preview what would happen
bash scripts/ralph/ralph-merge.sh --dry-run

# Manual conflict resolution (prints context, you invoke Claude yourself)
bash scripts/ralph/ralph-merge.sh --tool manual
```

## Agents

Ralph uses specialized agents defined in `.claude/agents/`. Each agent has a focused role:

| Agent | Flag | Purpose |
|-------|------|---------|
| `implementer` | `--agent implementer` | Implements user stories from PRD (default) |
| `planner` | `--agent planner` | Produces implementation plans |
| `tester` | `--agent tester` | Writes Vitest tests for completed stories |
| `reviewer` | `--agent reviewer` | Reviews stories against acceptance criteria |
| `security-reviewer` | `--agent security-reviewer` | Security audit of code changes |
| `build-fixer` | `--agent build-fixer` | Fixes TypeScript/build/test errors |
| `merger` | `--agent merger` | Resolves merge conflicts |

### Phase Pipelines

Phases run a predefined sequence of agents:

| Phase | Agents | Iterations |
|-------|--------|------------|
| `plan` | planner | 1 |
| `implement` | implementer | max_iterations |
| `test` | tester | max_iterations |
| `review` | reviewer, security-reviewer | 1 each |
| `full` | plan → implement → test → review | varies |

```bash
# Run the full pipeline
bash scripts/ralph/ralph.sh --phase full

# Just review what's been built
bash scripts/ralph/ralph.sh --phase review
```

## Alignment Checks

When running parallel features, alignment checks detect cross-branch conflicts early — before merge time. Enable with `--align-every N`:

```bash
bash scripts/ralph/ralph-parallel.sh --align-every 3 --dir scripts/ralph/prds/
```

This invokes the `branch-alignment` agent every 3 cumulative commits across all branches. The agent:

1. Compares all worktree branches for conflicting changes
2. Generates an alignment report (saved to `.worktrees/alignment-report-N.md`)
3. Injects findings into each worktree's `progress.txt` so the next iteration can self-correct

A final alignment check always runs after all instances complete (when running 2+ features).

## Progress Tracking

Ralph maintains two files for context across iterations:

### `progress.txt`

Append-only log of what happened each iteration:

```
## Codebase Patterns
- Use `sql<number>` template for aggregations
- Always use `IF NOT EXISTS` for migrations
- Export types from actions.ts for UI components

# Ralph Progress Log
Started: Mon Mar 23 10:00:00 2026
---

## 2026-03-23 10:05 - US-011
- What was implemented
- Files changed
- **Learnings for future iterations:**
  - Patterns discovered
  - Gotchas encountered
---
```

The **Codebase Patterns** section at the top is special — it carries forward across worktrees and iterations so accumulated learnings persist.

### `prd.json`

Updated in-place as stories complete (`passes: false` → `passes: true`). This is how Ralph tracks which story to pick next.

## Workflow Summary

```
1. /prd → /ralph                          # Create PRD JSON
2. Save to scripts/ralph/prds/            # One file per feature
3. ralph-parallel.sh --dir prds/          # Run all features in parallel
4. Monitor terminal output                # Prefixed per-feature logs
5. ralph-merge.sh                         # Merge completed branches
6. git worktree remove .worktrees/*       # Clean up
```

## Directory Structure

```
scripts/ralph/
├── ralph.sh                # Single-feature runner
├── ralph-parallel.sh       # Parallel multi-feature runner
├── ralph-merge.sh          # Branch merger with conflict resolution
├── CLAUDE.md               # Agent instructions (copied into each worktree)
├── plan.md                 # Implementation plan (generated by planner agent)
├── prd.json                # Current single-feature PRD
├── progress.txt            # Progress log for current run
├── prds/                   # PRDs for parallel runs
│   └── *.json
└── archive/                # Archived PRDs and progress from previous runs
    └── YYYY-MM-DD-<feature>/

.worktrees/                 # Git worktrees (created by ralph-parallel.sh)
├── <feature>/              # Isolated repo copy per feature
├── <feature>.log           # Raw log output per feature
└── alignment-report-N.md   # Cross-branch alignment reports

.claude/agents/             # Agent definitions
├── ralph-implementer.md
├── ralph-planner.md
├── ralph-tester.md
├── ralph-reviewer.md
├── ralph-security-reviewer.md
├── ralph-build-fixer.md
└── ralph-merger.md
```
