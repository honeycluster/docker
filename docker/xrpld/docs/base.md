# xrpld Base Image

XRPL node image built from the official **rippled** `.deb` (Ripple apt repository). Supports envsubst-based template injection, SSL generation, and network/size-aware defaults.

## Build

```bash
docker build -f images/base.dockerfile -t xrpld:base .
# Multi-platform (e.g. arm64):
docker build --build-arg PLATFORM=linux/arm64 -f images/base.dockerfile -t xrpld:base .
```

**Build args**

| Arg | Default | Description |
|-----|---------|-------------|
| `PLATFORM` | `linux/amd64` | Target platform for `FROM` (e.g. `linux/arm64`) |
| `RIPPLED_VERSION` | `3.0.0-1` | rippled deb version |

## Runtime

- **Workdir:** `/opt/xrpl`
- **Entrypoint:** `./scripts/entrypoint.sh` — runs validation, envsubst from `/opt/xrpl/templates` → `/opt/xrpl/etc`, then starts `rippled`.
- **Config output:** `/opt/xrpl/etc/xrpld.cfg`, `/opt/xrpl/etc/validators.txt`

### Mounts

| Path | Purpose |
|------|---------|
| `/opt/xrpl/etc` | **Config directory.** Resolved configs are written here. Mount this to persist configs or to supply your own `xrpld.cfg` and `validators.txt`. *Note: the entrypoint runs template injection into `/opt/xrpl/etc` on each start; mounted files will be overwritten. To use static custom configs without injection, use the [min](min.md) image or a custom entrypoint.* |
| `/opt/xrpl/db` | Database (NuDB, etc.). Persist for ledger data. |
| `/opt/xrpl/log` | Debug log. |

### Healthcheck (optional)

Compose/stack can use:

```yaml
healthcheck:
  test: ["CMD", "rippled", "server_info"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

## Configuration

All options can be overridden via **environment variables**. The entrypoint injects them into the config from templates. See [Configuration](configuration.md) for the full list and override behavior.

## See also

- [Configuration options](configuration.md)
- [Min image](min.md) — static config, no envsubst
- [Build image](build.md) — build xrpld from source
