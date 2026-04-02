# =============================================================================
# STAGE: build
# DESC:  Compiles rippled binary from source using conan
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

# Copy the rippled binary from build stage
COPY --from=build /opt/ripple/bin/rippled /opt/ripple/bin/rippled

ENV PATH="/opt/ripple/bin:${PATH}"

# Create symlinks so the binary finds config at its default search paths
RUN mkdir -p /etc/opt/ripple /etc/opt/xrpld && \
    ln -sf /opt/ripple/etc/rippled.cfg /etc/opt/ripple/rippled.cfg && \
    ln -sf /opt/ripple/etc/validators.txt /etc/opt/ripple/validators.txt && \
    ln -sf /opt/ripple/etc/rippled.cfg /etc/opt/xrpld/rippled.cfg && \
    ln -sf /opt/ripple/etc/validators.txt /etc/opt/xrpld/validators.txt

WORKDIR /opt/ripple

# Create directory structure
RUN mkdir -p db log etc

# Copy static configuration files
COPY etc/validators-exmple.txt ./etc/validators.txt
COPY etc/rippled-example.cfg ./etc/rippled.cfg

# Logrotate for rippled logs (default LOGS_DIR)
COPY logrotate/rippled /etc/logrotate.d/rippled

# Copy README and scripts
COPY README ./README
COPY scripts ./scripts
RUN find /opt/ripple/scripts -name '*.sh' -exec chmod +x {} \;

# =============================================================================
# STAGE: base
# DESC:  Standard rippled runtime image (Ubuntu-based)
# DOCS:  docs/rippled/build.md
# =============================================================================
FROM common AS base

LABEL maintainer="honeycluster <r@honeycluster.io>"
LABEL org.opencontainers.image.title="rippled"
LABEL org.opencontainers.image.description="XRPL node (standard image from source build)"
LABEL org.opencontainers.image.authors="honeycluster <r@honeycluster.io>"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.vendor="honeycluster"
LABEL org.opencontainers.image.url="https://github.com/honeycluster/nodekit"
LABEL org.opencontainers.image.source="https://github.com/honeycluster/nodekit/blob/develop/packages/docker/rippled/images/build.dockerfile"
LABEL org.opencontainers.image.documentation="https://github.com/honeycluster/nodekit/blob/develop/docs/rippled/base.md"

ENTRYPOINT ["./scripts/entrypoint.sh"]
