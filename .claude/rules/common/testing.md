# Testing Rules

## Framework

- **Vitest** is the test framework for all packages
- Always `import { describe, it, expect } from 'vitest'`
- Use `vi.fn()` / `vi.spyOn()` for mocking (not jest equivalents)

## Location & Naming

- Tests live in `packages/<pkg>/tests/`
- Folder structure mirrors `src/`: `src/parsers/env.ts` → `tests/parsers/env.test.ts`
- File extension: `.test.ts` (never `.spec.ts`)
- Never put test files inside `src/`

## Coverage

- Minimum **80% line coverage** per package
- Run coverage: `cd packages/<pkg> && npx vitest run --coverage`
- Critical paths (validation, config generation) should have 90%+ coverage

## Test Types

### Unit Tests
- Test individual functions in isolation
- Mock external dependencies (fs, network, etc.)
- Fast — each test < 100ms

### Integration Tests
- Test module interactions with real implementations
- No database mocks — use real data structures
- Test config generation end-to-end with fixture files

## Test Structure

```typescript
describe('moduleName', () => {
  describe('functionName', () => {
    it('describes expected behavior as a sentence', () => {
      // Arrange
      const input = { ... }

      // Act
      const result = functionName(input)

      // Assert
      expect(result).toEqual(expected)
    })

    it('handles error case', () => {
      expect(() => functionName(badInput)).toThrow('specific message')
    })
  })
})
```

## TDD Workflow

1. **RED**: Write a failing test first
2. **GREEN**: Write minimal code to pass
3. **REFACTOR**: Clean up while keeping tests green

## Anti-patterns to Avoid

- Testing implementation details instead of behavior
- Shared mutable state between tests
- Tests that depend on execution order
- Overly broad assertions (`toBeTruthy()` when `toEqual()` is possible)
- Snapshot tests for logic (use only for serialized output formats)
