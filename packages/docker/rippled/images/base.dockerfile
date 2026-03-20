ARG PLATFORM=linux/amd64
FROM --platform=$PLATFORM ubuntu:24.04

# Image Labels
LABEL maintainer="honeycluster <r@honeycluster.io>"
LABEL org.opencontainers.image.title="rippled"
LABEL org.opencontainers.image.description="XRPL node (standard image from rippled deb)"
LABEL org.opencontainers.image.authors="honeycluster <r@honeycluster.io>"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.vendor="honeycluster"
LABEL org.opencontainers.image.url="https://github.com/honeycluster/docker"
LABEL org.opencontainers.image.source="https://github.com/honeycluster/docker/blob/develop/packages/docker/rippled/images/base.dockerfile"
LABEL org.opencontainers.image.documentation="https://github.com/honeycluster/docker/blob/develop/docs/rippled/base.md"

# rippled deb version to install (apt-cache madison rippled)
# https://github.com/ripple/rippled/releases
ARG VERSION=${VERSION:-3.1.2-1}

RUN export LANGUAGE=C.UTF-8; export LANG=C.UTF-8; export LC_ALL=C.UTF-8; export DEBIAN_FRONTEND=noninteractive

# Update the package list and install the necessary packages
RUN apt-get -y update

# Install necessary packages
RUN apt-get -y install --no-install-recommends \
    apt-transport-https \
    ca-certificates \
    cron \
    logrotate \
    wget \
    gnupg

# Add the Ripple repository and install rippled
RUN wget -qO- "https://repos.ripple.com/repos/api/gpg/key/public" | gpg --dearmor -o /usr/share/keyrings/ripple.gpg && \
    echo "deb [signed-by=/usr/share/keyrings/ripple.gpg] https://repos.ripple.com/repos/rippled-deb noble stable" | tee /etc/apt/sources.list.d/ripple.list && \
    apt-get -y update && \
    apt-get -y install rippled=${VERSION} && \
    rm -rf /var/lib/apt/lists/* && \
    apt-get clean

# Set PATH to include /opt/ripple/bin for runtime
ENV PATH="/opt/ripple/bin:${PATH}"

# Create symlinks so the binary finds config at its default search paths
RUN mkdir -p /etc/opt/ripple /etc/opt/xrpld && \
    ln -sf /opt/ripple/etc/rippled.cfg /etc/opt/ripple/rippled.cfg && \
    ln -sf /opt/ripple/etc/validators.txt /etc/opt/ripple/validators.txt && \
    ln -sf /opt/ripple/etc/rippled.cfg /etc/opt/xrpld/rippled.cfg && \
    ln -sf /opt/ripple/etc/validators.txt /etc/opt/xrpld/validators.txt

# Set the working directory
WORKDIR /opt/ripple

# Create directory structure
RUN mkdir -p db log etc

# Replace deb's rippled logrotate with our config
RUN rm -f /etc/logrotate.d/rippled
COPY logrotate/rippled /etc/logrotate.d/rippled

# Copy all entrypoint/configure scripts and make executable
COPY scripts ./scripts
RUN find /opt/ripple/scripts -name '*.sh' -exec chmod +x {} \;

# Set the entrypoint to the entrypoint.sh script
ENTRYPOINT ["./scripts/entrypoint.sh"]
