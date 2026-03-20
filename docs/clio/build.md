###

<img src="https://i.imgur.com/kmtfYnM.png" alt="XRP logo" width="100" />

###

# Clio: Build Image (Ubuntu 24.04)

Multi-stage image that **builds Clio from source** (Conan) and produces a runtime image with the compiled `clio_server` binary.

## About Clio

Clio is an XRP Ledger API server optimized for HTTP and WebSocket API calls. It stores validated ledger data in a more space-efficient format (Cassandra/ScyllaDB) and delegates `rippled` P2P requests to a trusted `rippled` node.

The binary is `clio_server` and is installed at `/opt/clio/bin/clio_server`. Symlinks are created for convenience:

```
/opt/clio/bin/clio_server          # primary binary
/usr/bin/clio_server         -> /opt/clio/bin/clio_server
/usr/local/bin/clio_server   -> /opt/clio/bin/clio_server
```

## Build

The `build.dockerfile` produces a single published target: `base`.

### Building the base image

```bash
docker build -f images/build.dockerfile --target base -t clio:base .

# With custom version:
docker build -f images/build.dockerfile --target base \
  --build-arg VERSION=2.3.0 \
  --build-arg BRANCH=develop \
  -t clio:base .
```

### Build args

| Arg              | Default   | Description                            |
| ---------------- | --------- | -------------------------------------- |
| `VERSION`        | —         | Clio version/tag to build from source  |
| `BRANCH`         | `develop` | Git branch to build from               |
| `GCC_RELEASE`    | `14`      | GCC version for build                  |
| `CONAN_VERSION`  | `2.24`    | Conan version for build                |
| `CMAKE_VERSION`  | —         | CMake version (optional)               |
| `PYTHON_VERSION` | —         | Python version (optional)              |

## Stages

1. **`build`** — Ubuntu 24.04, compiles the `clio_server` binary from source using Conan.
2. **`common`** — Ubuntu 24.04; shared runtime setup (binary, config, scripts).
3. **`base`** — From `common`; static config, entrypoint. Published as `honeycluster/clio`.

## Runtime

- **Workdir:** `/opt/clio`
- **Entrypoint:** `./scripts/entrypoint.sh` — starts `clio_server`.
- **Config:** `/opt/clio/etc/config.json`
  - **Defaults:** Example config if not mounted.
  - **Custom:** Mount your own config to `/opt/clio/etc/`.

### Mounts

| Path            | Purpose                                                                 |
| --------------- | ----------------------------------------------------------------------- |
| `/opt/clio/etc` | Config directory. Mount `config.json`. Not overwritten at startup.      |
| `/opt/clio/log` | Log output.                                                             |

### Example: docker run

```bash
docker run -d \
  -v /path/to/my/config.json:/opt/clio/etc/config.json \
  -p 51233:51233 \
  honeycluster/clio:latest
```

### Example: docker compose

Clio requires a `rippled` node for ETL and a Cassandra/ScyllaDB instance for storage:

```yaml
services:
  clio:
    image: honeycluster/clio:latest
    container_name: clio
    restart: unless-stopped
    ports:
      - '51233:51233'
    volumes:
      - ./config/config.json:/opt/clio/etc/config.json:ro
    depends_on:
      - scylladb
      - xrpld

  xrpld:
    image: honeycluster/xrpld:latest
    ports:
      - '51235:51235'
      - '5005:5005'
      - '6006:6006'
      - '50051:50051'
    volumes:
      - ./config/xrpld.cfg:/opt/xrpl/etc/xrpld.cfg:ro
      - ./config/validators.txt:/opt/xrpl/etc/validators.txt:ro
      - xrpld-data:/opt/xrpl/db

  scylladb:
    image: scylladb/scylla:latest
    ports:
      - '9042:9042'
    volumes:
      - scylla-data:/var/lib/scylla

volumes:
  xrpld-data:
  scylla-data:
```

### Key config.json fields

| Field | Description |
| ----- | ----------- |
| `etl_sources` | Array of `rippled` gRPC endpoints Clio connects to for ledger data |
| `database` | Cassandra/ScyllaDB connection settings (`contact_points`, `port`, `keyspace`) |
| `server.ip` | Bind address for the Clio API server |
| `server.port` | Port for the Clio API server (default `51233`) |

## When to use

- You need a custom Clio build or a version not available as a pre-built release.
- You are building for a platform where pre-built binaries are not provided.
- You want to build from source to match the Docker Hub images.

## See also

- [Base image](base.md) — pre-built from GitHub releases
- [Configuration](configuration.md) — all configuration options
