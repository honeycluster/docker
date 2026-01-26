# xrpld Slim Image

Slim XRPL node image from the **rippled** `.deb` with **static** `xrpld.cfg` and `validators.txt`. No envsubst or template injection — configs are copied as-is from example files.

## Build

```bash
docker build -f images/slim.dockerfile -t xrpld:slim .
# Multi-platform:
docker build --build-arg PLATFORM=linux/arm64 -f images/slim.dockerfile -t xrpld:slim .
```

**Build args**

| Arg | Default | Description |
|-----|---------|-------------|
| `PLATFORM` | `linux/amd64` | Target platform |
| `RIPPLED_VERSION` | `3.0.0-1` | rippled deb version |

## Runtime

- **Workdir:** `/opt/xrpl`
- **Entrypoint:** `./scripts/entrypoint.min.sh` — starts `rippled` (no config injection).
- **Config:** `/opt/xrpl/etc/xrpld.cfg`, `/opt/xrpl/etc/validators.txt` (from `xrpld-example.cfg` and `validators-exmple.txt` in the image).

### Mounts

| Path | Purpose |
|------|---------|
| **`/opt/xrpl/etc`** | **Config directory.** Place your own `xrpld.cfg` and `validators.txt` here. The slim image does **not** run template injection, so mounted files are **not** overwritten at startup. |
| `/opt/xrpl/db` | Database. Persist for ledger data. |
| `/opt/xrpl/log` | Debug log. |

### Example: custom config

```bash
docker run -d \
  -v /path/to/my/xrpld.cfg:/opt/xrpl/etc/xrpld.cfg \
  -v /path/to/my/validators.txt:/opt/xrpl/etc/validators.txt \
  -p 51234:51234 -p 6005:6005 \
  xrpld:slim
```

## When to use

- You want full control over `xrpld.cfg` and `validators.txt` and do not need env-based templating.
- You prefer to manage configs via bind-mounts or a CM/orchestrator.

## See also

- [Configuration options](configuration.md) (for reference; slim does not use envsubst)
- [Base image](base.md) — template injection and env-based config
