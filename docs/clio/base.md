###

<img src="https://i.imgur.com/kmtfYnM.png" alt="XRP logo" width="100" />

###

# Clio: Node Container Image (Base)

Clio image with **static** `config.json`. No envsubst or template injection — config is used as-is from the package default, example file, or your mount.

**Image tags:** `honeycluster/clio:${version | nightly | latest}`

- `latest` — Latest stable release
- `nightly` — Nightly build from develop branch
- `${version}` — Specific version tag (e.g., `2.3.0`)

> **Note:** The base image on Docker Hub is built from source using `build.dockerfile` with the `base` target. A standalone `base.dockerfile` is also available for installing from pre-built GitHub release binaries. For build instructions, see [Build image](https://github.com/honeycluster/nodekit/blob/develop/docs/clio/build.md).

## Runtime

- **Workdir:** `/opt/clio`
- **Entrypoint:** `./scripts/entrypoint.sh` — starts `clio_server` (no config injection).
- **Config:** `/opt/clio/etc/config.json`
  - **Defaults:** Package or example config if not mounted.
  - **Custom:** Mount your own config to `/opt/clio/etc/` to override.

### Mounts

| Path                | Purpose                                                                                                                                                                                |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`/opt/clio/etc`** | **Config directory.** Mount your own `config.json` here to override defaults. The base image does **not** run template injection, so mounted files are **not** overwritten at startup. |
| `/opt/clio/log`     | Log output (if used).                                                                                                                                                                  |

### Example: docker run with custom config

```bash
docker run -d \
  -v /path/to/my/config.json:/opt/clio/etc/config.json \
  -p 51233:51233 \
  honeycluster/clio:latest
```

### Example: docker-compose

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
    healthcheck:
      test: ['CMD', 'clio_server', 'info']
      interval: 30s
      timeout: 10s
      retries: 3
```

## When to use

- You want full control over `config.json` and do not need env-based templating.
- You prefer to manage config via bind-mounts or a CM/orchestrator.

## See also

- [Build image](https://github.com/honeycluster/nodekit/blob/develop/docs/clio/build.md) — build instructions for base image
- [Configuration options](https://github.com/honeycluster/nodekit/blob/develop/docs/clio/configuration.md) (for reference; base does not use envsubst)
