###

<img src="https://i.imgur.com/kmtfYnM.png" alt="XRP logo" width="100" />

###

# XRP Ledger: Build Image (Ubuntu 24.04) — rippled

Multi-stage image that **builds rippled from source** (Conan) and produces runtime images with the built binary. The `build.dockerfile` supports multiple targets: `build`, `common`, and `base`.

## Build

The `build.dockerfile` is used to build the **base** image from source. All images on Docker Hub are built using this dockerfile.

### Building the base image

```bash
docker build -f images/build.dockerfile --target base -t rippled:base .
# With custom version:
docker build -f images/build.dockerfile --target base \
  --build-arg VERSION=3.1.0 \
  --build-arg BRANCH=develop \
  -t rippled:base .
```

**Build args**

| Arg              | Default   | Description                              |
| ---------------- | --------- | ---------------------------------------- |
| `VERSION`        | `3.0.0`   | rippled version/tag to build from source |
| `BRANCH`         | `develop` | Git branch to build from                 |
| `GCC_RELEASE`    | `14`      | GCC version for build                    |
| `CONAN_VERSION`  | `2.24`    | Conan version for build                  |
| `CMAKE_VERSION`  | —         | CMake version (optional)                 |
| `PYTHON_VERSION` | —         | Python version (optional)                |

## Stages

1. **`build`** — Ubuntu 24.04, runs the build script to produce the rippled binary.
2. **`common`** — Ubuntu 24.04; shared runtime setup (binary, deps, config, scripts).
3. **`base`** — From `common`; static config, no templates. Uses `entrypoint.sh` (no injection). Publishes as `rippled`.

## Runtime

### Base target

- **Workdir:** `/opt/ripple`
- **Entrypoint:** `./scripts/entrypoint.sh` — starts `rippled` (no config injection).
- **Binary:** `rippled` at `/opt/ripple/bin/rippled`.
- **Config:** `/opt/ripple/etc/rippled.cfg`, `/opt/ripple/etc/validators.txt` — static; mount your own or use defaults.

### Mounts

| Path              | Purpose                                                             |
| ----------------- | ------------------------------------------------------------------- |
| `/opt/ripple/etc` | Config directory. Mount your own configs; they are not overwritten. |
| `/opt/ripple/db`  | Database (NuDB, etc.). Persist for ledger data.                     |
| `/opt/ripple/log` | Debug log.                                                          |

## When to use

- You need a custom rippled build or a version not in the Ripple apt repo.
- You are building for a platform where the official deb is not provided.
- You want to build from source to match the Docker Hub images.
- You prefer the standard `rippled` naming over the `xrpld` alias.

## See also

- [Base image](base.md) — runtime usage, static config
- [Configuration](configuration.md) — all configuration options
