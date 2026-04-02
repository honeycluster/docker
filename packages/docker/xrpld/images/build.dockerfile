# =============================================================================
# STAGE: build
# DESC:  Compiles xrpld binary from source using conan
# =============================================================================
FROM ubuntu:24.04 AS build

RUN export LANGUAGE=C.UTF-8; export LANG=C.UTF-8; export LC_ALL=C.UTF-8; export DEBIAN_FRONTEND=noninteractive

ARG VERSION
ARG BRANCH
ARG GCC_RELEASE
ARG CONAN_VERSION
ARG CMAKE_VERSION
ARG PYTHON_VERSION

COPY ./scripts/build.sh ./build.sh
RUN chmod +x build.sh

RUN VERSION="${VERSION}" \
    GCC_RELEASE="${GCC_RELEASE:-14}" \
    CONAN_VERSION="${CONAN_VERSION:-2.24}" \
    BRANCH="${BRANCH:-develop}" \
    stdbuf -oL -eL ./build.sh

# =============================================================================
# STAGE: common
# DESC:  Shared runtime setup for Ubuntu-based images
# =============================================================================

FROM ubuntu:24.04 AS common

RUN export LANGUAGE=C.UTF-8; export LANG=C.UTF-8; export LC_ALL=C.UTF-8; export DEBIAN_FRONTEND=noninteractive

# Install dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    cron \
    logrotate

# Copy the xrpld binary from build stage
COPY --from=build /opt/xrpl/bin/xrpld /opt/xrpl/bin/xrpld

ENV PATH="/opt/xrpl/bin:${PATH}"

# Create symlinks so the binary finds config at its default search paths
RUN mkdir -p /etc/opt/xrpld /etc/opt/ripple && \
    ln -sf /opt/xrpl/bin/xrpld /usr/bin/rippled && \
    ln -sf /opt/xrpl/bin/xrpld /usr/local/bin/rippled && \
    ln -sf /opt/xrpl/etc/xrpld.cfg /etc/opt/xrpld/rippled.cfg && \
    ln -sf /opt/xrpl/etc/validators.txt /etc/opt/xrpld/validators.txt && \
    ln -sf /opt/xrpl/etc/xrpld.cfg /etc/opt/ripple/rippled.cfg && \
    ln -sf /opt/xrpl/etc/validators.txt /etc/opt/ripple/validators.txt

WORKDIR /opt/xrpl

# Create directory structure
RUN mkdir -p db log etc

# Copy static configuration files
COPY etc/validators-exmple.txt ./etc/validators.txt
COPY etc/xrpld-example.cfg ./etc/xrpld.cfg

# Logrotate for xrpld logs (default LOGS_DIR)
COPY logrotate/xrpld /etc/logrotate.d/xrpld

# Copy README and scripts
COPY README ./README
COPY scripts ./scripts
RUN find /opt/xrpl/scripts -name '*.sh' -exec chmod +x {} \;

# =============================================================================
# STAGE: base
# DESC:  Standard xrpld runtime image (Ubuntu-based)
# DOCS:  docs/xrpld/build.md
# =============================================================================
FROM common AS base

LABEL maintainer="honeycluster <r@honeycluster.io>"
LABEL org.opencontainers.image.title="xrpld"
LABEL org.opencontainers.image.description="XRPL node (standard image from source build)"
LABEL org.opencontainers.image.authors="honeycluster <r@honeycluster.io>"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.vendor="honeycluster"
LABEL org.opencontainers.image.url="https://github.com/honeycluster/nodekit"
LABEL org.opencontainers.image.source="https://github.com/honeycluster/nodekit/blob/develop/packages/docker/xrpld/images/build.dockerfile"
LABEL org.opencontainers.image.documentation="https://github.com/honeycluster/nodekit/blob/develop/docs/xrpld/base.md"

ENTRYPOINT ["./scripts/entrypoint.sh"]
