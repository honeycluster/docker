# TypeScript Coding Style

Applies to: `**/*.ts`, `**/*.tsx`

## Types & Interfaces

- Use `interface` for public APIs and object shapes
- Use `type` for unions, intersections, and utility types
- Never use `any` — use `unknown` with type guards instead
- Export types from the same file as the functions that use them
- Prefer `readonly` properties for immutable data

```typescript
// Good
interface XrpldConfig {
  readonly network: 'mainnet' | 'testnet' | 'devnet'
  readonly port: number
  readonly ssl: boolean
}

// Bad
type XrpldConfig = {
  network: any
  port: any
  ssl: any
}
```

## Immutability

```typescript
// Good: Create new object
const updated = { ...config, port: 6006 }

// Bad: Mutate in place
config.port = 6006

// Good: Functional array operations
const filtered = items.filter(item => item.active)
const mapped = items.map(item => ({ ...item, processed: true }))

// Bad: Imperative mutation
items.splice(index, 1)
items.push(newItem)
```

## Error Handling

```typescript
// Good: Typed errors with context
class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string,
    public readonly value: unknown
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

// Bad: Raw string throws
throw 'something went wrong'
throw new Error('bad')  // No context
```

## Function Signatures

- Use explicit return types for exported functions
- Use object params for functions with 3+ parameters
- Prefer `unknown` over `any` for generic inputs

```typescript
// Good
export function generateConfig(options: {
  network: Network
  port?: number
  ssl?: boolean
}): string {
  // ...
}

// Bad
export function generateConfig(network: any, port: any, ssl: any) {
  // ...
}
```

## Imports

```typescript
// 1. External dependencies
import { readFile } from 'node:fs/promises'
import { z } from 'zod'

// 2. Internal packages
import { logger } from '@honeycluster/utils'

// 3. Relative imports
import { validatePort } from './validation'
import type { XrpldConfig } from './types'
```

## Region Markers

Use decorated `#region` / `#endregion` comments to organize file sections:

```typescript
// #region -- Section Title ----------------------------

// ... section content ...

// #endregion -- Section Title -------------------------
```

- Place `--` after `#region` / `#endregion`, before the title
- Pad with dashes to a consistent line length (~55 chars)
- Use matching titles on `#region` and `#endregion`

## Async/Await

- Always use `async/await` over `.then()` chains
- Handle errors with try/catch at the boundary, not every call
- Use `Promise.all()` for independent concurrent operations
