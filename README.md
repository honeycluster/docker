###

<img src="https://i.imgur.com/kmtfYnM.png" alt="XRP logo" width="100" />

###

# honeycluster/nodekit

Production-ready Docker images and tooling for XRP Ledger infrastructure. Build, configure, and deploy `xrpld`, `rippled`, and Clio nodes with a single command.

## Packages

| Package                                            | Description                                                                           |
| -------------------------------------------------- | ------------------------------------------------------------------------------------- |
| [@honeycluster/xrpld-cfg-gen](packages/generator/) | TypeScript config generator for `xrpld.cfg` — presets, validation, multi-format input |
| [@honeycluster/configs](packages/configs/)         | Shared TypeScript and build configuration                                             |

## Docker Images

| Service     | Docs                           | Description                                                                              |
| ----------- | ------------------------------ | ---------------------------------------------------------------------------------------- |
| **xrpld**   | [docs/xrpld/](docs/xrpld/)     | XRP Ledger server — renamed binary at `xrpld`, pre-built or from source                  |
| **rippled** | [docs/rippled/](docs/rippled/) | XRP Ledger server — standard `rippled` naming at `/opt/ripple`, pre-built or from source |
| **Clio**    | [docs/clio/](docs/clio/)       | Clio API server — pre-built (`base`) or compiled from source (`build`)                   |

## Quick Start

### Generate xrpld configuration

```bash
# Install dependencies
pnpm install

# Build the generator
cd packages/generator && pnpm build

# Generate a default mainnet config
npx xrpld-cfg-gen --network mainnet

# Generate a validator config with presets
npx xrpld-cfg-gen --network mainnet --role validator --size large --verbose warning

# Write config files to a directory
npx xrpld-cfg-gen --network mainnet --output /opt/xrpl/etc
```

### Run a local simulation

```bash
# Start a local xrpld + Clio + ScyllaDB stack
cd simulate && ./up.sh
```

### Run with Docker

```bash
# xrpld with mounted config
docker run -d \
  -v /host/xrpld.cfg:/opt/xrpl/etc/xrpld.cfg \
  -v /host/validators.txt:/opt/xrpl/etc/validators.txt \
  -v xrpld-db:/var/lib/xrpld/db \
  -p 51235:51235 -p 5005:5005 -p 6006:6006 \
  honeycluster/xrpld:latest

# rippled with standard naming
docker run -d \
  -v /host/rippled.cfg:/opt/ripple/etc/rippled.cfg \
  -v /host/validators.txt:/opt/ripple/etc/validators.txt \
  -v rippled-db:/opt/ripple/db \
  -p 51235:51235 -p 5005:5005 -p 6006:6006 \
  honeycluster/rippled:latest
```

## Project Structure

```
nodekit/
├── packages/
│   ├── generator/        # xrpld config generator (TypeScript)
│   └── configs/          # Shared build configs
├── docs/
│   ├── xrpld/            # xrpld image docs (base, build, configuration)
│   ├── rippled/          # rippled image docs (base, build, configuration)
│   └── clio/             # Clio image docs (base, build, configuration)
├── simulate/             # Local Docker Compose stack (xrpld + Clio + ScyllaDB)
└── .github/workflows/    # CI/CD for nightly builds and publishing
```

## Development

```bash
# Install all dependencies
pnpm install

# Build all packages
pnpm build

# Run all tests
pnpm test

# Build and test the generator only
cd packages/generator
pnpm build
pnpm test
```

## Releasing

Releases are managed by [Nx Release](https://nx.dev/features/manage-releases) with conventional commits driving version bumps.

```bash
# Dry run — preview what would happen (no side effects)
pnpm release:dry

# First release (no prior tags exist)
pnpm release:first

# Production release (from main branch)
pnpm release

# Pre-release channels
pnpm release:alpha       # 0.1.0-a.1
pnpm release:beta        # 0.1.0-b.1
pnpm release:rc          # 0.1.0-rc.1
```

Releases publish `@honeycluster/xrpld-cfg-gen` to npm and create a GitHub release with a changelog generated from conventional commits.

Requires `GITHUB_TOKEN` for GitHub releases and `NODE_AUTH_TOKEN` for npm publish.

## CI/CD Schedule

Nightly builds and publish workflows run during XRPL low-activity hours (UTC):

| UTC   | Workflow        |
| ----- | --------------- |
| 04:00 | xrpld nightly   |
| 04:30 | rippled nightly |
| 05:00 | clio nightly    |
| 05:30 | xrpld publish   |
| 06:00 | rippled publish |
| 06:30 | clio publish    |

## Config Mount Points

| Service | Mount Path        | Files                           |
| ------- | ----------------- | ------------------------------- |
| xrpld   | `/opt/xrpl/etc`   | `xrpld.cfg`, `validators.txt`   |
| rippled | `/opt/ripple/etc` | `rippled.cfg`, `validators.txt` |
| Clio    | `/opt/clio/etc`   | `config.json`                   |

Mounted config files are **not overwritten** by the base images. See service-specific docs for details on environment-variable injection and template overrides.

## License

MIT
