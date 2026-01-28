# Configuration Options

All options are **overridable via environment variables**. The **base** and **build** images apply them at startup via envsubst from `/opt/xrpl/templates` into `/opt/xrpl/etc`. The **slim** image does not run injection; set options by editing your own `xrpld.cfg` / `validators.txt` or by using a custom entrypoint.

---

## Overriding and mount location

- **Override:** Set the corresponding **environment variable** when running the container (e.g. `-e NETWORK=DEVNET`, `-e SIZE=MEDIUM`). These take precedence over built‑in defaults.
- **Config mount:** To supply your own **config files** (`xrpld.cfg`, `validators.txt`), mount them (or their parent directory) at **`/opt/xrpl/etc`**.
  - **Base / build:** The entrypoint runs template injection **into** `/opt/xrpl/etc` on each start. Files you place there will be **overwritten** unless you change or replace the entrypoint.
  - **Slim:** The slim image does **not** run injection. Mounting `/opt/xrpl/etc` with your own files is supported; they will **not** be overwritten.

---

## Paths

| Variable | Default | Description |
|----------|---------|-------------|
| `CONFIG_DIR` | `/opt/xrpl` | Config root. Templates (base/build) live at `CONFIG_DIR/templates`; resolved configs at `CONFIG_DIR/etc`. |
| `CONFIG_FILE` | `$CONFIG_DIR/etc/xrpld.cfg` | Path to `xrpld.cfg` used by `rippled --conf`. |
| `VALIDATORS_FILE` | `$CONFIG_DIR/etc/validators.txt` | Path to `validators.txt`. |

---

## Network and size

| Variable | Default | Description |
|----------|---------|-------------|
| `NETWORK` | `MAINNET` | `MAINNET`, `TESTNET`, or `DEVNET`. Selects network-specific defaults (e.g. `NETWORK_ID`, `VALIDATOR_LIST_*`, `IPS` for devnet/testnet). |
| `SIZE` | `DEFAULT` | `DEFAULT`, `SMALL`, `MEDIUM`, `LARGE`, `HUGE`, `FULL`. Drives `LEDGER_RETENTION` and `[node_size]`. `FULL` disables `online_delete`/`advisory_delete` and sets `[fetch_depth]`/`[ledger_history]` to `full`. |
| `LEDGER_RETENTION` | set from `SIZE` | Ledger history / `online_delete` depth. `SIZE` mapping: `DEFAULT`/`SMALL` 512, `MEDIUM` 1024, `LARGE` 2048, `HUGE` 4096, `FULL` `full`. Override directly to bypass `SIZE`. |
| `NODE_SIZE` | — | If set, emits `[node_size]` with this value (e.g. `tiny`, `small`, `medium`, `large`, `huge`). |

---

## Ports

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT_PEER` | `51235` | Peer port. |
| `PORT_RPC` | `51234` | RPC port. |
| `PORT_WSS` | `6005` | WebSocket port. |
| `PORT_GRPC` | `50051` | gRPC port. |
| `PORT_RPC_ADMIN_LOCAL` | `5005` | Local admin RPC port. |
| `PORT_WSS_ADMIN_LOCAL` | `6006` | Local admin WebSocket port. |

---

## Admin and SSL

| Variable | Default | Description |
|----------|---------|-------------|
| `ADMIN_IPS` | `127.0.0.1` | Allowed admin IPs. |
| `RIPPLE_CERTS_DIR` | `$CONFIG_DIR/certs` | Directory for SSL certs. |
| `SSL_GENERATE` | `0` | Set to `1` to generate self‑signed certs in `RIPPLE_CERTS_DIR` if missing. |
| `SSL_GENERATE_OVERWRITE` | `0` | Set to `1` to overwrite existing certs when `SSL_GENERATE=1`. |
| `SSL_CERT_CN` | `localhost` | CN for generated certs. |
| `SSL_CERT_DAYS` | `365` | Validity in days for generated certs. |
| `SSL_CERT_SUBJ` | — | Full `-subj` for `openssl req`; overrides CN if set. |
| `SSL_CHAIN_ENABLED` | `0` | Set to `1` to add `ssl_chain` in config. |
| `SSL_CERT_PATH` | — | If set, use this as the cert directory (skips generation and `RIPPLE_CERTS_DIR` for resolution). |

---

## [fetch_depth] and [ledger_history]

| Variable | Default | Description |
|----------|---------|-------------|
| `FETCH_DEPTH` | `full` | `[fetch_depth]` value. For `SIZE=FULL`, forced to `full`. |
| `LEDGER_HISTORY` | from `LEDGER_RETENTION` or `512` | `[ledger_history]` value. For `SIZE=FULL`, forced to `full`. |

---

## [node_db] and database

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_DB_TYPE` | `NuDB` | DB type. `Postgres` enables `[ledger_tx_tables]` (see below). |
| `NODE_DB_PATH` | `/opt/xrpl/db/nudb` | NuDB path. |
| `NODE_DB_ADVISORY_DELETE` | `0` | `advisory_delete` in `[node_db]`. Omitted when `SIZE=FULL`. |
| `NODE_DB_ONLINE_DELETE` | from `LEDGER_RETENTION` or `512` | `online_delete` in `[node_db]`. Omitted when `SIZE=FULL`. |
| `DATABASE_PATH` | `/opt/xrpl/db` | `[database_path]` base. |
| `PG_CONNINFO` | — | Postgres `conninfo` when `NODE_DB_TYPE=Postgres`. |
| `USE_TX_TABLES` | `0` | `use_tx_tables` when `NODE_DB_TYPE=Postgres`. |

---

## Validators and network-specific (mainnet / testnet / devnet)

Network-specific defaults are applied when `NETWORK` is `MAINNET`, `TESTNET`, or `DEVNET` (see `scripts/defaults/mainnet.sh`, `testnet.sh`, `devnet.sh`). These can be overridden by setting the variable yourself.

| Variable | Mainnet default | Testnet default | Devnet default |
|----------|-----------------|-----------------|----------------|
| `NETWORK_ID` | `0` | `testnet` | `devnet` |
| `VALIDATOR_LIST_SITES` | `https://unl.xrplf.org` | `https://vl.altnet.rippletest.net` | `https://vl.devnet.rippletest.net` |
| `VALIDATOR_LIST_KEYS` | (see mainnet.sh) | (see testnet.sh) | (see devnet.sh) |
| `IPS` | — | `s.altnet.rippletest.net 51235` | `s.devnet.rippletest.net 51235` |

---

## Optional [sections]

Set the variable to non‑empty to enable; leave unset to omit.

| Variable | Config section | Description |
|----------|----------------|-------------|
| `VALIDATION_QUORUM` | `[validation_quorum]` | Section body. |
| `PEERS_MAX` | `[peers_max]` | Section body. |
| `VALIDATION_SEED` | `[validation_seed]` | Section body. |
| `VALIDATORS_SITE` | `[validators_site]` | Section body. |
| `IPS` | `[ips]` | Newline‑separated peer list (can be set by network defaults). |
| `IPS_FIXED` | `[ips_fixed]` | Section body. |

---

## Other

| Variable | Default | Description |
|----------|---------|-------------|
| `DEBUG_LOGFILE` | `/opt/xrpl/log/debug.log` | Debug log path. |
| `SNTP_SERVERS` | `pool.ntp.org` | `[sntp_servers]`. |
| `PEER_PRIVATE` | `0` | `[peer_private]` (`0` or `1`). |
| `RPC_STARTUP_CMDS` | `{ "command": "log_level", "severity": "info" }` | JSON array for `[rpc_startup]`. |
| `REPORTING_MODE` | — | If set, adds `[reporting]` and `[etl_source]`. |
| `ETL_SOURCE_GRPC_PORT` | `50051` | Used when `REPORTING_MODE` is set. |
| `ETL_SOURCE_WS_PORT` | `6005` | Used when `REPORTING_MODE` is set. |
| `ETL_SOURCE_IP` | `127.0.0.1` | Used when `REPORTING_MODE` is set. |
| `RIPPLE_BIN` | `/opt/xrpl/bin/rippled` | Binary used by the startup script (`rippled` or path). |

---

## Config mount: `/opt/xrpl/etc`

- **Base / build:** The entrypoint writes `xrpld.cfg` and `validators.txt` into `/opt/xrpl/etc` from templates. Mounting `/opt/xrpl/etc` will persist those generated files; anything you put there will be **overwritten** on the next start unless you switch to a non‑injecting entrypoint (e.g. slim‑style) or change the logic.
- **Slim:** No injection. Mount `/opt/xrpl/etc` with your own `xrpld.cfg` and `validators.txt`; they will **not** be overwritten.

Example (slim; own configs):

```bash
docker run -d \
  -v /host/xrpld.cfg:/opt/xrpl/etc/xrpld.cfg \
  -v /host/validators.txt:/opt/xrpl/etc/validators.txt \
  -v xrpld-db:/opt/xrpl/db \
  -p 51234:51234 -p 6005:6005 \
  xrpld:slim
```
