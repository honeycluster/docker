###

<img src="https://i.imgur.com/kmtfYnM.png" alt="XRP logo" width="100" />

###

# XRP Ledger: Base Image (Ubuntu 24.04)

XRPL node image installed from the **Ripple apt repository** (`.deb` package). Static `xrpld.cfg` and `validators.txt` — configs are used as-is from example files or your mounts.

**Image tags:** `honeycluster/xrpld:${version | nightly | latest}`

- `latest` — Latest stable release
- `nightly` — Nightly build from develop branch
- `${version}` — Specific version tag (e.g., `3.1.0`)

## xrpld vs rippled

The upstream binary is `rippled`. This image moves it to `/opt/xrpl/bin/xrpld` and creates symlinks so both names work:

```
/opt/xrpl/bin/xrpld          # primary binary
/usr/bin/rippled        -> /opt/xrpl/bin/xrpld
/usr/local/bin/rippled  -> /opt/xrpl/bin/xrpld
```

Config symlinks cover both default search paths:

```
/etc/opt/xrpld/rippled.cfg      -> /opt/xrpl/etc/xrpld.cfg
/etc/opt/xrpld/validators.txt   -> /opt/xrpl/etc/validators.txt
/etc/opt/ripple/rippled.cfg     -> /opt/xrpl/etc/xrpld.cfg
/etc/opt/ripple/validators.txt  -> /opt/xrpl/etc/validators.txt
```

## Runtime

- **Workdir:** `/opt/xrpl`
- **Entrypoint:** `./scripts/entrypoint.sh` — configures logrotate, then starts `xrpld`.
- **Config:** `/opt/xrpl/etc/xrpld.cfg`, `/opt/xrpl/etc/validators.txt`
  - **Defaults:** Example configs configured for mainnet if not mounted.
  - **Custom:** Mount your own configs to `/opt/xrpl/etc/`.

### Mounts

| Path            | Purpose                                                                               |
| --------------- | ------------------------------------------------------------------------------------- |
| `/opt/xrpl/etc` | Config directory. Mount `xrpld.cfg` and `validators.txt`. Not overwritten at startup. |
| `/opt/xrpl/db`  | Database (NuDB). Persist for ledger data.                                             |
| `/opt/xrpl/log` | Debug log (default location).                                                         |

### Example: docker run

```bash
docker run -d \
  -v /path/to/my/xrpld.cfg:/opt/xrpl/etc/xrpld.cfg \
  -v /path/to/my/validators.txt:/opt/xrpl/etc/validators.txt \
  -v xrpld-data:/opt/xrpl/db \
  -p 51235:51235 -p 5005:5005 -p 6006:6006 \
  honeycluster/xrpld:latest
```

### Example: docker compose

```yaml
services:
  xrpld:
    image: honeycluster/xrpld:latest
    container_name: xrpld
    restart: unless-stopped
    ports:
      - '51235:51235'
      - '5005:5005'
      - '6006:6006'
    volumes:
      - ./config/xrpld.cfg:/opt/xrpl/etc/xrpld.cfg:ro
      - ./config/validators.txt:/opt/xrpl/etc/validators.txt:ro
      - xrpld-data:/opt/xrpl/db
      - xrpld-logs:/opt/xrpl/log
    healthcheck:
      test: ['CMD', 'xrpld', 'server_info']
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

volumes:
  xrpld-data:
  xrpld-logs:
```

## Logrotate

On startup, the entrypoint parses `[debug_logfile]` from `xrpld.cfg` and updates the logrotate config to match the log directory. Falls back to `/opt/xrpl/log` if not found.

| Setting     | Value                                            |
| ----------- | ------------------------------------------------ |
| Frequency   | daily                                            |
| Min size    | 200M                                             |
| Retention   | 7 rotations                                      |
| Compression | gzip (low-priority via `nice`/`ionice`)          |
| Post-rotate | `xrpld --conf /opt/xrpl/etc/xrpld.cfg logrotate` |

## When to use

- You want full control over `xrpld.cfg` and `validators.txt`.
- You prefer to manage configs via bind-mounts or an orchestrator.
- You want the deb-packaged binary without building from source.

## See also

- [Build image (source)](build.md) — build from source using Conan
