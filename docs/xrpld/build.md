###

<img src="https://i.imgur.com/kmtfYnM.png" alt="XRP logo" width="100" />

###

# XRP Ledger: Build Image (Ubuntu 24.04)

Multi-stage image that **builds xrpld from source** (Conan) and produces a runtime image with the compiled binary.

## xrpld vs rippled

The upstream XRP Ledger binary is `rippled`. This image renames it to **`xrpld`** and installs it at `/opt/xrpl/bin/xrpld`. Symlinks are created so the binary is also available as `rippled` for backward compatibility:

```
/opt/xrpl/bin/xrpld          # primary binary
/usr/bin/rippled        -> /opt/xrpl/bin/xrpld
/usr/local/bin/rippled  -> /opt/xrpl/bin/xrpld
```

Config symlinks cover both default search paths the binary uses at startup:

```
/etc/opt/xrpld/rippled.cfg      -> /opt/xrpl/etc/xrpld.cfg
/etc/opt/xrpld/validators.txt   -> /opt/xrpl/etc/validators.txt
/etc/opt/ripple/rippled.cfg     -> /opt/xrpl/etc/xrpld.cfg
/etc/opt/ripple/validators.txt  -> /opt/xrpl/etc/validators.txt
```

You can use either `xrpld` or `rippled` to interact with the running node:

```bash
xrpld server_info
rippled server_info   # same binary, same result
```

## Build

The `build.dockerfile` produces a single published target: `base`.

### Building the base image

```bash
docker build -f images/build.dockerfile --target base -t xrpld:base .

# With custom version:
docker build -f images/build.dockerfile --target base \
  --build-arg VERSION=3.1.0 \
  --build-arg BRANCH=develop \
  -t xrpld:base .
```

### Build args

| Arg              | Default   | Description                            |
| ---------------- | --------- | -------------------------------------- |
| `VERSION`        | —         | xrpld version/tag to build from source |
| `BRANCH`         | `develop` | Git branch to build from               |
| `GCC_RELEASE`    | `14`      | GCC version for build                  |
| `CONAN_VERSION`  | `2.24`    | Conan version for build                |
| `CMAKE_VERSION`  | —         | CMake version (optional)               |
| `PYTHON_VERSION` | —         | Python version (optional)              |

## Stages

1. **`build`** — Ubuntu 24.04, compiles the xrpld binary from source using Conan.
2. **`common`** — Ubuntu 24.04; shared runtime setup (binary, deps, config, logrotate, scripts).
3. **`base`** — From `common`; static config, entrypoint. Published as `honeycluster/xrpld`.

## Logrotate

The image includes a logrotate configuration for automatic log rotation. On startup, the entrypoint reads the `[debug_logfile]` section from the mounted `xrpld.cfg` to determine the log directory and updates the logrotate config to match.

**How it works:**

1. The entrypoint calls `configure_logrotate` before starting the node
2. `logrotate.sh` parses `[debug_logfile]` from `xrpld.cfg` to extract the log directory
3. The logrotate glob path is updated to point at the resolved directory (e.g., `/opt/xrpl/log/*.log` or `/var/log/xrpld/*.log`)
4. If no config is found or `[debug_logfile]` is missing, it falls back to `/opt/xrpl/log`

**Default logrotate policy:**

| Setting     | Value                                            |
| ----------- | ------------------------------------------------ |
| Frequency   | daily                                            |
| Min size    | 200M                                             |
| Retention   | 7 rotations                                      |
| Compression | gzip (low-priority via `nice`/`ionice`)          |
| Post-rotate | `xrpld --conf /opt/xrpl/etc/xrpld.cfg logrotate` |

This means logs won't rotate until they hit 200MB, even on the daily schedule. After rotation, the `logrotate` command signals the running node to reopen its log file handle.

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

## When to use

- You need a custom xrpld build or a version not in the Ripple apt repo.
- You are building for a platform where the official deb is not provided.
- You want to build from source to match the Docker Hub images.

## See also

- [Base image (deb)](base.md) — pre-built from the Ripple apt repository
