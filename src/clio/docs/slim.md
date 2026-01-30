![Honeycluster logo](https://raw.githubusercontent.com/honeycluster/docker/develop/graphics/hc-logo.png)

# Clio: Node Container Image (Slim)

Slim Clio image **built from source** on **Debian slim** (bookworm-slim) with **static** `config.json`. No envsubst or template injection — config is used as-is from the package default or your mount. Smallest runtime footprint.

**Image tags:** `honeycluster/clio-slim:${version | latest}`
- `latest` — Latest stable release
- `${version}` — Specific version tag (e.g., `2.7.0`)

> **Note:** The slim image on Docker Hub is built from source using `build.dockerfile` with the `slim` target (Debian slim base). For build instructions, see [Build image](https://github.com/honeycluster/docker/blob/develop/src/clio/docs/build.md).

## Runtime

- **Workdir:** `/opt/clio`
- **Entrypoint:** `./scripts/entrypoint.sh` — starts `clio_server` (no config injection).
- **Config:** `/opt/clio/etc/config.json`
  - **Defaults:** Package default if not mounted.
  - **Custom:** Mount your own config to `/opt/clio/etc/` to override.

### Mounts

| Path | Purpose |
|------|---------|
| **`/opt/clio/etc`** | **Config directory.** Mount your own `config.json` here to override defaults. The slim image does **not** run template injection, so mounted files are **not** overwritten at startup. |
| `/opt/clio/log` | Log output (if used). |

### Example: docker run with custom config

```bash
docker run -d \
  -v /path/to/my/config.json:/opt/clio/etc/config.json \
  -p 51233:51233 \
  honeycluster/clio-slim:latest
```

### Example: docker-compose

```yaml
services:
  clio-slim:
    image: honeycluster/clio-slim:latest
    container_name: clio-slim
    restart: unless-stopped
    ports:
      - "51233:51233"
    volumes:
      - ./config/config.json:/opt/clio/etc/config.json:ro
    healthcheck:
      test: ["CMD", "clio_server", "info"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## When to use

- You want the smallest image size (Debian slim) and full control over config.
- You do not need env-based templating and prefer bind-mounts or a CM/orchestrator.

## See also

- [Build image](https://github.com/honeycluster/docker/blob/develop/src/clio/docs/build.md) — build instructions for slim image
- [Configuration options](https://github.com/honeycluster/docker/blob/develop/src/clio/docs/CONFIGURATION.md) (for reference; slim does not use envsubst)
- [Base image](https://github.com/honeycluster/docker/blob/develop/src/clio/docs/base.md) — Ubuntu-based static config image
- [Envt image](https://github.com/honeycluster/docker/blob/develop/src/clio/docs/envt.md) — template injection and env-based config
