###

<img src="https://i.imgur.com/kmtfYnM.png" alt="XRP logo" width="100" />

###

# Clio: Node Container Image (Envt)

Clio image **built from source** with template injection and SSL generation. The **envt** image uses envsubst to generate `config.json` from templates at startup.

---

> **Important: Do not mount custom `config.json`**
>
> **It is not recommended** to mount your own `config.json` into the envt image. The entrypoint **overwrites** files in `/opt/clio/etc` during template injection on **every startup**, including **restarts**. Any custom config you mount there will be replaced.
>
> If you need to use mounted config files, use the **[base](https://github.com/honeycluster/docker/blob/develop/src/clio/docs/base.md)** image (`honeycluster/clio`) or the **[slim](https://github.com/honeycluster/docker/blob/develop/src/clio/docs/slim.md)** image (`honeycluster/clio-slim`) instead. Both use static config and do **not** overwrite mounted files.

---

**Image tags:** `honeycluster/clio-envt:${version | nightly | latest}`

- `latest` — Latest stable release
- `nightly` — Nightly build from develop branch
- `${version}` — Specific version tag (e.g., `2.7.0`)

> **Note:** The envt image on Docker Hub is built from source using `build.dockerfile` with the `envt` target. For build instructions, see [Build image](https://github.com/honeycluster/docker/blob/develop/src/clio/docs/build.md).

## Runtime

- **Workdir:** `/opt/clio`
- **Entrypoint:** `./scripts/entrypoint.sub.sh` — runs validation, envsubst from `/opt/clio/templates` → `/opt/clio/etc`, then starts `clio_server`.
- **Config output:** `/opt/clio/etc/config.json`
  - **Template injection:** Config is generated from templates using environment variables on each startup.
  - **Defaults:** Uses defaults from `scripts/config/defaults.sh` and `scripts/defaults/common.sh` if no environment variables are set.

### Environment Variables

The envt image supports environment variables for database, ETL sources, server, and other options. Key variables:

| Variable                   | Default     | Description                                         |
| -------------------------- | ----------- | --------------------------------------------------- |
| `CASSANDRA_CONTACT_POINTS` | `127.0.0.1` | Cassandra/ScyllaDB contact points                   |
| `CASSANDRA_PORT`           | `9042`      | Cassandra port                                      |
| `CASSANDRA_KEYSPACE`       | `clio`      | Keyspace name                                       |
| `ETL_SOURCE_IP`            | `127.0.0.1` | ETL source (rippled) IP                             |
| `ETL_SOURCE_WS_PORT`       | `6006`      | ETL WebSocket port                                  |
| `ETL_SOURCE_GRPC_PORT`     | `50051`     | ETL gRPC port                                       |
| `SERVER_IP`                | `0.0.0.0`   | Clio server bind IP                                 |
| `SERVER_PORT`              | `51233`     | Clio server port                                    |
| `SSL_GENERATE`             | `0`         | Set to `1` to generate self-signed certs at startup |

For the complete list of all configuration options, see [Configuration](https://github.com/honeycluster/docker/blob/develop/src/clio/docs/configuration.md).

### Example: docker run

Config is generated from templates at startup.

```bash
# Default config (localhost Cassandra, default ETL)
docker run -d \
  -p 51233:51233 \
  honeycluster/clio-envt:latest

# With custom database and ETL source
docker run -d \
  -e CASSANDRA_CONTACT_POINTS=172.30.0.10 \
  -e CASSANDRA_PORT=9042 \
  -e ETL_SOURCE_IP=172.30.0.3 \
  -e ETL_SOURCE_WS_PORT=6005 \
  -e ETL_SOURCE_GRPC_PORT=50051 \
  -p 51233:51233 \
  honeycluster/clio-envt:latest
```

### Example: docker-compose (env variables)

```yaml
services:
  clio-envt:
    image: honeycluster/clio-envt:latest
    container_name: clio-envt
    restart: unless-stopped
    environment:
      - CASSANDRA_CONTACT_POINTS=172.30.0.10
      - CASSANDRA_PORT=9042
      - CASSANDRA_KEYSPACE=clio
      - ETL_SOURCE_IP=172.30.0.3
      - ETL_SOURCE_WS_PORT=6005
      - ETL_SOURCE_GRPC_PORT=50051
    ports:
      - '51233:51233'
    healthcheck:
      test: ['CMD', 'clio_server', 'info']
      interval: 30s
      timeout: 10s
      retries: 3
```

### Example: docker-compose with `.env` file

```yaml
services:
  clio-envt:
    image: honeycluster/clio-envt:latest
    container_name: clio-envt
    restart: unless-stopped
    env_file: .env
    ports:
      - '51233:51233'
    healthcheck:
      test: ['CMD', 'clio_server', 'info']
      interval: 30s
      timeout: 10s
      retries: 3
```

Run with `docker compose up -d`. Variables from `.env` are loaded into the container.

## Configuration

All options can be overridden via **environment variables**. The entrypoint injects them into the config from templates. See [Configuration](https://github.com/honeycluster/docker/blob/develop/src/clio/docs/configuration.md) for the full list and override behavior.

## See also

- [Configuration options](https://github.com/honeycluster/docker/blob/develop/src/clio/docs/configuration.md)
- [Base image](https://github.com/honeycluster/docker/blob/develop/src/clio/docs/base.md) — static config, no envsubst
- [Slim image](https://github.com/honeycluster/docker/blob/develop/src/clio/docs/slim.md) — Debian slim, minimal footprint
- [Build image](https://github.com/honeycluster/docker/blob/develop/src/clio/docs/build.md) — build Clio from source
