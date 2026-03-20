# /tdd — Test-Driven Development

Invoke the TDD workflow for implementing features test-first.

## What It Does

1. Starts the **Red-Green-Refactor** cycle
2. Creates test files in the correct location (`tests/` mirroring `src/`)
3. Uses Vitest with proper imports
4. Ensures 80%+ coverage

## Usage

```
/tdd <description of what to implement>
```

## How It Works

1. **RED**: Write a failing test in `packages/<pkg>/tests/<path>.test.ts`
2. **GREEN**: Write minimal implementation in `src/` to make it pass
3. **REFACTOR**: Clean up while keeping tests green
4. **REPEAT**: Add more test cases for edge cases and error paths

## Example

```
/tdd Add port validation that rejects ports outside 1-65535
```

Produces:
- `tests/validation.test.ts` — test cases for valid/invalid ports
- `src/validation.ts` — `validatePort()` implementation
- Coverage report showing 80%+ coverage

## Test Conventions

- Framework: Vitest (`import { describe, it, expect } from 'vitest'`)
- Location: `packages/<pkg>/tests/` (mirrors `src/`)
- Naming: `*.test.ts` (never `.spec.ts`)
- Structure: Arrange-Act-Assert in every test
- Mocking: `vi.fn()` / `vi.spyOn()` (never jest)

## Coverage Check

After implementation, run:
```bash
cd packages/<pkg> && npx vitest run --coverage
```
