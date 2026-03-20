# /review — Code Review

Invoke the reviewer agent to verify completed work against acceptance criteria.

## What It Does

1. Reviews all stories marked `passes: true` in the PRD
2. Verifies each acceptance criterion
3. Runs typecheck and tests
4. Produces a structured review report

## Usage

```
/review                        # Review current PRD stories
/review <story-id>             # Review a specific story
```

## Review Dimensions

- **File Existence** — do referenced files exist in correct locations?
- **Code Correctness** — does implementation match acceptance criteria?
- **Type Safety** — does `tsc --noEmit` pass?
- **Test Results** — do tests pass?
- **Conventions** — does code follow project patterns?

## Verdicts

- **PASS** — criterion clearly and fully met
- **FAIL** — criterion clearly NOT met
- **WARN** — ambiguous or partially met

## Output

Review report appended to `progress.txt` with per-story findings and overall summary.

## When to Use

- After Ralph completes all stories in a PRD
- Before merging a feature branch
- After resolving merge conflicts
- As a pre-PR quality gate
