![Honeycluster logo](https://raw.githubusercontent.com/honeycluster/docker/develop/graphics/hc-logo.png)

# XRP Ledger: Node Container Image (Envt)

XRPL node image **built from source** with template injection, SSL generation, and network/size-aware defaults. The **envt** image uses envsubst to generate config from templates at startup.

---

> **⚠️ Important: Do not mount custom `xrpld.cfg` or `validators.txt`**
>
> **It is not recommended** to mount your own `xrpld.cfg` and `validators.txt` into the envt image. The entrypoint **overwrites** files in `/opt/xrpl/etc` during template injection on **every startup**, including **restarts**. Any custom config you mount there will be replaced.
>
> If you need to use mounted config files, use the **[base](https://github.com/honeycluster/docker/blob/develop/src/xrpld/docs/base.md)** image (`honeycluster/xrpld`) or the **[slim](https://github.com/honeycluster/docker/blob/develop/src/xrpld/docs/slim.md)** image (`honeycluster/xrpld-slim`) instead. Both use static config and do **not** overwrite mounted files.

---

**Image tags:** `honeycluster/xrpld-envt:${version | nightly | latest}`
- `latest` — Latest stable release
- `nightly` — Nightly build from develop branch
- `${version}` — Specific version tag (e.g., `3.1.0`)

> **Note:** The envt image on Docker Hub is built from source using `build.dockerfile` with the `envt` target. For build instructions, see [Build image](https://github.com/honeycluster/docker/blob/develop/src/xrpld/docs/build.md).

## Runtime

- **Workdir:** `/opt/xrpl`
- **Entrypoint:** `./scripts/entrypoint.sub.sh` — runs validation, envsubst from `/opt/xrpl/templates` → `/opt/xrpl/etc`, then starts `rippled`.
- **Config output:** `/opt/xrpl/etc/xrpld.cfg`, `/opt/xrpl/etc/validators.txt`
  - **Template injection:** Configs are generated from templates using environment variables on each startup.
  - **Defaults:** Uses network/size-aware defaults (mainnet/default by default) if no environment variables are set.

### Environment Variables

The envt image supports environment variables for network and size configuration:

| Variable | Default | Allowable Values | Description |
|----------|---------|-----------------|-------------|
| `NETWORK` | `MAINNET` | `MAINNET`, `TESTNET`, `DEVNET` | Selects network-specific defaults. Sets `NETWORK_ID`, `VALIDATOR_LIST_SITES`, `VALIDATOR_LIST_KEYS`, and `IPS` (for testnet/devnet). |
| `SIZE` | `DEFAULT` | `DEFAULT`, `SMALL`, `MEDIUM`, `LARGE`, `HUGE`, `FULL` | Determines ledger retention and node size configuration. `FULL` disables `online_delete`/`advisory_delete` and sets `[fetch_depth]`/`[ledger_history]` to `full`. |

**Size to Ledger Retention mapping:**

| SIZE | LEDGER_RETENTION (default) |
|------|----------------------------|
| `DEFAULT` | `512` |
| `SMALL` | `512` |
| `MEDIUM` | `1024` |
| `LARGE` | `2048` |
| `HUGE` | `4096` |
| `FULL` | `full` |

For a complete list of all configuration options, see [Configuration](https://github.com/honeycluster/docker/blob/develop/src/xrpld/docs/configuration.md).

### Example: docker run

No volume mounts. Config is generated from templates at startup; db and log are ephemeral.

```bash
# Default mainnet config
docker run -d \
  -p 51234:51234 -p 6005:6005 \
  honeycluster/xrpld-envt:latest

# Testnet, full history
docker run -d \
  -e NETWORK=TESTNET \
  -e SIZE=FULL \
  -p 51234:51234 -p 6005:6005 \
  honeycluster/xrpld-envt:latest

# Devnet, small size
docker run -d \
  -e NETWORK=DEVNET \
  -e SIZE=SMALL \
  -p 51234:51234 -p 6005:6005 \
  honeycluster/xrpld-envt:nightly
```

### Example: docker-compose (all env variables)

Complete example using environment variables. No volume mounts. See [Configuration](https://github.com/honeycluster/docker/blob/develop/src/xrpld/docs/configuration.md) for the full list and defaults.

```yaml
services:
  xrpld-envt:
    image: honeycluster/xrpld-envt:latest
    container_name: xrpld-envt
    restart: unless-stopped
    environment:
      # Network and size
      - NETWORK=TESTNET
      - SIZE=LARGE
      - LEDGER_RETENTION=2048
      - NODE_SIZE=large
      # Ports
      - PORT_PEER=51235
      - PORT_RPC=51234
      - PORT_WSS=6005
      - PORT_GRPC=50051
      - PORT_RPC_ADMIN_LOCAL=5005
      - PORT_WSS_ADMIN_LOCAL=6006
      # Admin and SSL
      - ADMIN_IPS=127.0.0.1
      - SSL_GENERATE=1
      - SSL_GENERATE_OVERWRITE=0
      - SSL_CERT_CN=localhost
      - SSL_CERT_DAYS=365
      - SSL_CHAIN_ENABLED=0
      # Paths
      - CONFIG_DIR=/opt/xrpl
      - DATABASE_PATH=/opt/xrpl/db
      - NODE_DB_PATH=/opt/xrpl/db/nudb
      - DEBUG_LOGFILE=/opt/xrpl/log/debug.log
      # Node DB
      - NODE_DB_TYPE=NuDB
      - NODE_DB_ADVISORY_DELETE=0
      - NODE_DB_ONLINE_DELETE=2048
      # Fetch depth and ledger history
      - FETCH_DEPTH=full
      - LEDGER_HISTORY=2048
      # Validators (optional overrides; otherwise set by NETWORK)
      # - VALIDATOR_LIST_SITES=https://vl.altnet.rippletest.net
      # - VALIDATOR_LIST_KEYS=ED264807102805220DA0F312E71FC2C69E1552C9C5790F6C25E3729DEB573D5860
      # Optional sections (set to non-empty to enable)
      # - VALIDATION_QUORUM=
      # - PEERS_MAX=
      # - IPS=  # set by NETWORK for testnet/devnet
      # Other
      - SNTP_SERVERS=pool.ntp.org
      - PEER_PRIVATE=0
      - RPC_STARTUP_CMDS={"command":"log_level","severity":"info"}
    ports:
      - "51234:51234"
      - "6005:6005"
      - "50051:50051"
    healthcheck:
      test: ["CMD", "rippled", "server_info"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### Example: docker-compose with `.env` file

Use a `.env` file to hold environment variables and reference it via `env_file`. No volume mounts.

```yaml
services:
  xrpld-envt:
    image: honeycluster/xrpld-envt:latest
    container_name: xrpld-envt
    restart: unless-stopped
    env_file: .env # Optional
    ports:
      - "51234:51234"
      - "6005:6005"
      - "50051:50051"
    healthcheck:
      test: ["CMD", "rippled", "server_info"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

Run with `docker compose up -d` (or `docker-compose up -d`). Variables from `.env` are loaded into the container.

## Configuration

All options can be overridden via **environment variables**. The entrypoint injects them into the config from templates. See [Configuration](https://github.com/honeycluster/docker/blob/develop/src/xrpld/docs/configuration.md) for the full list and override behavior.

## See also

- [Configuration options](https://github.com/honeycluster/docker/blob/develop/src/xrpld/docs/configuration.md)
- [Base image](https://github.com/honeycluster/docker/blob/develop/src/xrpld/docs/base.md) — static config, no envsubst
- [Slim image](https://github.com/honeycluster/docker/blob/develop/src/xrpld/docs/slim.md) — Debian slim, minimal footprint
- [Build image](https://github.com/honeycluster/docker/blob/develop/src/xrpld/docs/build.md) — build xrpld from source
