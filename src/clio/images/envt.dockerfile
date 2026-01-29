ARG PLATFORM=linux/amd64
FROM --platform=$PLATFORM ubuntu:24.04

# Image Labels
LABEL maintainer="honeycluster <r@honeycluster.io>"
LABEL org.opencontainers.image.title="clio-envt"
LABEL org.opencontainers.image.description="Clio server (envt image from clio deb)"
LABEL org.opencontainers.image.authors="honeycluster <r@honeycluster.io>"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.vendor="honeycluster"
LABEL org.opencontainers.image.url="https://github.com/honeycluster/docker"
LABEL org.opencontainers.image.source="https://github.com/honeycluster/docker/blob/develop/src/clio/images/envt.dockerfile"
LABEL org.opencontainers.image.documentation="https://github.com/honeycluster/docker/blob/develop/src/clio/docs/BUILD.md"

# Clio deb version to install (apt-cache madison clio)
# https://github.com/XRPLF/clio/releases
ARG VERSION=${VERSION:-2.7.0}

RUN export LANGUAGE=C.UTF-8; export LANG=C.UTF-8; export LC_ALL=C.UTF-8; export DEBIAN_FRONTEND=noninteractive

# Update the package list and install utilities (gettext-base for envsubst, openssl for ssl.sh)
RUN apt-get -y update && \
    apt-get -y install --no-install-recommends \
    apt-transport-https \
    ca-certificates \
    wget \
    gnupg \
    gettext-base \
    openssl

# Add Ripple's package repository and install Clio
RUN wget -qO- "https://repos.ripple.com/repos/api/gpg/key/public" | gpg --dearmor -o /usr/share/keyrings/ripple.gpg && \
    echo "deb [signed-by=/usr/share/keyrings/ripple.gpg] https://repos.ripple.com/repos/rippled-deb noble stable" | tee /etc/apt/sources.list.d/ripple.list && \
    apt-get -y update && \
    apt-get -y install clio${VERSION:+=${VERSION}} && \
    rm -rf /var/lib/apt/lists/* && \
    apt-get clean

# Package installs to /opt/clio (config at /opt/clio/etc/config.json)
ENV PATH="/opt/clio/bin:${PATH}"

# Create symlinks for clio_server
RUN mkdir -p /etc/opt/clio && \
    ln -sf /opt/clio/bin/clio_server /usr/bin/clio_server && \
    ln -sf /opt/clio/bin/clio_server /usr/local/bin/clio_server

WORKDIR /opt/clio

# Create directory structure for template defaults
RUN mkdir -p db log

# Copy configuration templates for envsubst processing
COPY etc ./templates

# Copy all entrypoint/configure scripts and make executable
COPY scripts ./scripts
RUN find /opt/clio/scripts -name '*.sh' -exec chmod +x {} \;

ENTRYPOINT ["./scripts/entrypoint.sub.sh"]
