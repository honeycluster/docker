# xrpld Build Image

Multi-stage image that **builds xrpld from source** (Conan) and produces a minimal runtime image with the built binary and default config.

## Build

From `docker/rippled` (or with correct `context` and `file`):

```bash
docker build -f images/build.dockerfile -t xrpld:built .
```

**Build args**

| Arg | Default | Description |
|-----|---------|-------------|
| `VERSION` | `3.0.0` | xrpld version to build |

## Stages

1. **`build`** — Ubuntu 24.04, runs `conan-build.sh` to produce the xrpld binary.
2. **Final** — Ubuntu 22.04; copies `/opt/xrpl/.build/bin` and config from the build stage, installs deps, uses `entrypoint.sh`.

## Runtime

- **Workdir:** `/opt/xrpl`
- **Entrypoint:** `./scripts/entrypoint.sh` (same as base: validation, template injection, then `rippled`).
- **Binary:** `xrpld` (symlinked as `rippled`).
- **Config:** `/opt/xrpl/etc/xrpld.cfg`, `/opt/xrpl/etc/validators.txt` (from build stage; entrypoint can overwrite via templates if present).

### Mounts

Same as [base](base.md):

| Path | Purpose |
|------|---------|
| `/opt/xrpl/etc` | Config directory. Resolved configs written here; mount to persist or supply your own. Template injection runs on startup. |
| `/opt/xrpl/db` | Database. |
| `/opt/xrpl/log` | Debug log. |

## When to use

- You need a custom xrpld build or a version not in the Ripple apt repo.
- You are building for a platform where the official deb is not provided.

## See also

- [Base image](base.md)
- [Configuration](configuration.md)
