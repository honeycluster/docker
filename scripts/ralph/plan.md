# Implementation Plan: Presets System for xrpld Config Generator

## Requirements Summary

Introduce a `presets` object on `XrpldInput` that groups all high-level configuration knobs:

```typescript
interface XrpldPresets {
  readonly network?: 'mainnet' | 'testnet' | 'devnet';
  readonly role?: NodeRole;
  readonly size?: NodeSize;
  readonly verbosity?: LogLevel;
}
```

Each preset is an independent dimension that drives a cluster of xrpld.cfg settings. They compose via a defined merge order, and user-level fields always win.

**Merge order:** `common < size < role < verbosity < network < user`

- **size** first — sets baseline resource profile (node_size, db settings, peers, workers)
- **role** next — overrides with operational behavior (ports, peer_private, etc.)
- **verbosity** next — overrides logging settings
- **network** next — overrides identity (network_id, VL keys, IPs)
- **user** always wins

### Preset Dimensions

**Network** (existing, moved under `presets`):
- `mainnet` — network_id=0, ripple.com VL
- `testnet` — network_id=1, altnet VL + IPs
- `devnet` — network_id=2, devnet VL + IPs

**Role** (new):
- `stock` — Empty defaults (current behavior)
- `validator` — peer_private=1, no public RPC, no gRPC port
- `ephemeral` — Minimal footprint, disposable
- `sentry` — High peer capacity, public-facing, protects validators
- `clio` — Clio backend: gRPC on 0.0.0.0, full history for ETL
- `feature` — Amendment testing: fast amendment_majority_time
- `hub` — High-capacity peering: max peers, full history

**Size** (new):
| Size | node_size | online_delete | ledger_history | peers_max | workers | io_workers |
|------|-----------|---------------|----------------|-----------|---------|------------|
| tiny | tiny | 256 | 256 | 10 | — | — |
| small | small | 256 | 512 | 15 | — | — |
| medium | medium | 512 | 1024 | 21 | — | — |
| large | large | 2048 | 4096 | 50 | 4 | 2 |
| huge | huge | 8192 | full | 300 | 8 | 4 |

**Verbose** (new):
| Level | rpc_startup log_level | Notes |
|-------|----------------------|-------|
| silent | fatal | Minimal output |
| fatal | fatal | Fatal errors only |
| error | error | Errors only |
| warning | warning | Default (current behavior) |
| info | info | Operational info |
| debug | debug | Development debugging |
| trace | trace | Full trace, high disk I/O |

### Input Examples

JSON:
```json
{
  "presets": {
    "network": "mainnet",
    "role": "validator",
    "size": "large",
    "verbosity": "info"
  },
  "validator_token": "..."
}
```

Text (SCREAMING_SNAKE_CASE):
```
PRESET_NETWORK=mainnet
PRESET_ROLE=validator
PRESET_SIZE=large
PRESET_VERBOSE=info
VALIDATOR_TOKEN=...
```

CLI:
```
xrpl-cfg-gen --network mainnet --role validator --size large --verbose info
```

### Backwards Compatibility

- `presets` is optional. No presets = current behavior (stock role, medium size, warning verbosity, mainnet).
- Top-level `network` field is **removed** from `XrpldInput` and moved to `presets.network`. The CLI `--network` flag maps to `presets.network`.
- The `node_size` field remains on `XrpldInput` as a direct override. If both `presets.size` and `node_size` are set, `node_size` wins (user fields override presets).
- Role presets no longer set `node_size` or db settings — that's now the job of `size`. Roles only set operational behavior (ports, peer_private, etc.).

## Architecture Changes

### New Types (`types/xrpld-input.ts`)
- `NodeRole` — `'stock' | 'validator' | 'ephemeral' | 'sentry' | 'clio' | 'feature' | 'hub'`
- `NodeSize` — `'tiny' | 'small' | 'medium' | 'large' | 'huge'`
- `LogLevel` — `'silent' | 'fatal' | 'error' | 'warning' | 'info' | 'debug' | 'trace'`
- `XrpldPresets` — interface grouping network, role, size, verbosity
- `XrpldInput.presets` — optional `XrpldPresets` field (replaces top-level `network`)

### New Files
- `packages/generator/src/defaults/roles.ts` — role preset definitions + `getRoleDefaults()`
- `packages/generator/src/defaults/sizes.ts` — size preset definitions + `getSizeDefaults()`
- `packages/generator/src/defaults/verbosity.ts` — verbosity preset definitions + `getVerboseDefaults()`

### Modified Files
- `packages/generator/src/defaults/xrpld.ts` — `resolveXrpldConfig()` updated merge pipeline
- `packages/generator/src/types/xrpld-input.ts` — new types, `presets` field, remove top-level `network`
- `packages/generator/src/cli.ts` — `--role`, `--size`, `--verbose` flags; `--network` maps to presets
- `packages/generator/src/parsers/env-parser.ts` — `PRESET_NETWORK`, `PRESET_ROLE`, `PRESET_SIZE`, `PRESET_VERBOSE` keys
- `packages/generator/src/parsers/json-parser.ts` — handle nested `presets` object
- `packages/generator/src/validation.ts` — validate presets fields, role-specific warnings
- `packages/generator/src/renderers/cfg-renderer.ts` — no changes (presets not in render keys)
- `packages/generator/src/index.ts` — export new functions and types

## Implementation Phases

### Phase 1: Types (US-011)

**Goal:** Define all new types and the `XrpldPresets` interface.

**Files:**
- `packages/generator/src/types/xrpld-input.ts`

**Changes:**
1. Add type aliases: `NodeRole`, `NodeSize`, `LogLevel`
2. Add `XrpldPresets` interface
3. Add `readonly presets?: XrpldPresets` to `XrpldInput`
4. Remove `readonly network?` from `XrpldInput` top level (moved to presets)

**Tests:** TypeScript compiler validates. Update any tests referencing `input.network` to `input.presets.network`.

---

### Phase 2: Size Defaults (US-012, depends on US-011)

**Goal:** Create size preset definitions.

**Files:**
- Create `packages/generator/src/defaults/sizes.ts`
- Create `packages/generator/tests/defaults/sizes.test.ts`

**Size definitions** (each `Partial<XrpldInput>`):

```typescript
const TINY: Partial<XrpldInput> = {
  node_size: 'tiny',
  node_db: { type: 'NuDB', path: '/var/lib/xrpld/db/nudb', online_delete: 256, advisory_delete: 0 },
  ledger_history: '256',
  peers_max: 10,
};

const SMALL: Partial<XrpldInput> = {
  node_size: 'small',
  node_db: { type: 'NuDB', path: '/var/lib/xrpld/db/nudb', online_delete: 256, advisory_delete: 0 },
  ledger_history: '512',
  peers_max: 15,
};

const MEDIUM: Partial<XrpldInput> = {
  node_size: 'medium',
  node_db: { type: 'NuDB', path: '/var/lib/xrpld/db/nudb', online_delete: 512, advisory_delete: 0 },
  ledger_history: '1024',
  peers_max: 21,
};

const LARGE: Partial<XrpldInput> = {
  node_size: 'large',
  node_db: { type: 'NuDB', path: '/var/lib/xrpld/db/nudb', online_delete: 2048, advisory_delete: 0 },
  ledger_history: '4096',
  peers_max: 50,
  workers: 4,
  io_workers: 2,
};

const HUGE: Partial<XrpldInput> = {
  node_size: 'huge',
  node_db: { type: 'NuDB', path: '/var/lib/xrpld/db/nudb', online_delete: 8192, advisory_delete: 0 },
  ledger_history: 'full',
  peers_max: 300,
  workers: 8,
  io_workers: 4,
};
```

Exports: `getSizeDefaults(size: NodeSize): Partial<XrpldInput>`, `VALID_SIZES`

---

### Phase 3: Role Defaults (US-013, depends on US-011)

**Goal:** Create role preset definitions. Roles focus on **operational behavior only** — no node_size or db settings (that's size's job).

**Files:**
- Create `packages/generator/src/defaults/roles.ts`
- Create `packages/generator/tests/defaults/roles.test.ts`

**Role definitions** (each `Partial<XrpldInput>`):

```typescript
const STOCK: Partial<XrpldInput> = {};

const VALIDATOR: Partial<XrpldInput> = {
  peer_private: '1',
  server: {
    ports: [
      { name: 'port_peer', port: 51235, ip: '0.0.0.0', protocol: 'peer' },
      { name: 'port_rpc_admin_local', port: 5005, ip: '127.0.0.1', admin: '127.0.0.1', protocol: 'http' },
      { name: 'port_ws_admin_local', port: 6006, ip: '127.0.0.1', admin: '127.0.0.1', protocol: 'ws' },
    ],
  },
};

const EPHEMERAL: Partial<XrpldInput> = {};
// Ephemeral is purely a size concern now — use presets.size = 'tiny'

const SENTRY: Partial<XrpldInput> = {
  peer_private: '0',
};
// Sentry capacity comes from presets.size. Role just ensures public peering.

const CLIO: Partial<XrpldInput> = {
  ledger_history: 'full',
  server: {
    ports: [
      { name: 'port_peer', port: 51235, ip: '0.0.0.0', protocol: 'peer' },
      { name: 'port_rpc_admin_local', port: 5005, ip: '127.0.0.1', admin: '127.0.0.1', protocol: 'http' },
      { name: 'port_ws_admin_local', port: 6006, ip: '127.0.0.1', admin: '127.0.0.1', protocol: 'ws' },
      { name: 'port_grpc', port: 50051, ip: '0.0.0.0', protocol: 'grpc', secure_gateway: '0.0.0.0' },
    ],
  },
};

const FEATURE: Partial<XrpldInput> = {
  amendment_majority_time: '5 minutes',
};

const HUB: Partial<XrpldInput> = {
  peer_private: '0',
};
// Hub capacity comes from presets.size = 'huge'. Role ensures public peering.
```

Exports: `getRoleDefaults(role: NodeRole): Partial<XrpldInput>`, `VALID_ROLES`

---

### Phase 4: Verbose Defaults (US-014, depends on US-011)

**Goal:** Create verbosity preset definitions.

**Files:**
- Create `packages/generator/src/defaults/verbosity.ts`
- Create `packages/generator/tests/defaults/verbosity.test.ts`

**Verbose definitions** (each `Partial<XrpldInput>`):

```typescript
const SILENT: Partial<XrpldInput> = {
  rpc_startup: [{ command: 'log_level', severity: 'fatal' }],
};

const FATAL: Partial<XrpldInput> = {
  rpc_startup: [{ command: 'log_level', severity: 'fatal' }],
};

const ERROR: Partial<XrpldInput> = {
  rpc_startup: [{ command: 'log_level', severity: 'error' }],
};

const WARNING: Partial<XrpldInput> = {
  rpc_startup: [{ command: 'log_level', severity: 'warning' }],
};

const INFO: Partial<XrpldInput> = {
  rpc_startup: [{ command: 'log_level', severity: 'info' }],
};

const DEBUG: Partial<XrpldInput> = {
  rpc_startup: [{ command: 'log_level', severity: 'debug' }],
};

const TRACE: Partial<XrpldInput> = {
  rpc_startup: [{ command: 'log_level', severity: 'trace' }],
};
```

Exports: `getVerboseDefaults(level: LogLevel): Partial<XrpldInput>`, `VALID_LOG_LEVELS`

---

### Phase 5: Merge Integration (US-015, depends on US-012, US-013, US-014)

**Goal:** Wire all preset layers into `resolveXrpldConfig`.

**Files:**
- `packages/generator/src/defaults/xrpld.ts`
- `packages/generator/tests/defaults/xrpld.test.ts` (or `defaults.test.ts`)

**Updated `resolveXrpldConfig`:**

```typescript
export function resolveXrpldConfig(
  input: Partial<XrpldInput> = {},
): XrpldInput {
  const presets = input.presets ?? {};
  const network = presets.network ?? 'mainnet';
  const role = presets.role ?? 'stock';
  const size = presets.size ?? 'medium';
  const verbosity = presets.verbosity ?? 'warning';

  const sizeDefaults = getSizeDefaults(size);
  const roleDefaults = getRoleDefaults(role);
  const verbosityDefaults = getVerboseDefaults(verbosity);
  const networkDefaults = getNetworkDefaults(network);

  // Merge: common < size < role < verbosity < network < user
  const merged = deepMerge(
    deepMerge(
      deepMerge(
        deepMerge(
          deepMerge(
            COMMON_DEFAULTS as Record<string, unknown>,
            sizeDefaults as Record<string, unknown>,
          ),
          roleDefaults as Record<string, unknown>,
        ),
        verbosityDefaults as Record<string, unknown>,
      ),
      networkDefaults as Record<string, unknown>,
    ),
    input as Record<string, unknown>,
  ) as XrpldInput;

  return { ...merged, presets: { network, role, size, verbosity } };
}
```

**COMMON_DEFAULTS update:** Remove `node_db`, `ledger_history`, `rpc_startup` from common (now driven by size/verbosity). Common retains only truly universal defaults:

```typescript
const COMMON_DEFAULTS: Partial<XrpldInput> = {
  server: { ports: DEFAULT_PORTS },
  database_path: '/var/lib/xrpld/db',
  debug_logfile: '/var/log/xrpld/debug.log',
  ssl_verify: '1',
  sntp_servers: ['pool.ntp.org'],
  peer_private: '0',
  fetch_depth: 'full',
};
```

**Tests:**
- `resolveXrpldConfig({})` uses medium size, stock role, warning verbosity, mainnet — identical to current output (backwards compatible)
- `resolveXrpldConfig({ presets: { size: 'huge' } })` has node_size=huge, online_delete=8192, peers_max=300
- `resolveXrpldConfig({ presets: { role: 'validator', size: 'large' } })` has large db settings + validator ports
- `resolveXrpldConfig({ presets: { verbosity: 'debug' } })` has log_level=debug in rpc_startup
- `resolveXrpldConfig({ presets: { network: 'testnet', role: 'clio' } })` has testnet VL + clio ports
- User override: `{ presets: { size: 'huge' }, node_size: 'large' }` produces node_size=large (user wins)
- User override: `{ presets: { verbosity: 'debug' }, rpc_startup: [...] }` user rpc_startup wins

---

### Phase 6: CLI and Parser Integration (US-016, depends on US-015)

**Goal:** Expose presets through CLI flags and text parser.

**Files:**
- `packages/generator/src/cli.ts`
- `packages/generator/src/parsers/env-parser.ts`
- `packages/generator/tests/cli.test.ts`
- `packages/generator/tests/parsers/text-parser.test.ts`

**CLI changes:**
- Add `--role`, `--size`, `--verbose` flags to `parseArgs()`
- `--network` now maps to `presets.network` (not top-level)
- Add `role`, `size`, `verbosity` to `CliArgs`
- In `run()`, build presets object from CLI args:
  ```typescript
  const presets: Record<string, string> = {};
  if (args.network) presets.network = args.network;
  if (args.role) presets.role = args.role;
  if (args.size) presets.size = args.size;
  if (args.verbosity) presets.verbosity = args.verbosity;
  if (Object.keys(presets).length > 0) {
    input = { ...input, presets: presets as XrpldPresets };
  }
  ```

**Updated USAGE:**
```
Usage: xrpl-cfg-gen [options]

Options:
  --network <name>     Network preset: mainnet, testnet, devnet (default: mainnet)
  --role <name>        Node role: stock, validator, ephemeral, sentry, clio, feature, hub (default: stock)
  --size <name>        Node size: tiny, small, medium, large, huge (default: medium)
  --verbose <level>    Log level: silent, fatal, error, warning, info, debug, trace (default: warning)
  --json <path>        Read overrides from a nested JSON file
  --input <path>       Read overrides from a SCREAMING_SNAKE_CASE text file
  --parse <cfg-path>   Parse an existing xrpld.cfg to JSON
  --output <dir>       Write xrpld.cfg and validators.txt to directory
  --validate-only      Run validation without generating output
  --help               Show this help message

Examples:
  xrpl-cfg-gen --network mainnet --role validator --size large --output /var/lib/xrpld/etc
  xrpl-cfg-gen --network testnet --role clio --verbose info
  xrpl-cfg-gen --size huge --role hub
  xrpl-cfg-gen --json overrides.json --verbose debug
```

**Env parser changes:**
```typescript
// In KEY_MAP, Meta section:
PRESET_NETWORK: 'presets.network',
PRESET_ROLE: 'presets.role',
PRESET_SIZE: 'presets.size',
PRESET_VERBOSE: 'presets.verbosity',
```

The existing `setNestedValue()` function handles the dot-path nesting automatically.

---

### Phase 7: Validation Updates (US-017, depends on US-015)

**Goal:** Validate preset fields and add role-specific warnings.

**Files:**
- `packages/generator/src/validation.ts`
- `packages/generator/tests/validation.test.ts`

**New validations:**
1. `validatePresets()` function:
   - Invalid role → error
   - Invalid size → error
   - Invalid verbosity → error
   - Invalid network → error (already exists, move here)
2. Role-specific warnings:
   - `validator` without `validator_token` → warning
   - `sentry` without `ips_fixed` → warning
   - `clio` without gRPC port on 0.0.0.0 → warning (in case user overrode ports)

---

### Phase 8: Exports, Examples, and Integration Tests (US-018, depends on US-016, US-017)

**Goal:** Clean up public API, update examples, add end-to-end tests.

**Files:**
- `packages/generator/src/index.ts` — export new functions/types
- `packages/generator/examples/xrpld-full.json` — add `presets` object
- `packages/generator/examples/xrpld-full.txt` — add `PRESET_*` keys
- `packages/generator/tests/integration/presets.test.ts` — end-to-end tests

**Integration tests:**
- Each role × mainnet produces valid cfg
- Each size produces correct node_size + online_delete in cfg
- Each verbosity level produces correct log_level in rpc_startup
- Combined: `{ presets: { network: 'testnet', role: 'validator', size: 'large', verbosity: 'info' } }` produces expected cfg
- Backwards compatibility: `{}` produces identical cfg to current behavior
- `presets` object does NOT appear in rendered cfg output
- Text file with `PRESET_ROLE=validator` + `PRESET_SIZE=large` produces correct cfg
- CLI with `--role validator --size large --network testnet --verbose info` produces correct cfg

---

## Migration: Top-level `network` → `presets.network`

This is a **breaking change** to the `XrpldInput` interface. To migrate:

1. Remove `network` from `XrpldInput` top level
2. Add `presets.network` to `XrpldPresets`
3. Update `resolveXrpldConfig` to read from `input.presets?.network`
4. Update CLI to map `--network` to `presets.network`
5. Update env parser: `NETWORK` → `PRESET_NETWORK` (keep `NETWORK` as alias for backwards compat)
6. Update all tests referencing `input.network`
7. Update json-parser if it has special handling
8. Update examples

Since this is an internal package (not yet published to npm), the breaking change is acceptable. All consumers are within the monorepo.

## File Change Summary

| File | Action | Phase |
|------|--------|-------|
| `src/types/xrpld-input.ts` | Modify — add NodeRole, NodeSize, LogLevel, XrpldPresets; move network into presets | 1 |
| `src/defaults/sizes.ts` | Create — 5 size presets | 2 |
| `src/defaults/roles.ts` | Create — 7 role presets (operational behavior only) | 3 |
| `src/defaults/verbosity.ts` | Create — 7 verbosity presets | 4 |
| `src/defaults/xrpld.ts` | Modify — updated merge pipeline, slimmed COMMON_DEFAULTS | 5 |
| `src/cli.ts` | Modify — --role, --size, --verbose flags; --network maps to presets | 6 |
| `src/parsers/env-parser.ts` | Modify — PRESET_NETWORK, PRESET_ROLE, PRESET_SIZE, PRESET_VERBOSE | 6 |
| `src/validation.ts` | Modify — validatePresets(), role-specific warnings | 7 |
| `src/index.ts` | Modify — export new functions and types | 8 |
| `examples/xrpld-full.json` | Modify — add presets object | 8 |
| `examples/xrpld-full.txt` | Modify — add PRESET_* keys | 8 |
| `tests/defaults/sizes.test.ts` | Create | 2 |
| `tests/defaults/roles.test.ts` | Create | 3 |
| `tests/defaults/verbosity.test.ts` | Create | 4 |
| `tests/defaults/xrpld.test.ts` | Modify — merge pipeline tests | 5 |
| `tests/cli.test.ts` | Modify — preset flag tests | 6 |
| `tests/parsers/text-parser.test.ts` | Modify — PRESET_* key tests | 6 |
| `tests/validation.test.ts` | Modify — preset validation tests | 7 |
| `tests/integration/presets.test.ts` | Create — end-to-end preset combination tests | 8 |

All file paths relative to `packages/generator/`.

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking change: `network` moves to `presets.network` | Medium | Package is internal/unpublished. Update all consumers in same PR. |
| Size defaults conflict with validation (online_delete minimum=256) | Low | Smallest online_delete is 256 (tiny/small), exactly at validation minimum. |
| Role presets too lean after separating size concerns | Low | Roles focus on behavior (ports, peer_private). Size handles capacity. Users combine both. |
| Deep merge replaces arrays entirely (ports, rpc_startup) | Low | Desired behavior — each preset layer defines complete arrays. |
| `presets` leaking into rendered cfg | Low | Renderer only processes keys in SINGLE_VALUE_KEYS/LIST_KEYS/KEY_VALUE_KEYS. `presets` is not listed. Verify with test. |
| Verbose preset only controls rpc_startup log_level | Low | Good enough for v1. Future: could add per-partition log levels. |

## Success Criteria

- [ ] All 7 roles produce valid xrpld.cfg
- [ ] All 5 sizes produce correct node_size + db settings
- [ ] All 7 verbosity levels produce correct log_level
- [ ] `stock` + `medium` + `warning` + `mainnet` = current default output (backwards compatible)
- [ ] Merge order `common < size < role < verbosity < network < user` verified
- [ ] CLI flags: --network, --role, --size, --verbose all work standalone and combined
- [ ] Text parser: PRESET_NETWORK, PRESET_ROLE, PRESET_SIZE, PRESET_VERBOSE all parse correctly
- [ ] JSON input: `{ "presets": { ... } }` works
- [ ] Invalid preset values produce validation errors
- [ ] Role-specific warnings fire (validator without token, sentry without ips_fixed)
- [ ] `presets` object does NOT appear in rendered cfg
- [ ] All tests pass, 80%+ coverage
- [ ] TypeScript compiles clean

## Story Dependency Graph

```
US-011 (Types)
  ├── US-012 (Size defaults)
  ├── US-013 (Role defaults)
  └── US-014 (Verbose defaults)
        │
  US-015 (Merge integration) ← depends on US-012, US-013, US-014
  ├── US-016 (CLI + parser) ← depends on US-015
  └── US-017 (Validation) ← depends on US-015
        │
  US-018 (Exports + integration tests) ← depends on US-016, US-017
```
