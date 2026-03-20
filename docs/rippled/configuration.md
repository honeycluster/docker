# Configuration Options — rippled

The rippled images use the same configuration format as xrpld. See the [xrpld configuration reference](../xrpld/configuration.md) for the full list of environment variables and config sections.

The only difference is the default paths:

| Setting           | xrpld                        | rippled                        |
| ----------------- | ---------------------------- | ------------------------------ |
| Binary            | `/opt/xrpl/bin/xrpld`       | `/opt/ripple/bin/rippled`      |
| Config file       | `/opt/xrpl/etc/xrpld.cfg`   | `/opt/ripple/etc/rippled.cfg`  |
| Validators file   | `/opt/xrpl/etc/validators.txt` | `/opt/ripple/etc/validators.txt` |
| Database path     | `/opt/xrpl/db`               | `/opt/ripple/db`               |
| Log directory     | `/opt/xrpl/log`              | `/opt/ripple/log`              |
| Config root       | `/opt/xrpl`                  | `/opt/ripple`                  |

## Config mount: `/opt/ripple/etc`

Mount your own `rippled.cfg` and `validators.txt` to `/opt/ripple/etc`. The base image does **not** run template injection — mounted files are **not** overwritten.

```bash
docker run -d \
  -v /host/rippled.cfg:/opt/ripple/etc/rippled.cfg \
  -v /host/validators.txt:/opt/ripple/etc/validators.txt \
  -v rippled-db:/opt/ripple/db \
  -p 51234:51234 -p 6005:6005 \
  honeycluster/rippled:latest
```

For the full configuration reference (environment variables, network defaults, size options, ports, database settings, validators), see [xrpld configuration](../xrpld/configuration.md).
