# --- build stage: xrpld binary build using conan ---
FROM ubuntu:22.04 AS build

# Image Labels
LABEL maintainer="honeycluster <r@honeycluster.io>"
LABEL org.opencontainers.image.title="xrpld-build"
LABEL org.opencontainers.image.description="XRPL node (minimal image from source build)"
LABEL org.opencontainers.image.authors="honeycluster <r@honeycluster.io>"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.vendor="honeycluster"
LABEL org.opencontainers.image.url="https://github.com/honeycluster/docker"
LABEL org.opencontainers.image.documentation="https://github.com/honeycluster/docker/blob/main/docker/rippled/docs/build.md"
LABEL org.opencontainers.image.source="https://github.com/honeycluster/docker/blob/main/docker/rippled/images/build.dockerfile"

RUN export LANGUAGE=C.UTF-8; export LANG=C.UTF-8; export LC_ALL=C.UTF-8; export DEBIAN_FRONTEND=noninteractive

# Version of xrpld to build
ARG VERSION=3.0.0

# Copy the conan-build.sh script and make it executable
COPY ./scripts/conan-build.sh ./build.sh 
RUN chmod +x build.sh

# Run build using conan-build.sh script
# Log as build is running to the console
RUN stdbuf -oL -eL ./build.sh

# --- final stage: xrpld node image ---
FROM ubuntu:22.04

# OCI labels: email goes in maintainer and authors (no dedicated org.opencontainers.image.email)
LABEL maintainer="honeycluster <r@honeycluster.io>"
LABEL org.opencontainers.image.title="xrpld-stripped"
LABEL org.opencontainers.image.description="XRPL node (minimal image from ripple.com packages)"
LABEL org.opencontainers.image.authors="honeycluster <r@honeycluster.io>"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.vendor="honeycluster"
LABEL org.opencontainers.image.url="https://github.com/honeycluster/docker"
LABEL org.opencontainers.image.source="https://github.com/honeycluster/docker/blob/main/docker/xrpld/images/build.dockerfile"
LABEL org.opencontainers.image.documentation="https://github.com/honeycluster/docker/blob/main/docker/xrpld/docs/build.md"

# Copy the xrpld binary and configuration files
COPY --from=build /opt/xrpl/.build/bin /opt/xrpl/bin
COPY --from=build /opt/xrpl/cfg/rippled.cfg /opt/xrpl/etc/xrpld.cfg
COPY --from=build /opt/xrpl/cfg/validators.txt /opt/xrpl/etc/validators.txt

# Update the package list
RUN apt-get -y update

# Set the path and create a symlink for the rippled binary
RUN export PATH=$PATH:/opt/xrpl/bin/ && \
    ln -s /opt/xrpl/bin/xrpld /usr/bin/rippled && \
    ln -s /opt/xrpl/bin/xrpld /usr/local/bin/rippled

# Set the working directory
WORKDIR /opt/xrpl

# Scripts (entrypoint, configure, defaults, envsubst/injection) + conf template
COPY scripts ./scripts

# Set the entrypoint to the entrypoint.sh script
ENTRYPOINT ["./scripts/entrypoint.sh"]
