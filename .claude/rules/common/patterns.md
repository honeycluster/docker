# Common Patterns

## Config Generator Pattern

All config generators follow the same pipeline:

```
Input (env/JSON) → Parse → Validate → Merge with Defaults → Generate → Output
```

1. **Parse**: Convert raw input to a flat key-value map
2. **Validate**: Check types, ranges, required fields
3. **Merge**: Layer user input over network-specific defaults
4. **Generate**: Apply template substitution to produce final config
5. **Output**: Write to file or stdout

## Package Structure

Each package follows:

```
packages/<name>/
├── src/              # Source code
│   ├── index.ts      # Public API exports
│   └── ...
├── tests/            # Tests (mirrors src/ structure)
│   └── ...
├── package.json
├── tsconfig.json
└── tsconfig.build.json
```

## Error Handling Pattern

```typescript
class ConfigError extends Error {
  constructor(
    message: string,
    public readonly field: string,
    public readonly value: unknown
  ) {
    super(`Config error in '${field}': ${message}`);
    this.name = 'ConfigError';
  }
}
```

## Validation Pattern

```typescript
function validatePort(value: unknown): value is number {
  return typeof value === 'number' && value >= 1 && value <= 65535;
}

function validateRequired<T>(value: T | undefined, field: string): T {
  if (value === undefined || value === null) {
    throw new ConfigError(`Required field missing`, field, value);
  }
  return value;
}
```

## Docker Multi-Stage Build Pattern

```dockerfile
# Stage 1: Build from source
FROM ubuntu:24.04 AS build
# ... compile binary ...

# Stage 2: Common runtime
FROM ubuntu:24.04 AS common
COPY --from=build /opt/binary /opt/binary
# ... install runtime deps, copy configs/scripts ...

# Stage 3: Published image
FROM common AS base
# ... set entrypoint, healthcheck ...
```

## Shell Script Pattern (Entrypoints)

```bash
#!/bin/bash
set -euo pipefail

# Source shared utilities
source "$(dirname "$0")/utils/logging.sh"

# Validate required env vars
: "${NETWORK:?NETWORK environment variable is required}"

# Run configuration
log_info "Configuring for network: $NETWORK"
```
