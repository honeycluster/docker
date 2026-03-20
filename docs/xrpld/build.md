###

<img src="https://i.imgur.com/kmtfYnM.png" alt="XRP logo" width="100" />

###

# XRP Ledger: Build Image (Ubuntu 24.04)

Multi-stage image that **builds xrpld from source** (Conan) and produces runtime images with the built binary. The `build.dockerfile` supports multiple targets: `build`, `common`, `base`, `slim`, and `envt`.

## Build

The `build.dockerfile` is used to build the **base**, **slim**, and **envt** images from source. All images on Docker Hub are built using this dockerfile.

### Building the base image

```bash
docker build -f images/build.dockerfile --target base -t xrpld:base .
# With custom version:
docker build -f images/build.dockerfile --target base \
  --build-arg VERSION=3.1.0 \
  --build-arg BRANCH=develop \
  -t xrpld:base .
```

### Building the slim image

```bash
docker build -f images/build.dockerfile --target slim -t xrpld:slim .
# With custom version:
docker build -f images/build.dockerfile --target slim \
  --build-arg VERSION=3.1.0 \
  --build-arg BRANCH=develop \
  -t xrpld:slim .
```

### Building the envt image

```bash
docker build -f images/build.dockerfile --target envt -t xrpld:envt .
# With custom version:
docker build -f images/build.dockerfile --target envt \
  --build-arg VERSION=3.1.0 \
  --build-arg BRANCH=develop \
  -t xrpld:envt .
```

**Build args**

| Arg              | Default   | Description                            |
| ---------------- | --------- | -------------------------------------- |
| `VERSION`        | `3.0.0`   | xrpld version/tag to build from source |
| `BRANCH`         | `develop` | Git branch to build from               |
| `GCC_RELEASE`    | `14`      | GCC version for build                  |
| `CONAN_VERSION`  | `2.24`    | Conan version for build                |
| `CMAKE_VERSION`  | —         | CMake version (optional)               |
| `PYTHON_VERSION` | —         | Python version (optional)              |

## Stages

1. **`build`** — Ubuntu 24.04, runs the build script to produce the xrpld binary.
2. **`common`** — Ubuntu 24.04; shared runtime setup (binary, deps, config, scripts) for **base** and **envt**.
3. **`base`** — From `common`; static config, no templates. Uses `entrypoint.sh` (no injection). Publishes as `xrpld`.
4. **`slim`** — Debian slim base; static config, no templates. Uses `entrypoint.sh` (no injection). Minimal footprint. Publishes as `xrpld-slim`. Cannot inherit from `common` due to different base image.
5. **`envt`** — From `common`; copies `etc` to `templates`, uses `entrypoint.sub.sh` with envsubst. Publishes as `xrpld-envt`.

## Runtime

### Base target

- **Workdir:** `/opt/xrpl`
- **Entrypoint:** `./scripts/entrypoint.sh` — starts `rippled` (no config injection).
- **Binary:** `xrpld` (symlinked as `rippled`).
- **Config:** `/opt/xrpl/etc/xrpld.cfg`, `/opt/xrpl/etc/validators.txt` — static; mount your own or use defaults.

### Slim target

- **Workdir:** `/opt/xrpl`
- **Entrypoint:** `./scripts/entrypoint.sh` — starts `rippled` (no config injection).
- **Binary:** `xrpld` (symlinked as `rippled`).
- **Config:** `/opt/xrpl/etc/xrpld.cfg`, `/opt/xrpl/etc/validators.txt` — static; same as base but Debian slim base.

### Envt target

- **Workdir:** `/opt/xrpl`
- **Entrypoint:** `./scripts/entrypoint.sub.sh` — runs validation, envsubst from `/opt/xrpl/templates` → `/opt/xrpl/etc`, then starts `rippled`.
- **Binary:** `xrpld` (symlinked as `rippled`).
- **Config:** Generated from templates at startup; use env vars for network/size, etc.

### Mounts

| Path            | Purpose                                                                                                                                                                         |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/opt/xrpl/etc` | Config directory. For **base** and **slim**: mount your own configs; they are not overwritten. For **envt**: resolved configs written here; template injection runs on startup. |
| `/opt/xrpl/db`  | Database (NuDB, etc.). Persist for ledger data.                                                                                                                                 |
| `/opt/xrpl/log` | Debug log.                                                                                                                                                                      |

## When to use

- You need a custom xrpld build or a version not in the Ripple apt repo.
- You are building for a platform where the official deb is not provided.
- You want to build from source to match the Docker Hub images.

## Alternative dockerfiles

There are also alternative dockerfiles that build from the rippled `.deb` package:

- `base.dockerfile` — base image from deb (Ubuntu); static config.
- `slim.dockerfile` — slim image from deb (Debian bookworm-slim); static config.
- `envt.dockerfile` — envt image from deb; envsubst templates.

These are provided for reference but are not used for the images published on Docker Hub.

## See also

- [Base image](base.md) — runtime usage, static config
- [Slim image](slim.md) — Debian slim, minimal footprint
- [Envt image](envt.md) — template injection, env-based config
- [Configuration](configuration.md) — all configuration options
