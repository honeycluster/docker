# /build-fix — Fix Build Errors

Invoke the build-fixer agent to diagnose and fix TypeScript compilation errors, build failures, and test failures.

## What It Does

1. Runs the failing build/typecheck/test command
2. Parses error messages to identify root cause
3. Applies minimal fixes
4. Verifies the fix with the full quality suite

## Usage

```
/build-fix                     # Auto-detect and fix build errors
/build-fix typecheck           # Fix TypeScript errors only
/build-fix tests               # Fix failing tests only
```

## Fix Priority

1. **TypeScript compilation** — blocks everything
2. **Build errors** — blocks deployment
3. **Test failures** — blocks merge
4. **Lint warnings** — low priority

## Rules

- Minimal changes only — fix the error, don't refactor
- No `// @ts-ignore` or `any` casts unless absolutely necessary
- Never delete tests to make the build pass
- Verify with typecheck AND tests after every fix

## Quick Recovery

```bash
# Reset deps
rm -rf node_modules && pnpm install

# Clear Nx cache
npx nx reset

# Full rebuild
pnpm build
```

## When to Use

- After a Ralph iteration leaves broken builds
- When `pnpm test` or `tsc --noEmit` fails
- After merge conflict resolution
- Before creating a PR
