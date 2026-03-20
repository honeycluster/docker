###

<img src="https://i.imgur.com/kmtfYnM.png" alt="XRP logo" width="100" />

###

# XRP Ledger: Build Image (Ubuntu 24.04) — rippled

Multi-stage image that **builds rippled from source** (Conan) and produces a runtime image with the compiled binary. This is the standard-naming variant — the binary stays as `rippled` at `/opt/ripple/bin/rippled`.

> For the renamed `xrpld` variant with `/opt/xrpl` paths, see [xrpld docs](../xrpld/build.md).

## rippled vs xrpld

This image uses the **upstream naming**: the binary is `rippled` and lives at `/opt/ripple`. The `xrpld` image is a renamed variant of the same binary. Both images build from the same XRPLF/rippled source — the only difference is the install path and binary name.

| | rippled image | xrpld image |
|---|---|---|
| Binary | `/opt/ripple/bin/rippled` | `/opt/xrpl/bin/xrpld` |
| Config | `/opt/ripple/etc/rippled.cfg` | `/opt/xrpl/etc/xrpld.cfg` |
| Docker Hub | `honeycluster/rippled` | `honeycluster/xrpld` |

Config symlinks cover both default search paths the binary uses at startup:

```
/etc/opt/ripple/rippled.cfg     -> /opt/ripple/etc/rippled.cfg
/etc/opt/ripple/validators.txt  -> /opt/ripple/etc/validators.txt
/etc/opt/xrpld/rippled.cfg     -> /opt/ripple/etc/rippled.cfg
/etc/opt/xrpld/validators.txt  -> /opt/ripple/etc/validators.txt
```

## Build

The `build.dockerfile` produces a single published target: `base`.

### Building the base image

```bash
docker build -f images/build.dockerfile --target base -t rippled:base .

# With custom version:
docker build -f images/build.dockerfile --target base \
  --build-arg VERSION=3.1.0 \
  --build-arg BRANCH=develop \
  -t rippled:base .
```

### Build args

| Arg              | Default   | Description                              |
| ---------------- | --------- | ---------------------------------------- |
| `VERSION`        | —         | rippled version/tag to build from source |
| `BRANCH`         | `develop` | Git branch to build from                 |
| `GCC_RELEASE`    | `14`      | GCC version for build                    |
| `CONAN_VERSION`  | `2.24`    | Conan version for build                  |
| `CMAKE_VERSION`  | —         | CMake version (optional)                 |
| `PYTHON_VERSION` | —         | Python version (optional)                |

## Stages

1. **`build`** — Ubuntu 24.04, compiles the rippled binary from source using Conan.
2. **`common`** — Ubuntu 24.04; shared runtime setup (binary, deps, config, logrotate, scripts).
3. **`base`** — From `common`; static config, entrypoint. Published as `honeycluster/rippled`.

## Logrotate

The image includes a logrotate configuration for automatic log rotation. On startup, the entrypoint reads the `[debug_logfile]` section from the mounted `rippled.cfg` to determine the log directory and updates the logrotate config to match.

**How it works:**

1. The entrypoint calls `configure_logrotate` before starting the node
2. `logrotate.sh` parses `[debug_logfile]` from `rippled.cfg` to extract the log directory
3. The logrotate glob path is updated to point at the resolved directory (e.g., `/opt/ripple/log/*.log`)
4. If no config is found or `[debug_logfile]` is missing, it falls back to `/opt/ripple/log`

**Default logrotate policy:**

| Setting     | Value                                                  |
| ----------- | ------------------------------------------------------ |
| Frequency   | daily                                                  |
| Min size    | 200M                                                   |
| Retention   | 7 rotations                                            |
| Compression | gzip (low-priority via `nice`/`ionice`)                |
| Post-rotate | `rippled --conf /opt/ripple/etc/rippled.cfg logrotate` |

Logs won't rotate until they hit 200MB, even on the daily schedule. After rotation, the `logrotate` command signals the running node to reopen its log file handle.

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

## When to use

- You need a custom rippled build or a version not in the Ripple apt repo.
- You prefer the standard `rippled` naming and `/opt/ripple` paths.
- You want to build from source to match the Docker Hub images.

## See also

- [Base image (deb)](base.md) — pre-built from the Ripple apt repository
- [Configuration](configuration.md) — all configuration options
