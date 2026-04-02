FROM scylladb/scylla:latest

LABEL maintainer="honeycluster <r@honeycluster.io>"
LABEL org.opencontainers.image.title="scylla-base"
LABEL org.opencontainers.image.description="ScyllaDB base image with entrypoint"
LABEL org.opencontainers.image.authors="honeycluster <r@honeycluster.io>"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.vendor="honeycluster"
LABEL org.opencontainers.image.url="https://github.com/honeycluster/nodekit"
LABEL org.opencontainers.image.source="https://github.com/honeycluster/nodekit/blob/develop/src/scylla/images/base.dockerfile"
LABEL org.opencontainers.image.documentation="https://github.com/honeycluster/nodekit/blob/develop/src/scylla/docs/base.md"

COPY etc/scylla.yaml /etc/scylla/scylla.yaml

WORKDIR /opt/scylladb

# Copy all entrypoint/configure scripts
COPY scripts ./scripts

# scylladb/scylla base often denies exec on scripts; run via bash explicitly
ENTRYPOINT ["/bin/bash", "./scripts/entrypoint.sh"]

# epoll avoids io_uring/mbind/perf_event warnings in Docker (especially on macOS)
CMD ["--developer-mode=1", "--smp=1", "--overprovisioned", "--reactor-backend=epoll"]
