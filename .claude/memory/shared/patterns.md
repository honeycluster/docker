# Codebase Patterns

Confirmed patterns discovered across multiple iterations. Check for duplicates before adding new entries.

## Database & ORM

- Prisma multi-schema pattern: see services/db/config/prisma-logs.config.ts and services/db/src/lib/prisma-logs.ts
- MariaDB adapter with UTC timezone: `initSql: "SET time_zone = '+00:00'"`

## Module & Build System

- ESM module format throughout monorepo (type: module)
- pnpm catalog for shared dependency versions

## Logging & Utilities

- Logger from @first-ledger/kit-utils for consistent logging

## Reference Implementations

- Reference implementation: examples/liquidity-indexer/ (JavaScript, MySQL, standalone)
- Existing apps/liquidity-indexer/ is a DIFFERENT app (log processing/snapshots) — do NOT modify it

## External Services

- XRPL endpoints: wss://honeycluster.io (WS), https://honeycluster.io (RPC)

## Agent System

- Agent definition format: Markdown + YAML frontmatter (name, role, description, tools, context, memory_dir, stop_condition)
- Quality check commands are discovered from CLAUDE.md / package.json, not hardcoded in agent definitions
- Documentation/structure-only PRDs do not need typecheck
