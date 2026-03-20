<img src="https://i.imgur.com/Dej2mWa.png" alt="Honeycluster logo" width="100" />


# Clio: Build Image (Ubuntu 24.04)

Multi-stage image that **builds Clio from source** (Conan) and produces runtime images with the built binary. The `build.dockerfile` supports multiple targets: `build`, `common`, `base`, `slim`, and `envt`.

## Build

The `build.dockerfile` is used to build the **base**, **slim**, and **envt** images from source. All images on Docker Hub are built using this dockerfile.

### Building the base image

```bash
docker build -f images/build.dockerfile --target base -t clio:base .
# With custom version/branch:
docker build -f images/build.dockerfile --target base \
  --build-arg VERSION=2.7.0 \
  --build-arg BRANCH=develop \
  -t clio:base .
```

### Building the slim image

```bash
docker build -f images/build.dockerfile --target slim -t clio:slim .
# With custom version/branch:
docker build -f images/build.dockerfile --target slim \
  --build-arg VERSION=2.7.0 \
  --build-arg BRANCH=develop \
  -t clio:slim .
```

### Building the envt image

```bash
docker build -f images/build.dockerfile --target envt -t clio:envt .
# With custom version/branch:
docker build -f images/build.dockerfile --target envt \
  --build-arg VERSION=2.7.0 \
  --build-arg BRANCH=develop \
  -t clio:envt .
```

**Build args**

| Arg | Default | Description |
|-----|---------|-------------|
| `VERSION` | (from build script) | Clio version/tag to build from source |
| `BRANCH` | `develop` | Git branch to build from |
| `GCC_RELEASE` | `14` | GCC version for build |
| `CONAN_VERSION` | `2.24` | Conan version for build |
| `CMAKE_VERSION` | — | CMake version (optional) |
| `PYTHON_VERSION` | — | Python version (optional) |

## Stages

1. **`build`** — Ubuntu 24.04, runs the build script to produce the `clio_server` binary.
2. **`common`** — Ubuntu 24.04; shared runtime setup (binary, config, scripts) for **base** and **envt**.
3. **`base`** — From `common`; static config, no templates. Uses `entrypoint.sh` (no injection). Publishes as `clio`.
4. **`slim`** — Debian slim base; minimal footprint. Uses `entrypoint.sh` (no injection). Publishes as `clio-slim`. Cannot inherit from `common` due to different base image.
5. **`envt`** — From `common`; copies `etc` to `templates`, uses `entrypoint.sub.sh` with envsubst. Publishes as `clio-envt`.

## Runtime

### Base target

- **Workdir:** `/opt/clio`
- **Entrypoint:** `./scripts/entrypoint.sh` — starts `clio_server` (no config injection).
- **Binary:** `clio_server`.
- **Config:** `/opt/clio/etc/config.json` — static; mount your own or use example defaults.

### Slim target

- **Workdir:** `/opt/clio`
- **Entrypoint:** `./scripts/entrypoint.sh` — starts `clio_server` (no config injection).
- **Binary:** `clio_server`.
- **Config:** `/opt/clio/etc/config.json` — static; same as base but Debian slim base.

### Envt target

- **Workdir:** `/opt/clio`
- **Entrypoint:** `./scripts/entrypoint.sub.sh` — runs validation, envsubst from `/opt/clio/templates` → `/opt/clio/etc`, then starts `clio_server`.
- **Binary:** `clio_server`.
- **Config:** Generated from templates at startup; use env vars for database, ETL, server, etc.

### Mounts

| Path | Purpose |
|------|---------|
| `/opt/clio/etc` | Config directory. For **base** and **slim**: mount your own config; it is not overwritten. For **envt**: resolved config written here; template injection runs on startup. |
| `/opt/clio/log` | Log output. |

## When to use

- You need a custom Clio build or a version not in the Ripple apt repo.
- You are building for a platform where the official deb is not provided.
- You want to build from source to match published images.

## Alternative dockerfiles

There are also alternative dockerfiles that build from the Clio `.deb` package:

- `base.dockerfile` — base image from deb (Ubuntu); static config.
- `slim.dockerfile` — slim image from deb (Debian bookworm-slim); static config.
- `envt.dockerfile` — envt image from deb; envsubst templates.

These are provided for reference but are not used for the images published on Docker Hub.

## See also

- [Base image](https://github.com/honeycluster/nodekit/blob/develop/src/clio/docs/base.md) — runtime usage, static config
- [Slim image](https://github.com/honeycluster/nodekit/blob/develop/src/clio/docs/slim.md) — Debian slim, minimal footprint
- [Envt image](https://github.com/honeycluster/nodekit/blob/develop/src/clio/docs/envt.md) — template injection, env-based config
- [Configuration](https://github.com/honeycluster/nodekit/blob/develop/src/clio/docs/configuration.md) — all configuration options
- [BUILD.md](https://github.com/honeycluster/nodekit/blob/develop/src/clio/docs/BUILD.md) — upstream Clio build (CMake/Conan) for building Clio outside Docker
