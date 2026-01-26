ARG PLATFORM=linux/amd64
FROM --platform=$PLATFORM ubuntu:22.04

# Image Labels
LABEL maintainer="honeycluster <r@honeycluster.io>"
LABEL org.opencontainers.image.title="xrpld"
LABEL org.opencontainers.image.description="XRPL node (minimal image: static config, no envsubst)"
LABEL org.opencontainers.image.authors="honeycluster <r@honeycluster.io>"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.vendor="honeycluster"
LABEL org.opencontainers.image.url="https://github.com/honeycluster/docker"
LABEL org.opencontainers.image.source="https://github.com/honeycluster/docker/blob/main/docker/xrpld/images/slim.dockerfile"
LABEL org.opencontainers.image.documentation="https://github.com/honeycluster/docker/blob/main/docker/xrpld/docs/slim.md"

# Version of rippled to install
# https://github.com/ripple/rippled/releases or apt-cache madison ripple
ARG RIPPLED_VERSION=3.0.0-1

RUN export LANGUAGE=C.UTF-8; export LANG=C.UTF-8; export LC_ALL=C.UTF-8; export DEBIAN_FRONTEND=noninteractive

# Update the package list and install the necessary packages
RUN apt-get -y update

# Install necessary packages (gettext-base for envsubst, openssl for ssl.sh)
RUN apt-get -y install --no-install-recommends \
    apt-transport-https \
    ca-certificates \
    wget \
    gnupg \
    gettext-base \
    openssl

# Add the Ripple repository and install rippled
RUN wget -qO- "https://repos.ripple.com/repos/api/gpg/key/public" | gpg --dearmor -o /usr/share/keyrings/ripple.gpg && \
    echo "deb [signed-by=/usr/share/keyrings/ripple.gpg] https://repos.ripple.com/repos/rippled-deb jammy stable" | tee /etc/apt/sources.list.d/ripple.list && \
    apt-get -y update && \
    apt-get -y install rippled=${RIPPLED_VERSION} && \
    rm -rf /var/lib/apt/lists/* && \
    apt-get clean

# Move /opt/ripple to /opt/xrpl (rippled deb installs to /opt/ripple)
RUN cp -r /opt/ripple /opt/xrpl && \
    rm -rf /opt/ripple && \
    rm -rf /opt/xrpl/etc/* && \
    mkdir -p /opt/xrpl/etc

# Set the path and create a symlink for the rippled binary
RUN export PATH=$PATH:/opt/xrpl/bin/ && \
    ln -s /opt/xrpl/bin/rippled /usr/bin/rippled

# Set the working directory
WORKDIR /opt/xrpl

RUN mkdir -p db && \
    mkdir -p log

# Copy the configuration files
COPY etc/validators-exmple.txt ./etc/validators.txt
COPY etc/xrpld-example.cfg ./etc/xrpld.cfg

# Copy all entrypoint/configure scripts and make executable
COPY scripts ./scripts
RUN find /opt/xrpl/scripts -name '*.sh' -exec chmod +x {} \;

# Set the entrypoint to the entrypoint.sh script
ENTRYPOINT ["./scripts/entrypoint.slim.sh"]
