###

<img src="https://i.imgur.com/kmtfYnM.png" alt="XRP logo" width="100" />

###

# XRP Ledger: Node Container Image (Base) — rippled

XRPL node image **built from source** with **static** `rippled.cfg` and `validators.txt`. No envsubst or template injection — configs are used as-is from example files or your mounts.

**Image tags:** `honeycluster/rippled:${version | nightly | latest}`

- `latest` — Latest stable release
- `nightly` — Nightly build from develop branch
- `${version}` — Specific version tag (e.g., `3.1.0`)

> **Note:** The base image on Docker Hub is built from source using `build.dockerfile` with the `base` target. For build instructions, see [Build image](build.md).

## Runtime

- **Workdir:** `/opt/ripple`
- **Entrypoint:** `./scripts/entrypoint.sh` — starts `rippled` (no config injection).
- **Config:** `/opt/ripple/etc/rippled.cfg`, `/opt/ripple/etc/validators.txt`
  - **Defaults:** Uses example configs (`rippled-example.cfg` and `validators-exmple.txt`) configured for **mainnet** if not mounted.
  - **Custom:** Mount your own configs to `/opt/ripple/etc/` to override defaults.

### Mounts

| Path                  | Purpose                                                                                                                                                                                                                                                            |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`/opt/ripple/etc`** | **Config directory.** Mount your own `rippled.cfg` and `validators.txt` here to override defaults. The base image does **not** run template injection, so mounted files are **not** overwritten at startup. If not mounted, defaults to example configs (mainnet). |
| `/opt/ripple/db`      | Database. Persist for ledger data.                                                                                                                                                                                                                                 |
| `/opt/ripple/log`     | Debug log.                                                                                                                                                                                                                                                         |

### Example: docker run with custom config

```bash
docker run -d \
  -v /path/to/my/rippled.cfg:/opt/ripple/etc/rippled.cfg \
  -v /path/to/my/validators.txt:/opt/ripple/etc/validators.txt \
  -v /path/to/data:/opt/ripple/db \
  -p 51234:51234 -p 6005:6005 \
  honeycluster/rippled:latest
```

### Example: docker-compose

```yaml
services:
  rippled:
    image: honeycluster/rippled:latest
    container_name: rippled
    restart: unless-stopped
    ports:
      - '51234:51234'
      - '6005:6005'
    volumes:
      - ./config/rippled.cfg:/opt/ripple/etc/rippled.cfg:ro
      - ./config/validators.txt:/opt/ripple/etc/validators.txt:ro
      - rippled-data:/opt/ripple/db
      - rippled-logs:/opt/ripple/log
    healthcheck:
      test: ['CMD', 'rippled', 'server_info']
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

volumes:
  rippled-data:
  rippled-logs:
```

## When to use

- You want the standard `rippled` binary naming and `/opt/ripple` paths (matching the official Ripple deb layout).
- You prefer to manage configs via bind-mounts or a CM/orchestrator.

## See also

- [Build image](build.md) — build instructions for base image
- [Configuration options](configuration.md) (for reference; base does not use envsubst)
