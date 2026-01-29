# XRP Ledger: Node Container Image (Slim)

Slim XRPL node image **built from source** on **Debian slim** (bookworm-slim) with **static** `xrpld.cfg` and `validators.txt`. No envsubst or template injection — configs are used as-is from example files or your mounts. Smallest runtime footprint.

**Image tags:** `honeycluster/xrpld-slim:${version | nightly | latest}`
- `latest` — Latest stable release
- `nightly` — Nightly build from develop branch
- `${version}` — Specific version tag (e.g., `3.1.0`)

> **Note:** The slim image on Docker Hub is built from source using `build.dockerfile` with the `slim` target (Debian slim base). For build instructions, see [Build image](https://github.com/honeycluster/docker/blob/develop/src/xrpld/docs/build.md).

## Runtime

- **Workdir:** `/opt/xrpl`
- **Entrypoint:** `./scripts/entrypoint.sh` — starts `rippled` (no config injection).
- **Config:** `/opt/xrpl/etc/xrpld.cfg`, `/opt/xrpl/etc/validators.txt`
  - **Defaults:** Uses example configs (`xrpld-example.cfg` and `validators-exmple.txt`) configured for **mainnet** if not mounted.
  - **Custom:** Mount your own configs to `/opt/xrpl/etc/` to override defaults.

### Mounts

| Path | Purpose |
|------|---------|
| **`/opt/xrpl/etc`** | **Config directory.** Mount your own `xrpld.cfg` and `validators.txt` here to override defaults. The slim image does **not** run template injection, so mounted files are **not** overwritten at startup. If not mounted, defaults to example configs (mainnet). |
| `/opt/xrpl/db` | Database. Persist for ledger data. |
| `/opt/xrpl/log` | Debug log. |

### Example: docker run with custom config

```bash
docker run -d \
  -v /path/to/my/xrpld.cfg:/opt/xrpl/etc/xrpld.cfg \
  -v /path/to/my/validators.txt:/opt/xrpl/etc/validators.txt \
  -v /path/to/data:/opt/xrpl/db \
  -p 51234:51234 -p 6005:6005 \
  honeycluster/xrpld-slim:latest
```

### Example: docker-compose

```yaml
services:
  xrpld-slim:
    image: honeycluster/xrpld-slim:latest
    container_name: xrpld-slim
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

- You want the smallest image size (Debian slim) and full control over configs.
- You do not need env-based templating and prefer bind-mounts or a CM/orchestrator.

## See also

- [Build image](https://github.com/honeycluster/docker/blob/develop/src/xrpld/docs/build.md) — build instructions for slim image
- [Configuration options](https://github.com/honeycluster/docker/blob/develop/src/xrpld/docs/configuration.md) (for reference; slim does not use envsubst)
- [Base image](https://github.com/honeycluster/docker/blob/develop/src/xrpld/docs/base.md) — Ubuntu-based static config image
- [Envt image](https://github.com/honeycluster/docker/blob/develop/src/xrpld/docs/envt.md) — template injection and env-based config
