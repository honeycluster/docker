# Docker Patterns Skill

Docker infrastructure patterns for Honeycluster XRPL services.

## Multi-Stage Build Pattern

```dockerfile
# ============================================================
# Stage 1: Build from source
# ============================================================
FROM ubuntu:24.04 AS build

ARG REPO_URL=https://github.com/XRPLF/rippled.git
ARG REPO_TAG=develop

RUN apt-get update && apt-get install -y \
    git cmake pkg-config python3-pip \
    libssl-dev libprotobuf-dev protobuf-compiler \
    && pip3 install conan

WORKDIR /opt/build
RUN git clone --depth 1 --branch ${REPO_TAG} ${REPO_URL} . \
    && mkdir build && cd build \
    && conan install .. --output-folder=. --build=missing \
    && cmake .. -DCMAKE_BUILD_TYPE=Release \
    && cmake --build . --parallel $(nproc)

# ============================================================
# Stage 2: Common runtime
# ============================================================
FROM ubuntu:24.04 AS common

RUN apt-get update && apt-get install -y --no-install-recommends \
    libssl3 libprotobuf-lite32 ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd -r xrpl && useradd -r -g xrpl -d /opt/xrpl xrpl

COPY --from=build /opt/build/build/rippled /opt/xrpl/bin/rippled
COPY etc/ /opt/xrpl/etc/
COPY scripts/ /opt/xrpl/scripts/

RUN chown -R xrpl:xrpl /opt/xrpl

# ============================================================
# Stage 3: Published base image
# ============================================================
FROM common AS base

USER xrpl
WORKDIR /opt/xrpl

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -sf http://localhost:6006 || exit 1

ENTRYPOINT ["/opt/xrpl/scripts/entrypoint.sh"]
```

## Entrypoint Pattern

```bash
#!/bin/bash
set -euo pipefail

source "$(dirname "$0")/utils/logging.sh"

# Validate environment
: "${NETWORK:=mainnet}"
log_info "Starting with network: $NETWORK"

# Generate config from environment
config-gen --network "$NETWORK" --output /opt/xrpl/etc/xrpld.cfg

# Trap signals for graceful shutdown
trap 'source "$(dirname "$0")/shutdown.sh"' SIGTERM SIGINT

# Start the service
exec /opt/xrpl/bin/rippled --conf /opt/xrpl/etc/xrpld.cfg "$@"
```

## CI/CD Workflow Pattern

```yaml
name: Publish Image
on:
  workflow_dispatch:
    inputs:
      tag:
        description: 'Release tag'
        required: true

jobs:
  build:
    runs-on: [self-hosted, group:Onprem]
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/build-push-action@v5
        with:
          context: ./src/xrpld
          target: base
          cache-from: type=gha
          cache-to: type=gha,mode=max
          push: true
          tags: |
            xrplf/xrpld:${{ inputs.tag }}
            ghcr.io/xrplf/xrpld:${{ inputs.tag }}
```

## Local Build & Test

```bash
# Build image locally
cd packages/docker/xrpld && bash scripts/build-rc.sh

# Run with custom config
docker run -d \
  -e NETWORK=testnet \
  -p 6006:6006 \
  xrpld:local

# View logs
docker logs -f <container_id>
```

## Docker Compose for Dev

```yaml
services:
  xrpld:
    build:
      context: ./src/xrpld
      target: base
    environment:
      - NETWORK=testnet
    ports:
      - "6006:6006"
    volumes:
      - xrpld-data:/opt/xrpl/data
    healthcheck:
      test: ["CMD", "curl", "-sf", "http://localhost:6006"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  xrpld-data:
```
