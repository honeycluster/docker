###

<img src="https://i.imgur.com/kmtfYnM.png" alt="XRP logo" width="100" />

###

# Clio: Base Image (Ubuntu 24.04)

Clio API server image with **static** `config.json`. No envsubst or template injection — config is used as-is from the example default or your mount.

**Image tags:** `honeycluster/clio:${version | nightly | latest}`

- `latest` — Latest stable release
- `nightly` — Nightly build from develop branch
- `${version}` — Specific version tag (e.g., `2.3.0`)

## Runtime

- **Workdir:** `/opt/clio`
- **Entrypoint:** `./scripts/entrypoint.sh` — starts `clio_server`.
- **Binary:** `/opt/clio/bin/clio_server` (also symlinked at `/usr/bin/clio_server`)
- **Config:** `/opt/clio/etc/config.json`
  - **Defaults:** Example config if not mounted.
  - **Custom:** Mount your own config to `/opt/clio/etc/`.

### Mounts

| Path            | Purpose                                                            |
| --------------- | ------------------------------------------------------------------ |
| `/opt/clio/etc` | Config directory. Mount `config.json`. Not overwritten at startup. |
| `/opt/clio/log` | Log output.                                                        |

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

- You want full control over `config.json` and do not need env-based templating.
- You prefer to manage config via bind-mounts or an orchestrator.

## See also

- [Build image (source)](build.md) — build from source using Conan
- [Configuration](configuration.md) — all configuration options
