###

<img src="https://i.imgur.com/kmtfYnM.png" alt="XRP logo" width="100" />

###

# XRP Ledger: Base Image (Ubuntu 24.04) — rippled

XRPL node image installed from the **Ripple apt repository** (`.deb` package). Uses standard `rippled` naming at `/opt/ripple`. Static `rippled.cfg` and `validators.txt` — configs are used as-is from example files or your mounts.

**Image tags:** `honeycluster/rippled:${version | nightly | latest}`

- `latest` — Latest stable release
- `nightly` — Nightly build from develop branch
- `${version}` — Specific version tag (e.g., `3.1.0`)

> For the renamed `xrpld` variant with `/opt/xrpl` paths, see [xrpld docs](../xrpld/base.md).

## Runtime

- **Workdir:** `/opt/ripple`
- **Entrypoint:** `./scripts/entrypoint.sh` — configures logrotate, then starts `rippled`.
- **Config:** `/opt/ripple/etc/rippled.cfg`, `/opt/ripple/etc/validators.txt`
  - **Defaults:** Example configs configured for mainnet if not mounted.
  - **Custom:** Mount your own configs to `/opt/ripple/etc/`.

### Mounts

| Path              | Purpose                                                                                 |
| ----------------- | --------------------------------------------------------------------------------------- |
| `/opt/ripple/etc` | Config directory. Mount `rippled.cfg` and `validators.txt`. Not overwritten at startup. |
| `/opt/ripple/db`  | Database (NuDB). Persist for ledger data.                                               |
| `/opt/ripple/log` | Debug log (default location).                                                           |

### Example: docker run

```bash
docker run -d \
  -v /path/to/my/rippled.cfg:/opt/ripple/etc/rippled.cfg \
  -v /path/to/my/validators.txt:/opt/ripple/etc/validators.txt \
  -v rippled-data:/opt/ripple/db \
  -p 51235:51235 -p 5005:5005 -p 6006:6006 \
  honeycluster/rippled:latest
```

### Example: docker compose

```yaml
services:
  rippled:
    image: honeycluster/rippled:latest
    container_name: rippled
    restart: unless-stopped
    ports:
      - '51235:51235'
      - '5005:5005'
      - '6006:6006'
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

## Logrotate

On startup, the entrypoint parses `[debug_logfile]` from `rippled.cfg` and updates the logrotate config to match the log directory. Falls back to `/opt/ripple/log` if not found.

| Setting     | Value                                                  |
| ----------- | ------------------------------------------------------ |
| Frequency   | daily                                                  |
| Min size    | 200M                                                   |
| Retention   | 7 rotations                                            |
| Compression | gzip (low-priority via `nice`/`ionice`)                |
| Post-rotate | `rippled --conf /opt/ripple/etc/rippled.cfg logrotate` |

## When to use

- You want the standard `rippled` binary naming and `/opt/ripple` paths (matching the official Ripple deb layout).
- You prefer to manage configs via bind-mounts or an orchestrator.
- You want the deb-packaged binary without building from source.

## See also

- [Build image (source)](build.md) — build from source using Conan
- [Configuration](configuration.md) — all configuration options
