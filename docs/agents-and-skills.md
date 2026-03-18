# Agents, Commands, and Rules

This document describes the agent orchestration system used by Ralph and Claude Code in this project.

## Overview

The system consists of three layers:

1. **Agents** (`.claude/agents/`) -- Specialized AI roles that can be delegated tasks
2. **Commands** (`.claude/commands/`) -- User-invocable slash commands that trigger workflows
3. **Rules** (`.claude/rules/`) -- Always-follow guidelines loaded into every session

Ralph, the autonomous coding agent, uses these components to implement features from PRDs (Product Requirement Documents) with quality gates, persistent memory, and error recovery.

## Architecture

```
.claude/
├── agents/                  # Agent definitions (*.md with YAML frontmatter)
│   ├── implementer.md       # Ralph's core agent -- implements PRD stories
│   ├── reviewer.md          # Reviews completed stories against acceptance criteria
│   ├── merge-resolver.md    # Resolves conflicts when merging parallel branches
│   ├── planner.md           # Creates implementation plans for complex features
│   ├── architect.md         # System design and architectural decisions
│   ├── tdd-guide.md         # Test-driven development enforcement
│   ├── code-reviewer.md     # Code quality and security review
│   ├── security-reviewer.md # OWASP Top 10 and vulnerability detection
│   ├── build-error-resolver.md # Minimal-diff build/type error fixing
│   ├── refactor-cleaner.md  # Dead code and duplicate cleanup
│   └── doc-updater.md       # Documentation and codemap generation
├── commands/                # Slash commands (*.md with description frontmatter)
│   ├── plan.md              # /plan -- Create implementation plan
│   ├── tdd.md               # /tdd -- Test-driven development workflow
│   ├── code-review.md       # /code-review -- Quality and security review
│   ├── build-fix.md         # /build-fix -- Fix build errors incrementally
│   ├── learn.md             # /learn -- Extract patterns to persistent memory
│   └── checkpoint.md        # /checkpoint -- Progress tracking with git
├── rules/                   # Always-follow guidelines
│   ├── coding-style.md      # Immutability, file organization, error handling
│   ├── testing.md           # 80% coverage, TDD workflow
│   ├── security.md          # Secret management, OWASP checks
│   ├── git-workflow.md      # Commit conventions, PR workflow
│   └── agents.md            # When to invoke which agent
├── memory/                  # Persistent cross-session memory
│   ├── shared/              # Shared across all agents
│   │   ├── patterns.md      # Confirmed codebase patterns
│   │   └── gotchas.md       # Known pitfalls
│   └── reviewer/            # Reviewer agent memory
└── orchestration/           # Ralph orchestration state
    ├── state.json           # Active agent tracking
    └── escalations.json     # Agent escalation log
```

---

## Agents

### Agent Definition Format

Each agent is a Markdown file with YAML frontmatter:

```yaml
---
name: agent-name           # Unique identifier
role: Human-Readable Role  # Display name
description: What it does  # When to use it
tools:                     # Available tools
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
context:                   # Auto-loaded files (glob patterns)
  - "**/CLAUDE.md"
memory_dir: ".claude/memory/shared"  # Persistent memory location
stop_condition: "<promise>COMPLETE</promise>"  # Completion signal
---

# Agent Instructions

Markdown body with the agent's full instructions...
```

### Ralph Core Agents

These three agents form Ralph's autonomous implementation pipeline:

#### implementer

**Purpose:** Implements user stories from a PRD, one story per iteration. Integrates quality-focused agents (`tdd-guide`, `code-reviewer`, `security-reviewer`, `build-error-resolver`) into the iteration loop with post-implementation review gates.

**Protocol:**
1. **Orient** — Read PRD (`prd.json`), progress log (`progress.txt`), and `CLAUDE.md` files
2. **Pick Story** — Select highest-priority story where `passes: false`, verify dependency chain (`dependsOn` array)
3. **Implement (TDD)** — Follow the Red-Green-Refactor methodology (from `tdd-guide`): write failing tests first, implement minimal code to pass, then refactor. The `tdd-guide` methodology is embedded directly in the implementer instructions — it is NOT invoked as a separate agent.
4. **Quality Checks** — Run typecheck, tests, lint. On failure, auto-invoke `build-error-resolver` (see below)
5. **Agent Reviews** — After quality checks pass, invoke review agents in order:
   - **5a. Code Review** — Invoke `code-reviewer` with the git diff. Findings are logged but **advisory only** (does not block commit). HIGH issues get 1 fix attempt.
   - **5b. Security Review** — Invoke `security-reviewer` with the git diff. **CRITICAL issues block the commit** and must be fixed (up to 2 attempts). If both attempts fail, the story is marked `blocked` with the security finding. Non-CRITICAL findings are logged but do not block.
6. **Error Recovery** — On quality check failure: Attempt 1 auto-invokes `build-error-resolver` with error output and changed files; Attempt 2 is a manual fix. If both fail, revert and mark the story as `blocked`.
7. **Commit** — Stage and commit as `feat: [Story ID] - [Story Title]`
8. **Persist Learnings** — Update progress log and persistent memory
9. **Check Completion** — When all stories pass: output `<promise>COMPLETE</promise>`

**Agent Review Summary:**

| Agent | Blocking? | Fix Attempts |
|-------|-----------|--------------|
| `code-reviewer` | No (advisory only) | 1 attempt for HIGH issues |
| `security-reviewer` | CRITICAL issues only | 2 attempts; blocks story if unfixed |

**Build Error Resolution:** When a quality check fails, the `build-error-resolver` agent is automatically invoked as the first fix attempt. It receives the full error output and list of changed files, attempts minimal fixes (type annotations, null checks, import fixes), and re-runs the failing check. If it succeeds, the implementer continues to Agent Reviews (step 5). If it fails, the implementer falls back to a manual fix attempt.

**TDD Integration:** The `tdd-guide` agent's Red-Green-Refactor methodology is embedded directly in step 3 of the implementer's protocol. For stories involving new functions or modules, the implementer writes failing tests first, then implements minimal code to pass, then refactors. Documentation-only stories skip the TDD steps.

**Memory:** Writes discovered patterns to `.claude/memory/shared/patterns.md` and gotchas to `.claude/memory/shared/gotchas.md`.

#### reviewer

**Purpose:** Reviews completed stories against acceptance criteria. Reports findings but does NOT implement fixes.

**Protocol:**
1. Read PRD and find all stories with `passes: true`
2. For each story, verify every acceptance criterion:
   - File existence and structure
   - Code correctness and conventions
   - Type safety (run typecheck)
   - Test results
3. Assign verdicts: pass/fail/warn per criterion
4. Write review report to progress.txt
5. Output `<promise>REVIEW_COMPLETE</promise>`

#### merge-resolver

**Purpose:** Resolves git merge conflicts when merging parallel Ralph branches.

**Protocol:**
1. Read context file with branch progress logs and full diff
2. Resolve conflicts by type:
   - **Additive files** (index.ts): Keep both sides, deduplicate
   - **Ralph working files** (prd.json): Keep HEAD version
   - **Complex source**: Merge using progress logs as intent guide
3. Run typecheck, fix any type errors
4. Complete merge with `git merge --continue`
5. Output `<promise>MERGE_COMPLETE</promise>`

### Development Agents

These agents support the development workflow and can be used interactively or by Ralph:

#### planner

**Purpose:** Creates comprehensive implementation plans before any code is written.

**When to use:** Complex features, architectural changes, multi-file refactoring.

**Output:** Phased implementation plan with requirements, architecture changes, steps with file paths, testing strategy, risks, and success criteria.

#### architect

**Purpose:** System design, scalability analysis, and technical decision-making.

**When to use:** New systems, major refactoring, scalability decisions.

**Output:** Architecture review with trade-off analysis, design proposals, and Architecture Decision Records (ADRs).

#### tdd-guide

**Purpose:** Enforces test-driven development (write tests first).

**When to use:** New features, bug fixes, refactoring.

**Workflow:** RED (failing test) -> GREEN (minimal implementation) -> REFACTOR (improve) -> verify 80%+ coverage.

#### code-reviewer

**Purpose:** Code quality and security review with confidence-based filtering.

**When to use:** After writing or modifying code, before merging.

**Severity levels:** CRITICAL (security), HIGH (quality), MEDIUM (performance), LOW (style). Only reports issues with >80% confidence.

#### security-reviewer

**Purpose:** OWASP Top 10 vulnerability detection and remediation.

**When to use:** Auth code, user input handling, API endpoints, sensitive data.

**Checks:** Hardcoded secrets, injection attacks, XSS, authentication bypasses, insecure dependencies, rate limiting.

#### build-error-resolver

**Purpose:** Gets builds passing with minimal changes. No refactoring, no architecture changes.

**When to use:** Build failures, type errors, module resolution issues.

**Principle:** Fix the error, verify the build passes, move on. Minimal diffs only.

#### refactor-cleaner

**Purpose:** Dead code cleanup and duplicate consolidation.

**When to use:** After features are complete, during cleanup sprints.

**Safety:** Analyzes before removing, tests after each batch, conservative approach.

#### doc-updater

**Purpose:** Keeps documentation in sync with the codebase.

**When to use:** After major features, architecture changes, new packages.

**Output:** Codemaps, updated READMEs, verified documentation.

---

## Commands

Slash commands are user-invocable workflows in `.claude/commands/`.

| Command | Description | Invokes Agent |
|---------|-------------|---------------|
| `/plan` | Create implementation plan, wait for confirmation | planner |
| `/tdd` | Test-driven development workflow (RED-GREEN-REFACTOR) | tdd-guide |
| `/code-review` | Security and quality review of uncommitted changes | code-reviewer |
| `/build-fix` | Incrementally fix build/type errors | build-error-resolver |
| `/learn` | Extract reusable patterns to persistent memory | -- |
| `/checkpoint` | Create/verify progress checkpoints with git | -- |

---

## Rules

Rules in `.claude/rules/` are always-follow guidelines loaded into every session.

| Rule | Key Points |
|------|-----------|
| **coding-style** | Immutability, small files (<800 lines), small functions (<50 lines), error handling, input validation |
| **testing** | 80% minimum coverage, TDD workflow (RED-GREEN-REFACTOR), unit + integration tests required |
| **security** | No hardcoded secrets, validate all input, prevent injection, sanitize errors |
| **git-workflow** | Conventional commits (`feat:`, `fix:`, `refactor:`), comprehensive PR summaries |
| **agents** | When to invoke each agent, parallel execution guidance |

---

## How Ralph Uses the System

### Single-Feature Execution

```bash
# Sequential: run one PRD to completion
./scripts/ralph/ralph.sh [--tool amp|claude] [max_iterations]
```

1. Ralph reads the PRD at `scripts/ralph/prd.json`
2. Launches the **implementer** agent
3. Agent picks stories in priority/dependency order
4. Each iteration: implement (TDD) -> quality check -> agent reviews (code-reviewer, security-reviewer) -> commit -> update progress
5. Agent signals `<promise>COMPLETE</promise>` when all stories pass
6. Optionally run **reviewer** agent to validate acceptance criteria

### Parallel Feature Execution

```bash
# Parallel: run multiple PRDs in isolated worktrees
./scripts/ralph/ralph-parallel.sh scripts/ralph/prds/*.json

# Merge completed branches
./scripts/ralph/ralph-merge.sh
```

1. Creates isolated git worktrees (`.worktrees/<feature>/`)
2. Runs separate **implementer** instances in parallel
3. Each works on its own branch (`ralph/<feature>`)
4. After completion, **ralph-merge.sh** merges branches:
   - Attempts clean merge first
   - Auto-resolves trivial conflicts (additive index files)
   - Invokes **merge-resolver** agent for complex conflicts
   - Runs typecheck to verify merged result

### Memory and Learning

Ralph agents build up knowledge across iterations:

- **patterns.md**: Confirmed codebase patterns (build commands, dependency quirks, type system behaviors)
- **gotchas.md**: Known pitfalls and their workarounds
- **progress.txt**: Cumulative log with a "Codebase Patterns" section at the top

Each iteration reads these files first, building on previous discoveries.

### Escalation

When the implementer agent is blocked:

1. After 2 failed fix attempts on a story (first attempt via `build-error-resolver`, second manual): reverts commit, marks story `blocked`
2. After 2+ consecutive blocked stories: writes to `escalations.json` and stops
3. Human reviews escalations and either fixes the blocker or adjusts the PRD
4. Resume Ralph to continue with remaining stories

### PRD Format

```json
{
  "name": "feature-name",
  "description": "What this feature does",
  "stories": [
    {
      "id": "US-001",
      "title": "Story title",
      "description": "As a [user], I want [feature] so that [benefit]",
      "acceptance_criteria": ["Criterion 1", "Criterion 2"],
      "dependencies": [],
      "passes": false
    }
  ]
}
```

Stories support `dependsOn` arrays for ordering and cross-PRD dependencies (`<prd-name>:US-XXX`).

---

## Source

These agents, commands, and rules are adapted from [Everything Claude Code (ECC)](https://github.com/anthropics/everything-claude-code) v1.8.0, tailored for this project's Docker infrastructure and TypeScript monorepo stack.
