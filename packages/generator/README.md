###

<img src="https://i.imgur.com/kmtfYnM.png" alt="XRP logo" width="100" />

###

# @honeycluster/xrpld-cfg-gen

A TypeScript config generator for `xrpld.cfg` and `validators.txt`. Takes high-level presets and overrides, validates them, and produces production-ready configuration files for XRP Ledger nodes.

## Why Use This

Manually editing `xrpld.cfg` is error-prone. A single misconfigured port, missing validator key, or wrong `online_delete` value can silently break a node. This generator:

- **Validates everything** before writing — catches bad DB types, invalid port ranges, missing validator tokens, and conflicting settings
- **Preset-driven** — pick a network, role, size, and verbosity level; the generator resolves hundreds of config values automatically
- **Multi-format input** — feed it JSON, SCREAMING_SNAKE_CASE text files, CLI flags, or any combination
- **Deterministic merge order** — presets compose predictably: `common < size < role < verbosity < network < user`
- **Parses existing configs** — round-trip `xrpld.cfg` to JSON and back for auditing or migration

## Install

```bash
pnpm install
pnpm build
```

## CLI Usage

```bash
# Generate mainnet defaults to stdout
npx @honeycluster/xrpld-cfg-gen --network mainnet

# Write config files to a directory
npx @honeycluster/xrpld-cfg-gen --network mainnet --output /opt/xrpl/etc

# Use presets for a validator node
npx @honeycluster/xrpld-cfg-gen --network mainnet --role validator --size large --verbose warning --output /opt/xrpl/etc

# Use presets for a lightweight devnet node
npx @honeycluster/xrpld-cfg-gen --network devnet --role ephemeral --size tiny --verbose trace

# Use presets for a Clio-backend node
npx @honeycluster/xrpld-cfg-gen --network testnet --role clio --size medium --verbose info

# Generate from a JSON overrides file
npx @honeycluster/xrpld-cfg-gen --json overrides.json --output /opt/xrpl/etc

# Generate from a text file + CLI flags
npx @honeycluster/xrpld-cfg-gen --input config.txt --network testnet --role sentry

# Validate without generating output
npx @honeycluster/xrpld-cfg-gen --json overrides.json --validate-only

# Parse an existing xrpld.cfg to JSON
npx @honeycluster/xrpld-cfg-gen --parse /var/lib/xrpld/etc/xrpld.cfg
```

### CLI Flags

| Flag | Description | Default |
| ---- | ----------- | ------- |
| `--network <name>` | Network preset: `mainnet`, `testnet`, `devnet` | `mainnet` |
| `--role <name>` | Node role preset (see [Roles](#roles)) | `stock` |
| `--size <name>` | Node size preset (see [Sizes](#sizes)) | `medium` |
| `--verbose <level>` | Log verbosity preset (see [Verbosity](#verbosity)) | `warning` |
| `--json <path>` | Read overrides from a JSON file (XrpldInput schema) | — |
| `--input <path>` | Read overrides from a SCREAMING_SNAKE_CASE text file | — |
| `--output <dir>` | Write `xrpld.cfg` and `validators.txt` to directory | stdout |
| `--parse <path>` | Parse an existing `xrpld.cfg` to JSON | — |
| `--validate-only` | Run validation without generating output | — |
| `--help` | Show usage | — |

Input sources merge in order: `defaults < size < role < verbosity < network < --input < --json < CLI flags`.

## Presets

Presets let you describe a node's purpose in four dimensions. Each dimension drives a cluster of `xrpld.cfg` settings. Combine them freely — the generator merges them in a deterministic order.

### Networks

| Network | Description |
| ------- | ----------- |
| `mainnet` | Production XRP Ledger. Default validator list from `vl.ripple.com` |
| `testnet` | Public test network. Connects to `s.altnet.rippletest.net` |
| `devnet` | Development network. Connects to `s.devnet.rippletest.net` |

### Roles

| Role | Description |
| ---- | ----------- |
| `stock` | Default full node — public peer, admin RPC/WS, gRPC |
| `validator` | Validating node — `peer_private=1`, no public RPC, requires `validator_token` |
| `ephemeral` | Disposable/short-lived node — inherits size defaults, no special behavior |
| `sentry` | Protects a validator — `peer_private=0`, should have `ips_fixed` to the validator |
| `clio` | Clio backend — `ledger_history=full`, gRPC on `0.0.0.0` with `secure_gateway` |
| `feature` | Amendment testing — `amendment_majority_time=5 minutes` |
| `hub` | Peering hub — `peer_private=0`, designed for high connectivity |

### Sizes

| Size | `node_size` | `online_delete` | `ledger_history` | `peers_max` | Workers |
| ---- | ----------- | --------------- | ---------------- | ----------- | ------- |
| `tiny` | tiny | 256 | 256 | 10 | — |
| `small` | small | 256 | 512 | 15 | — |
| `medium` | medium | 512 | 1024 | 21 | — |
| `large` | large | 2048 | 4096 | 50 | 4 + 2 I/O |
| `huge` | huge | 8192 | full | 300 | 8 + 4 I/O |

All sizes use NuDB at `/var/lib/xrpld/db/nudb` with `advisory_delete=0`.

### Verbosity

| Level | `log_level` severity |
| ----- | -------------------- |
| `silent` | fatal |
| `fatal` | fatal |
| `error` | error |
| `warning` | warning |
| `info` | info |
| `debug` | debug |
| `trace` | trace |

Sets `rpc_startup` to `[{ "command": "log_level", "severity": "<level>" }]`.

## Input Formats

### JSON (presets)

The simplest way to configure a node — just specify presets:

```json
{
  "presets": {
    "network": "mainnet",
    "role": "validator",
    "size": "large",
    "verbosity": "warning"
  },
  "validator_token": "YOUR_VALIDATOR_TOKEN_HERE"
}
```

### JSON (full override)

Override any section with the full `XrpldInput` schema:

```json
{
  "presets": {
    "network": "mainnet",
    "role": "stock",
    "size": "medium",
    "verbosity": "warning"
  },
  "server": {
    "ports": [
      { "name": "port_peer", "port": 51235, "ip": "0.0.0.0", "protocol": "peer" },
      { "name": "port_rpc_admin_local", "port": 5005, "ip": "127.0.0.1", "admin": "127.0.0.1", "protocol": "http" },
      { "name": "port_ws_admin_local", "port": 6006, "ip": "127.0.0.1", "admin": "127.0.0.1", "protocol": "ws" },
      { "name": "port_grpc", "port": 50051, "ip": "127.0.0.1", "protocol": "grpc", "secure_gateway": "127.0.0.1" }
    ]
  },
  "node_size": "medium",
  "peers_max": 21
}
```

### Text file (SCREAMING_SNAKE_CASE)

```bash
PRESET_NETWORK=mainnet
PRESET_ROLE=validator
PRESET_SIZE=large
PRESET_VERBOSITY=warning

VALIDATOR_TOKEN=YOUR_VALIDATOR_TOKEN_HERE
NODE_SIZE=large
PEERS_MAX=50
```

### Environment variables

Use the same SCREAMING_SNAKE_CASE keys as the text file format. Pass them via Docker `-e` flags, `.env` files, or your orchestrator.

## Programmatic API

```typescript
import {
  generateXrpldConfig,
  resolveXrpldConfig,
  validateXrpldConfig,
  parseTextFile,
  parseJsonFile,
  parseCfgFile,
  getSizeDefaults,
  getRoleDefaults,
  getVerbosityDefaults,
} from '@honeycluster/xrpld-cfg-gen';

// Generate config from presets
const result = generateXrpldConfig({
  presets: { network: 'mainnet', role: 'validator', size: 'large' },
  validator_token: 'YOUR_TOKEN',
});

console.log(result.config);          // xrpld.cfg content
console.log(result.validatorsTxt);   // validators.txt content
console.log(result.warnings);        // validation warnings

// Resolve defaults without rendering
const resolved = resolveXrpldConfig({
  presets: { network: 'testnet', size: 'tiny' },
});

// Validate a resolved config
const validation = validateXrpldConfig(resolved);
console.log(validation.errors);      // blocking errors
console.log(validation.warnings);    // advisory warnings

// Parse an existing xrpld.cfg
const parsed = parseCfgFile(cfgFileContent);

// Get preset defaults directly
const large = getSizeDefaults('large');
const validator = getRoleDefaults('validator');
const debug = getVerbosityDefaults('debug');
```

## Examples

See [examples/](examples/) for ready-to-use configurations:

| File | Description |
| ---- | ----------- |
| [presets.json](examples/presets.json) | Minimal — just presets, all defaults |
| [validator-mainnet.json](examples/validator-mainnet.json) | Mainnet validator with token placeholder |
| [clio-testnet.json](examples/clio-testnet.json) | Clio backend on testnet |
| [sentry-mainnet.json](examples/sentry-mainnet.json) | Sentry node protecting a validator |
| [ephemeral-tiny.json](examples/ephemeral-tiny.json) | Disposable devnet node, minimal resources |
| [hub-devnet.json](examples/hub-devnet.json) | Peering hub on devnet |
| [feature-devnet.json](examples/feature-devnet.json) | Amendment testing on devnet |
| [complete.json](examples/complete.json) | Full override — every field specified |
| [complete.txt](examples/complete.txt) | Full override in SCREAMING_SNAKE_CASE text format |
| [custom-ports.json](examples/custom-ports.json) | Custom port configuration |

## Validation

The generator validates all resolved configuration and reports errors and warnings:

**Errors** (prevent config generation):
- Invalid `node_db.type` (must be NuDB or RocksDB)
- Port numbers outside 1-65535 range
- Missing required fields for the chosen database type

**Warnings** (config generates but may need attention):
- No `validator_token` set (needed for consensus participation)
- Validator role without `validator_token`
- Sentry role without `ips_fixed`
- Clio role with gRPC not on `0.0.0.0`

```bash
# Check config validity without generating files
npx @honeycluster/xrpld-cfg-gen --json my-config.json --validate-only
```

## Merge Order

The generator resolves configuration by layering sources in a strict merge order. Later layers override earlier ones:

```
common defaults
  < size preset        (node_size, node_db, online_delete, peers_max, workers)
    < role preset      (peer_private, ports, ledger_history, amendment settings)
      < verbosity      (rpc_startup log_level)
        < network      (network_id, validator list, ips)
          < user input (--input, --json, CLI flags)
```

Arrays (ports, rpc_startup) are **replaced entirely** by later layers, not merged element-by-element. This means a role preset that defines 3 ports will replace the default 4 ports completely.

## Development

```bash
# Build
pnpm build

# Run tests
pnpm test

# Type-check without emitting
npx tsc --noEmit

# Run tests with coverage
npx vitest run --coverage
```
