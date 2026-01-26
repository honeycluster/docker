# xrpld Docker images

| Doc | Image | Description |
|-----|-------|-------------|
| [base](base.md) | `base.dockerfile` | rippled from `.deb`; envsubst templates → `/opt/xrpl/etc` |
| [min](min.md) | `min.dockerfile` | rippled from `.deb`; static config, no injection |
| [build](build.md) | `build.dockerfile` | xrpld built from source (Conan), then same entrypoint as base |
| [configuration](configuration.md) | — | All env-based options, overrides, and **`/opt/xrpl/etc`** mount |

**Config mount for custom files:** use **`/opt/xrpl/etc`** for `xrpld.cfg` and `validators.txt`. On the **min** image, mounted files are not overwritten; on **base** and **build**, the entrypoint runs template injection into this directory on each start.
