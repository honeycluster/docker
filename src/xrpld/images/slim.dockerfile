ARG PLATFORM=linux/amd64
FROM --platform=$PLATFORM debian:bookworm-slim

# Image Labels
LABEL maintainer="honeycluster <r@honeycluster.io>"
LABEL org.opencontainers.image.title="xrpld"
LABEL org.opencontainers.image.description="XRPL node (minimal image: static config)"
LABEL org.opencontainers.image.authors="honeycluster <r@honeycluster.io>"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.vendor="honeycluster"
LABEL org.opencontainers.image.url="https://github.com/honeycluster/docker"
LABEL org.opencontainers.image.source="https://github.com/honeycluster/docker/blob/main/src/xrpld/images/slim.dockerfile"
LABEL org.opencontainers.image.documentation="https://github.com/honeycluster/docker/blob/main/src/xrpld/docs/slim.md"

# xrpld deb version to install (apt-cache madison rippled)
# https://github.com/ripple/rippled/releases
ARG VERSION=${VERSION:-3.0.0-1}

RUN export LANGUAGE=C.UTF-8; export LANG=C.UTF-8; export LC_ALL=C.UTF-8; export DEBIAN_FRONTEND=noninteractive

# Update the package list and install the necessary packages
RUN apt-get -y update

# Install necessary packages
RUN apt-get -y install --no-install-recommends \
    apt-transport-https \
    ca-certificates \
    wget \
    gnupg 

# Add the Ripple repository and install rippled
RUN wget -qO- "https://repos.ripple.com/repos/api/gpg/key/public" | gpg --dearmor -o /usr/share/keyrings/ripple.gpg && \
    echo "deb [signed-by=/usr/share/keyrings/ripple.gpg] https://repos.ripple.com/repos/rippled-deb bookworm stable" | tee /etc/apt/sources.list.d/ripple.list && \
    apt-get -y update && \
    apt-get -y install rippled=${VERSION} && \
    rm -rf /var/lib/apt/lists/* && \
    apt-get clean

# Move /opt/ripple to /opt/xrpl (rippled deb installs to /opt/ripple)
RUN mkdir -p /opt/xrpl/bin /opt/xrpl/etc && \
    mv /opt/ripple/bin/rippled /opt/xrpl/bin/xrpld && \
    mv /opt/ripple/etc/rippled.cfg /opt/xrpl/etc/xrpld.cfg && \
    mv /opt/ripple/etc/validators.txt /opt/xrpl/etc/validators.txt && \
    rm -rf /opt/ripple

# Set PATH to include /opt/xrpl/bin for runtime
ENV PATH="/opt/xrpl/bin:${PATH}"

# Create symlinks for the rippled binary and config
RUN mkdir -p /etc/opt/ripple && \
    ln -sf /opt/xrpl/bin/xrpld /usr/bin/rippled && \
    ln -sf /opt/xrpl/bin/xrpld /usr/local/bin/rippled && \
    ln -sf /opt/xrpl/etc/xrpld.cfg /etc/opt/ripple/rippled.cfg && \
    ln -sf /opt/xrpl/etc/validators.txt /etc/opt/ripple/validators.txt

# Set the working directory
WORKDIR /opt/xrpl

# Copy all entrypoint/configure scripts and make executable
COPY scripts ./scripts
RUN find /opt/xrpl/scripts -name '*.sh' -exec chmod +x {} \;

# Set the entrypoint to the entrypoint.sh script
ENTRYPOINT ["./scripts/entrypoint.sh"]
