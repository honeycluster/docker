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
# DESC:  Shared runtime setup for Ubuntu-based images (base, envt)
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

# Create symlinks for backward compatibility (rippled -> xrpld)
RUN mkdir -p /etc/opt/ripple && \
    ln -sf /opt/xrpl/bin/xrpld /usr/bin/rippled && \
    ln -sf /opt/xrpl/bin/xrpld /usr/local/bin/rippled && \
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

# Copy and prepare scripts
COPY scripts ./scripts
RUN find /opt/xrpl/scripts -name '*.sh' -exec chmod +x {} \;

# =============================================================================
# STAGE: base
# DESC:  Standard xrpld runtime image (Ubuntu-based)
# DOCS:  src/xrpld/docs/build.md
# =============================================================================
FROM common AS base

LABEL maintainer="honeycluster <r@honeycluster.io>"
LABEL org.opencontainers.image.title="xrpld"
LABEL org.opencontainers.image.description="XRPL node (standard image from source build)"
LABEL org.opencontainers.image.authors="honeycluster <r@honeycluster.io>"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.vendor="honeycluster"
LABEL org.opencontainers.image.url="https://github.com/honeycluster/docker"
LABEL org.opencontainers.image.source="https://github.com/honeycluster/docker/blob/develop/src/xrpld/images/build.dockerfile"
LABEL org.opencontainers.image.documentation="https://github.com/honeycluster/docker/blob/develop/src/xrpld/docs/base.md"

ENTRYPOINT ["./scripts/entrypoint.sh"]


# =============================================================================
# STAGE: slim
# DESC:  Minimal xrpld runtime image (Debian-based, smaller footprint)
# DOCS:  src/xrpld/docs/slim.md
# NOTE:  Cannot inherit from common due to different base image
# =============================================================================
FROM debian:trixie-slim AS slim

LABEL maintainer="honeycluster <r@honeycluster.io>"
LABEL org.opencontainers.image.title="xrpld-slim"
LABEL org.opencontainers.image.description="XRPL node (minimal image from source build)"
LABEL org.opencontainers.image.authors="honeycluster <r@honeycluster.io>"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.vendor="honeycluster"
LABEL org.opencontainers.image.url="https://github.com/honeycluster/docker"
LABEL org.opencontainers.image.source="https://github.com/honeycluster/docker/blob/develop/src/xrpld/images/build.dockerfile"
LABEL org.opencontainers.image.documentation="https://github.com/honeycluster/docker/blob/develop/src/xrpld/docs/slim.md"

RUN export LANGUAGE=C.UTF-8; export LANG=C.UTF-8; export LC_ALL=C.UTF-8; export DEBIAN_FRONTEND=noninteractive

# Install dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    cron \
    logrotate 

# Copy the xrpld binary from build stage (canonical path from install step)
COPY --from=build /opt/xrpl/bin/xrpld /opt/xrpl/bin/xrpld

ENV PATH="/opt/xrpl/bin:${PATH}"

# Create symlinks for backward compatibility (rippled -> xrpld)
RUN mkdir -p /etc/opt/ripple && \
    ln -sf /opt/xrpl/bin/xrpld /usr/bin/rippled && \
    ln -sf /opt/xrpl/bin/xrpld /usr/local/bin/rippled && \
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

# Copy and prepare scripts
COPY scripts ./scripts
RUN find /opt/xrpl/scripts -name '*.sh' -exec chmod +x {} \;

ENTRYPOINT ["./scripts/entrypoint.sh"]


# =============================================================================
# STAGE: envt
# DESC:  Environment template image with envsubst config generation
# DOCS:  src/xrpld/docs/envt.md
# =============================================================================
FROM common AS envt

LABEL maintainer="honeycluster <r@honeycluster.io>"
LABEL org.opencontainers.image.title="xrpld-envt"
LABEL org.opencontainers.image.description="XRPL node (env template image from source build)"
LABEL org.opencontainers.image.authors="honeycluster <r@honeycluster.io>"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.vendor="honeycluster"
LABEL org.opencontainers.image.url="https://github.com/honeycluster/docker"
LABEL org.opencontainers.image.source="https://github.com/honeycluster/docker/blob/develop/src/xrpld/images/build.dockerfile"
LABEL org.opencontainers.image.documentation="https://github.com/honeycluster/docker/blob/develop/src/xrpld/docs/envt.md"

# Install necessary packages (gettext-base for envsubst, openssl for ssl.sh)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    gettext-base \
    openssl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /opt/xrpl

# Copy configuration templates for envsubst processing
COPY etc ./templates
COPY logrotate/xrpld.template ./templates/logrotate/xrpld.template

ENTRYPOINT ["./scripts/entrypoint.sub.sh"]
