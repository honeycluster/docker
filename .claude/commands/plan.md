# /plan — Implementation Planning

Invoke the planner agent to analyze requirements and produce a step-by-step implementation plan.

## What It Does

1. Analyzes the PRD or requirements you describe
2. Reviews existing codebase architecture
3. Breaks work into ordered phases with dependencies
4. Identifies risks and mitigations
5. Produces a plan in `scripts/ralph/plan.md`

## Usage

```
/plan                          # Plan from current prd.json
/plan <feature description>    # Plan a new feature
```

## Plan Output

The plan includes:
- **Requirements Summary** — what needs to be built
- **Architecture Changes** — packages, modules, integrations
- **Implementation Phases** — ordered stories with file lists
- **Testing Strategy** — what to test and how
- **Risks & Mitigations** — what could go wrong

## Example

```
/plan Add SSL certificate management for xrpld Docker images
```

Produces a plan with:
1. Phase 1: Certificate validation utilities
2. Phase 2: SSL config generation in generator package
3. Phase 3: Docker entrypoint SSL setup
4. Phase 4: Integration tests with test certificates

## When to Use

- Before starting a new feature branch
- When a PRD has complex story dependencies
- When you need to understand the scope of changes
- Before running `ralph-parallel.sh` with multiple PRDs
