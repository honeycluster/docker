# Coding Style Rules

## Immutability (CRITICAL)

- Always create new objects/arrays instead of mutating
- Use spread operator for updates: `{ ...obj, key: newValue }`
- Use `Array.map()`, `Array.filter()` over `Array.splice()`, `Array.push()`
- Mark variables as `const` by default; use `let` only when reassignment is needed

## File Organization

- **200-400 lines** typical file size
- **800 lines** absolute maximum — split if larger
- One primary export per file
- Group imports: external deps → internal packages → relative imports
- Separate types/interfaces into adjacent `.types.ts` when file grows large

## Error Handling

- Use typed error classes, never throw raw strings
- Catch errors at system boundaries, let internal errors propagate
- Log errors with context (what was attempted, what input caused it)
- Never silently swallow errors with empty catch blocks

## Input Validation

- Validate at system boundaries: CLI args, env vars, API inputs, file content
- Use Zod schemas for structured validation where available
- Fail fast with descriptive error messages
- Internal function calls between trusted modules do not need validation

## Naming

- `camelCase` for variables, functions, methods
- `PascalCase` for types, interfaces, classes
- `UPPER_SNAKE_CASE` for constants and env vars
- Descriptive names over abbreviations: `generateXrpldConfig` not `genCfg`
- Boolean variables prefixed with `is`, `has`, `should`, `can`

## Comments

- Don't add comments to code you didn't change
- Code should be self-documenting — comment the "why", not the "what"
- No JSDoc unless the function is part of a public API
- Remove commented-out code rather than leaving it
