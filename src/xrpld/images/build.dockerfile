# --- build stage: xrpld binary build using conan ---
FROM ubuntu:24.04 AS build

# Image Labels
LABEL maintainer="honeycluster <r@honeycluster.io>"
LABEL org.opencontainers.image.title="xrpld-build"
LABEL org.opencontainers.image.description="XRPL node (minimal image from source build)"
LABEL org.opencontainers.image.authors="honeycluster <r@honeycluster.io>"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.vendor="honeycluster"
LABEL org.opencontainers.image.url="https://github.com/honeycluster/docker"
LABEL org.opencontainers.image.documentation="https://github.com/honeycluster/docker/blob/main/src/xrpld/docs/build.md"
LABEL org.opencontainers.image.source="https://github.com/honeycluster/docker/blob/main/src/xrpld/images/build.dockerfile"

RUN export LANGUAGE=C.UTF-8; export LANG=C.UTF-8; export LC_ALL=C.UTF-8; export DEBIAN_FRONTEND=noninteractive

# Build arguments
ARG VERSION, BRANCH, GCC_RELEASE, CONAN_VERSION, CMAKE_VERSION, PYTHON_VERSION

# Copy build.sh script and make it executable
COPY ./scripts/build.sh ./build.sh 
RUN chmod +x build.sh

# Log as build is running to the console
RUN VERSION="${VERSION}" \
    GCC_RELEASE="${GCC_RELEASE:-14}" \
    CONAN_VERSION="${CONAN_VERSION:-2.24}" \
    BRANCH="${BRANCH:-develop}" \
    stdbuf -oL -eL ./build.sh

# --- base stage: xrpld node image ---
FROM ubuntu:24.04 AS base

# OCI labels
LABEL maintainer="honeycluster <r@honeycluster.io>"
LABEL org.opencontainers.image.title="xrpld"
LABEL org.opencontainers.image.description="XRPL node (basic image from source build)"
LABEL org.opencontainers.image.authors="honeycluster <r@honeycluster.io>"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.vendor="honeycluster"
LABEL org.opencontainers.image.url="https://github.com/honeycluster/docker"
LABEL org.opencontainers.image.source="https://github.com/honeycluster/docker/blob/main/docker/xrpld/images/build.dockerfile"
LABEL org.opencontainers.image.documentation="https://github.com/honeycluster/docker/blob/main/docker/xrpld/docs/build.md"

RUN export LANGUAGE=C.UTF-8; export LANG=C.UTF-8; export LC_ALL=C.UTF-8; export DEBIAN_FRONTEND=noninteractive

# Copy the xrpld binary from build stage
COPY --from=build /opt/xrpl/.build/xrpld /opt/xrpl/bin/xrpld

# Update the package list
RUN apt-get -y update

# Install necessary packages (gettext-base for envsubst, openssl for ssl.sh)
RUN apt-get -y install --no-install-recommends \
    gettext-base \
    openssl && \
    rm -rf /var/lib/apt/lists/* && \
    apt-get clean

# Set PATH to include /opt/xrpl/bin for runtime
ENV PATH="/opt/xrpl/bin:${PATH}"

# Set the working directory
WORKDIR /opt/xrpl

RUN mkdir -p db && \
    mkdir -p log && \
    mkdir -p /etc/opt/ripple

# Copy static configuration files
COPY etc/validators-exmple.txt ./etc/validators.txt
COPY etc/xrpld-example.cfg ./etc/xrpld.cfg

# Create symlinks for the rippled binary and config
RUN ln -sf /opt/xrpl/bin/xrpld /opt/xrpl/bin/rippled && \
    ln -sf /opt/xrpl/bin/xrpld /usr/bin/rippled && \
    ln -sf /opt/xrpl/bin/xrpld /usr/local/bin/rippled && \
    ln -sf /opt/xrpl/etc/xrpld.cfg /etc/opt/ripple/rippled.cfg

# Copy configuration templates
COPY etc ./templates

# Copy all entrypoint/configure scripts and make executable
COPY scripts ./scripts
RUN find /opt/xrpl/scripts -name '*.sh' -exec chmod +x {} \;

# Set the entrypoint to the entrypoint.sh script
ENTRYPOINT ["./scripts/entrypoint.sh"]

# --- slim stage: xrpld node image ---
FROM ubuntu:24.04 AS slim

# OCI labels
LABEL maintainer="honeycluster <r@honeycluster.io>"
LABEL org.opencontainers.image.title="xrpld"
LABEL org.opencontainers.image.description="XRPL node (minimal image from source build)"
LABEL org.opencontainers.image.authors="honeycluster <r@honeycluster.io>"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.vendor="honeycluster"
LABEL org.opencontainers.image.url="https://github.com/honeycluster/docker"
LABEL org.opencontainers.image.source="https://github.com/honeycluster/docker/blob/main/docker/xrpld/images/build.dockerfile"
LABEL org.opencontainers.image.documentation="https://github.com/honeycluster/docker/blob/main/docker/xrpld/docs/slim.md"

RUN export LANGUAGE=C.UTF-8; export LANG=C.UTF-8; export LC_ALL=C.UTF-8; export DEBIAN_FRONTEND=noninteractive

# Copy the xrpld binary from build stage
COPY --from=build /opt/xrpl/.build/xrpld /opt/xrpl/bin/xrpld

# Update the package list
RUN apt-get -y update

# Install necessary packages (gettext-base for envsubst, openssl for ssl.sh)
RUN apt-get -y install --no-install-recommends \
    gettext-base \
    openssl && \
    rm -rf /var/lib/apt/lists/* && \
    apt-get clean

# Set PATH to include /opt/xrpl/bin for runtime
ENV PATH="/opt/xrpl/bin:${PATH}"

# Set the working directory
WORKDIR /opt/xrpl

RUN mkdir -p db && \
    mkdir -p log && \
    mkdir -p etc && \
    mkdir -p /etc/opt/ripple

# Copy static configuration files (no templates)
COPY etc/validators-exmple.txt ./etc/validators.txt
COPY etc/xrpld-example.cfg ./etc/xrpld.cfg

# Create symlinks for the rippled binary and config
RUN ln -sf /opt/xrpl/bin/xrpld /opt/xrpl/bin/rippled && \
    ln -sf /opt/xrpl/bin/xrpld /usr/bin/rippled && \
    ln -sf /opt/xrpl/bin/xrpld /usr/local/bin/rippled && \
    ln -sf /opt/xrpl/etc/xrpld.cfg /etc/opt/ripple/rippled.cfg

# Copy all entrypoint/configure scripts and make executable
COPY scripts ./scripts
RUN find /opt/xrpl/scripts -name '*.sh' -exec chmod +x {} \;

# Set the entrypoint to the entrypoint.slim.sh script
ENTRYPOINT ["./scripts/entrypoint.slim.sh"]