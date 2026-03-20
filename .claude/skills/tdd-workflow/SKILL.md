# TDD Workflow Skill

Test-Driven Development workflow for Honeycluster packages using Vitest.

## When to Use

- Implementing new features or user stories
- Fixing bugs (write a failing test that reproduces the bug first)
- Adding validation logic
- Building config generators or parsers

## TDD Cycle

### 1. RED — Write a Failing Test

```bash
# Create the test file in the correct location
# src/generators/xrpld.ts → tests/generators/xrpld.test.ts
```

```typescript
import { describe, it, expect } from 'vitest'
import { generateXrpldConfig } from '../../src/generators/xrpld'

describe('generateXrpldConfig', () => {
  it('includes server section with configured port', () => {
    const result = generateXrpldConfig({ network: 'mainnet', port: 6006 })
    expect(result).toContain('[server]')
    expect(result).toContain('port = 6006')
  })
})
```

Run and confirm it fails:
```bash
cd packages/<pkg> && npx vitest run tests/generators/xrpld.test.ts
```

### 2. GREEN — Write Minimal Code to Pass

Implement just enough to make the test pass. Don't add extra features.

```bash
cd packages/<pkg> && npx vitest run tests/generators/xrpld.test.ts
# Should now pass
```

### 3. REFACTOR — Clean Up

- Remove duplication
- Improve naming
- Extract helpers if needed
- **Keep tests green throughout**

### 4. REPEAT

Add more test cases:
- Edge cases (empty input, missing fields)
- Error cases (invalid port, unknown network)
- Integration cases (full config generation)

## Test File Template

```typescript
import { describe, it, expect, beforeEach } from 'vitest'

describe('ModuleName', () => {
  // Setup shared across tests
  let subject: ReturnType<typeof createSubject>

  beforeEach(() => {
    subject = createSubject()
  })

  describe('methodName', () => {
    it('does the expected thing with valid input', () => {
      const result = subject.methodName(validInput)
      expect(result).toEqual(expectedOutput)
    })

    it('throws on invalid input', () => {
      expect(() => subject.methodName(invalidInput))
        .toThrow('descriptive error message')
    })

    it('handles edge case', () => {
      const result = subject.methodName(edgeCaseInput)
      expect(result).toEqual(edgeCaseOutput)
    })
  })
})
```

## Coverage Check

```bash
cd packages/<pkg> && npx vitest run --coverage
```

Target: 80%+ line coverage. Focus on:
- All exported public APIs
- Validation logic
- Error paths
- Config generation output
