# Ralph Agent Instructions

You are an autonomous coding agent working on a software project.

## Your Task as a Ralph Agent

1. Read the PRD at `prd.json` (in the same directory as this file)
2. Read the progress log at `progress.txt` (check Codebase Patterns section first)
3. Check you're on the correct branch from PRD `branchName`. If not, check it out or create from main.
4. Pick the **highest priority** user story where `passes: false`
5. Implement that single user story
6. Run quality checks (e.g., typecheck, lint, test - use whatever your project requires)
7. Update CLAUDE.md files if you discover reusable patterns (see below)
8. If checks pass, commit ALL changes with message: `feat: [Story ID] - [Story Title]`
9. Update the PRD to set `passes: true` for the completed story
10. Append your progress to `progress.txt`

## Progress Report Format

APPEND to progress.txt (never replace, always append):

```
## [Date/Time] - [Story ID]
- What was implemented
- Files changed
- **Learnings for future iterations:**
  - Patterns discovered (e.g., "this codebase uses X for Y")
  - Gotchas encountered (e.g., "don't forget to update Z when changing W")
  - Useful context (e.g., "the evaluation panel is in component X")
---
```

The learnings section is critical - it helps future iterations avoid repeating mistakes and understand the codebase better.

## Consolidate Patterns

If you discover a **reusable pattern** that future iterations should know, add it to the `## Codebase Patterns` section at the TOP of progress.txt (create it if it doesn't exist). This section should consolidate the most important learnings:

```
## Codebase Patterns
- Example: Use `sql<number>` template for aggregations
- Example: Always use `IF NOT EXISTS` for migrations
- Example: Export types from actions.ts for UI components
```

Only add patterns that are **general and reusable**, not story-specific details.

## Update CLAUDE.md Files

Before committing, check if any edited files have learnings worth preserving in nearby CLAUDE.md files.

## Quality Requirements

- ALL commits must pass your project's quality checks (typecheck, lint, test)
- Do NOT commit broken code
- Keep changes focused and minimal
- Follow existing code patterns

## Stop Condition

After completing a user story, check if ALL stories have `passes: true`.

If ALL stories are complete and passing, reply with:
<promise>COMPLETE</promise>

If there are still stories with `passes: false`, end your response normally (another iteration will pick up the next story).

## Important

- Work on ONE story per iteration
- Commit frequently
- Keep CI green
- Read the Codebase Patterns section in progress.txt before starting

# Project specific requirements

## Project Overview

This project is **Honeycluster Docker** — Docker infrastructure for building, publishing, and orchestrating containerized XRPL blockchain services. It provides multi-stage Docker builds, configuration generation, and CI/CD pipelines for **xrpld** (XRP Ledger validator) and **Clio** (XRPL read-only API server).

## Tech Stack

- **Monorepo:** Nx + pnpm workspaces
- **Language:** TypeScript 5.9
- **Testing:** Vitest — tests in `tests/` folder, mirroring `src/` structure, `*.test.ts` naming
- **Build:** Nx task runner with `@dotenv-run/cli` for environment management
- **Docker:** Multi-stage builds (build.dockerfile) with base target
- **CI/CD:** GitHub Actions workflows for nightly and release Docker image publishing
- **Config:** Dynamic config generation from JSON/env with template-based rendering

## Testing Conventions (IMPORTANT)

- **Framework:** Vitest (NOT Jest)
- **Imports:** `import { describe, it, expect, vi } from 'vitest'`
- **Location:** `packages/<pkg>/tests/` — folder structure mirrors `src/`
- **Naming:** `<name>.test.ts` (NEVER `.spec.ts`, NEVER inside `src/`)
- **Mocking:** Use `vi.fn()` and `vi.spyOn()` (NOT `jest.fn()`)
- **Coverage target:** 80%+ line coverage
- **Run tests:** `cd packages/<pkg> && npx vitest run`
- **Run with coverage:** `cd packages/<pkg> && npx vitest run --coverage`

### Test File Structure

```typescript
import { describe, it, expect } from 'vitest'
import { myFunction } from '../../src/myModule'

describe('myFunction', () => {
  it('returns expected result for valid input', () => {
    const result = myFunction(validInput)
    expect(result).toEqual(expectedOutput)
  })

  it('throws on invalid input', () => {
    expect(() => myFunction(badInput)).toThrow('error message')
  })
})
```

## Available Agents

Agent definitions are in `.claude/agents/`. Use `--agent <name>` with ralph.sh:

| Agent | Name | Purpose |
|-------|------|---------|
| `ralph-implementer.md` | implementer | Implements PRD user stories (default) |
| `ralph-tester.md` | tester | Writes Vitest tests for completed stories |
| `ralph-planner.md` | planner | Produces implementation plans |
| `ralph-reviewer.md` | reviewer | Reviews completed stories against acceptance criteria |
| `ralph-build-fixer.md` | build-fixer | Fixes TypeScript/build/test errors |
| `ralph-security-reviewer.md` | security-reviewer | Security audit of code changes |
| `ralph-merger.md` | merger | Resolves merge conflicts |

### Phase Pipelines

Use `--phase <name>` to run predefined agent sequences:
- `plan` — planner only
- `implement` — implementer (default)
- `test` — tester only
- `review` — reviewer + security-reviewer
- `full` — plan → implement → test → review

## Repository Structure

```
.github/workflows/   # CI/CD pipelines (xrpld-publish, xrpld-nightly, clio-publish, clio-nightly)
packages/             # Shared TypeScript packages
  cli/                # CLI interface for config generation
  configs/            # Shared Jest, Vitest, Tailwind, TypeScript configs
  generator/          # Config generators for xrpld and clio (parsers, defaults, templates, validation)
  utils/              # Logger, sleep, crypto, identifiers, helpers
src/                  # Docker image source (Docker images, scripts, configs)
  xrpld/              # xrpld Docker images, scripts, configs, docs
  clio/               # Clio Docker images, scripts, configs, docs
  scylla/             # ScyllaDB Docker images and scripts
simulate/             # Docker Compose files for local dev/testing
  xrpld/              # xrpld simulation compose
  clio/               # Clio simulation compose
  scylla/             # ScyllaDB simulation compose
scripts/              # Utility and deployment scripts
config/               # Shared tsconfig files
docs/                 # Documentation for xrpld and clio images
```

## Docker Image Architecture

Each service (xrpld, clio) has a `build.dockerfile` with multi-stage targets:
1. **`build`** — Ubuntu 24.04, compiles from source (Conan/CMake)
2. **`common`** — Shared runtime setup (binary, deps, config, scripts)
3. **`base`** — From `common`; static config, no templates. Published as `xrpld` / `clio`

Images are published to both Docker Hub and GitHub Container Registry (GHCR).

## Config Generator (packages/generator)

Generates `xrpld.cfg` and Clio `config.json` from environment variables/JSON input:
- **Parsers:** `env-parser.ts`, `json-parser.ts` — parse input sources
- **Defaults:** `xrpld.ts`, `clio.ts` — network-specific default values
- **Generators:** `xrpld.ts`, `clio.ts` — produce config output
- **Template:** `template.ts` — envsubst-style template rendering
- **Validation:** `validation.ts` — input validation

## Build & Test Commands

```bash
pnpm build          # nx:prepack + nx:build (all packages)
pnpm test           # nx:prepack + nx:test (all packages)
pnpm lint           # nx:lint (all packages)
pnpm format         # nx:format (all packages)
pnpm affected       # Build only affected packages

# Per-package testing (preferred during development)
cd packages/<pkg> && npx vitest run              # run all tests
cd packages/<pkg> && npx vitest run --coverage    # with coverage
npx tsc --noEmit                                  # typecheck from package dir
```

## CI/CD Workflows

- **xrpld-publish.yml** — Fetches latest rippled release tag, builds base image, publishes to Docker Hub + GHCR
- **xrpld-nightly.yml** — Builds from rippled develop branch, tags as `nightly`
- **clio-publish.yml** — Same pattern for Clio releases
- **clio-nightly.yml** — Same pattern for Clio nightly builds

All workflows use on-prem runners (`group: Onprem`) for the binary build stage, and `ubuntu-latest` for image publishing.

## Key Conventions

- Docker images only have a **base** target (no slim/envt variants)
- Build scripts in `packages/docker/*/scripts/build-rc.sh` for local image builds
- Config files live in `/opt/xrpl/etc/` (xrpld) or `/opt/clio/etc/` (Clio)
- Entrypoints are shell scripts in `scripts/entrypoint.sh`
- GitHub Actions use GHA cache (`type=gha`) for Docker layer caching

## Code Conventions

- Immutability preferred — spread over mutation
- No `any` — use `unknown` with type guards
- Typed error classes, never throw raw strings
- Validate at system boundaries (user input, env vars, external APIs)
- Files: 200-400 lines typical, 800 max
- `camelCase` for variables/functions, `PascalCase` for types/classes, `UPPER_SNAKE_CASE` for constants
- Always `import { ... } from 'vitest'` in tests, never jest globals

## Rules & Skills

Project rules are in `.claude/rules/` and skills in `.claude/skills/`:
- `rules/common/` — coding-style, testing, security, patterns
- `rules/typescript/` — TypeScript-specific style guidelines
- `skills/tdd-workflow/` — TDD cycle patterns
- `skills/docker-patterns/` — Docker multi-stage build patterns
- `skills/config-gen/` — Config generator architecture and patterns
