![Honeycluster logo](https://raw.githubusercontent.com/honeycluster/docker/develop/graphics/hc-logo.png)

# xrpld Docker images

| Doc | Image | Description |
|-----|-------|-------------|
| [base](base.md) | `base.dockerfile` / `build` target | Static config, no injection; Ubuntu-based |
| [slim](slim.md) | `slim.dockerfile` / `build` target | Debian slim, static config; minimal footprint |
| [envt](envt.md) | `envt.dockerfile` / `build` target | Envsubst templates → `/opt/xrpl/etc`; env-based config |
| [build](build.md) | `build.dockerfile` | xrpld built from source (Conan); produces base, slim, envt |
| [configuration](configuration.md) | — | All env-based options, overrides, and **`/opt/xrpl/etc`** mount |

**Config mount for custom files:** use **`/opt/xrpl/etc`** for `xrpld.cfg` and `validators.txt`. On **base** and **slim**, mounted files are not overwritten (no template injection). On **envt**, the entrypoint runs template injection into this directory on each start.
