# =============================================================================
# STAGE: build
# DESC:  Compiles clio_server binary from source using conan
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

# Copy the clio_server binary from build stage
COPY --from=build /opt/clio/build/clio_server /opt/clio/bin/clio_server

ENV PATH="/opt/clio/bin:${PATH}"

# Create symlinks for clio_server
RUN mkdir -p /etc/opt/clio && \
    ln -sf /opt/clio/bin/clio_server /usr/bin/clio_server && \
    ln -sf /opt/clio/bin/clio_server /usr/local/bin/clio_server

WORKDIR /opt/clio

# Create directory structure
RUN mkdir -p db log etc

# Copy static configuration files
COPY etc/example-config.json ./etc/config.json

# Copy and prepare scripts
COPY scripts ./scripts
RUN find /opt/clio/scripts -name '*.sh' -exec chmod +x {} \;

# =============================================================================
# STAGE: base
# DESC:  Standard clio runtime image (Ubuntu-based)
# =============================================================================
FROM common AS base

LABEL maintainer="honeycluster <r@honeycluster.io>"
LABEL org.opencontainers.image.title="clio"
LABEL org.opencontainers.image.description="Clio server (standard image from source build)"
LABEL org.opencontainers.image.authors="honeycluster <r@honeycluster.io>"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.vendor="honeycluster"
LABEL org.opencontainers.image.url="https://github.com/honeycluster/docker"
LABEL org.opencontainers.image.source="https://github.com/honeycluster/docker/blob/develop/packages/docker/clio/images/build.dockerfile"
LABEL org.opencontainers.image.documentation="https://github.com/honeycluster/docker/blob/develop/docs/clio/base.md"

ENTRYPOINT ["./scripts/entrypoint.sh"]
