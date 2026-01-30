![Honeycluster logo](https://raw.githubusercontent.com/honeycluster/docker/develop/graphics/hc-logo.png)

# XRP Ledger: Node Container Image (Base)

XRPL node image **built from source** with **static** `xrpld.cfg` and `validators.txt`. No envsubst or template injection — configs are used as-is from example files or your mounts.

**Image tags:** `honeycluster/xrpld:${version | nightly | latest}`
- `latest` — Latest stable release
- `nightly` — Nightly build from develop branch
- `${version}` — Specific version tag (e.g., `3.1.0`)

> **Note:** The base image on Docker Hub is built from source using `build.dockerfile` with the `base` target. For build instructions, see [Build image](https://github.com/honeycluster/docker/blob/develop/src/xrpld/docs/build.md).

## Runtime

- **Workdir:** `/opt/xrpl`
- **Entrypoint:** `./scripts/entrypoint.sh` — starts `rippled` (no config injection).
- **Config:** `/opt/xrpl/etc/xrpld.cfg`, `/opt/xrpl/etc/validators.txt`
  - **Defaults:** Uses example configs (`xrpld-example.cfg` and `validators-exmple.txt`) configured for **mainnet** if not mounted.
  - **Custom:** Mount your own configs to `/opt/xrpl/etc/` to override defaults.

### Mounts

| Path | Purpose |
|------|---------|
| **`/opt/xrpl/etc`** | **Config directory.** Mount your own `xrpld.cfg` and `validators.txt` here to override defaults. The base image does **not** run template injection, so mounted files are **not** overwritten at startup. If not mounted, defaults to example configs (mainnet). |
| `/opt/xrpl/db` | Database. Persist for ledger data. |
| `/opt/xrpl/log` | Debug log. |

### Example: docker run with custom config

```bash
docker run -d \
  -v /path/to/my/xrpld.cfg:/opt/xrpl/etc/xrpld.cfg \
  -v /path/to/my/validators.txt:/opt/xrpl/etc/validators.txt \
  -v /path/to/data:/opt/xrpl/db \
  -p 51234:51234 -p 6005:6005 \
  honeycluster/xrpld:latest
```

### Example: docker-compose

```yaml
services:
  xrpld:
    image: honeycluster/xrpld:latest
    container_name: xrpld
    restart: unless-stopped
    ports:
      - "51234:51234"
      - "6005:6005"
    volumes:
      - ./config/xrpld.cfg:/opt/xrpl/etc/xrpld.cfg:ro
      - ./config/validators.txt:/opt/xrpl/etc/validators.txt:ro
      - xrpld-data:/opt/xrpl/db
      - xrpld-logs:/opt/xrpl/log
    healthcheck:
      test: ["CMD", "rippled", "server_info"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

volumes:
  xrpld-data:
  xrpld-logs:
```

## When to use

- You want full control over `xrpld.cfg` and `validators.txt` and do not need env-based templating.
- You prefer to manage configs via bind-mounts or a CM/orchestrator.

## See also

- [Build image](https://github.com/honeycluster/docker/blob/develop/src/xrpld/docs/build.md) — build instructions for base image
- [Configuration options](https://github.com/honeycluster/docker/blob/develop/src/xrpld/docs/configuration.md) (for reference; base does not use envsubst)
- [Envt image](https://github.com/honeycluster/docker/blob/develop/src/xrpld/docs/envt.md) — template injection and env-based config
- [Slim image](https://github.com/honeycluster/docker/blob/develop/src/xrpld/docs/slim.md) — Debian slim, minimal footprint
